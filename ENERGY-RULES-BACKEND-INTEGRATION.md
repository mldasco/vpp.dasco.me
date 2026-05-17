# Energy Automation Rules - Backend Integration Guide

This document maps the configurable energy automation rules to the backend strategy engine implementation.

## Overview

All rules are stored in `EnergyAutomationConfig` and persisted in DynamoDB `vpp-config` table. The `strategy-engine` Lambda function evaluates these rules every 5 minutes to make charging/discharging decisions.

---

## Rule Evaluation Flow

The strategy engine evaluates rules in **priority order** (see `decisionPriorityOrder` in config):

```typescript
// strategy-engine Lambda pseudocode
async function evaluateStrategy(config: EnergyAutomationConfig, state: SystemState) {
  // Check master switch
  if (!config.advanced.enableAutomationRules) {
    return { mode: "SELF-CONSUMPTION", reason: "Automation disabled" };
  }

  // Dry run mode check
  const dryRun = config.advanced.dryRunMode;

  // Evaluate rules in priority order
  for (const rule of config.decisionPriorityOrder.rules) {
    const decision = await evaluateRule(rule, config, state);
    if (decision) {
      if (dryRun) {
        logDecision(decision, "DRY RUN - not executing");
      }
      return decision;
    }
  }

  // Fallback: SELF-CONSUMPTION
  return { mode: "SELF-CONSUMPTION", reason: "No rules triggered" };
}
```

---

## Rule Implementation Details

### Rule 1: Battery Full Every Day

**Trigger**: Every 5-minute interval during Solar Sponge window (10am-3pm)

**Logic**:
```typescript
function evaluateRule1(config, state) {
  if (!config.rule1_batteryFullEveryDay.enabled) return null;

  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(config.rule1_batteryFullEveryDay.targetTimeHour);
  targetTime.setMinutes(config.rule1_batteryFullEveryDay.targetTimeMinute);

  // Only evaluate during Solar Sponge window or approaching target time
  if (!isInSolarSpongeWindow(config, now) && now < targetTime) {
    return null;
  }

  const currentSoC = state.batterySoC;
  const targetSoC = config.rule1_batteryFullEveryDay.targetSoC;

  if (currentSoC >= targetSoC) {
    return null; // Already at target
  }

  // Check solar forecast (requires Solcast integration)
  const solarForecastKwh = await getSolarForecast(now, targetTime);
  const batteryDeficitKwh = (targetSoC - currentSoC) / 100 * config.system.powerwallCapacityKwh;

  if (solarForecastKwh >= batteryDeficitKwh) {
    return null; // Solar alone will fill battery
  }

  // Grid top-up needed
  if (!config.rule1_batteryFullEveryDay.gridTopUpEnabled) {
    return null; // Grid top-up disabled
  }

  const currentPrice = state.buyPrice;
  if (currentPrice > config.rule1_batteryFullEveryDay.gridTopUpPriceCeiling) {
    return null; // Too expensive
  }

  return {
    mode: "CHARGING",
    reason: `Grid top-up to reach ${targetSoC}% by ${targetTime.toLocaleTimeString()}`,
    pricePaidCents: currentPrice,
  };
}
```

**Backend Integration**:
- Requires: Amber API (current buy price), Solcast API (solar forecast)
- Updates: `vpp-intervals` table with mode = "CHARGING"
- Triggers: `inverter-control` Lambda to send FORCED_CHARGE command to Sigenergy

---

### Rule 2: Never Trigger Network Demand Charge

**Trigger**: Every 5-minute interval during demand window (3pm-9pm) in peak months

**Logic**:
```typescript
function evaluateRule2(config, state) {
  if (!config.rule2_demandChargeAvoidance.enabled) return null;

  const now = new Date();
  const isPeak = isPeakMonth(config);
  const inDemandWindow = isInDemandWindow(config, now);

  if (!isPeak || !inDemandWindow) {
    return null; // Not in demand window or not peak month
  }

  // CRITICAL: Zero grid import during demand window in peak months
  if (state.gridImportKw > 0) {
    // Log critical alert
    logCriticalAlert("Grid import detected during demand window!");

    if (config.rule2_demandChargeAvoidance.loadSheddingEnabled) {
      // Future: trigger load shedding via smart plugs
      await shedNonEssentialLoads();
    }

    return {
      mode: "SELF-CONSUMPTION",
      reason: "CRITICAL: Zero import during demand window",
      alert: "Grid import detected during demand window in peak month",
    };
  }

  // Ensure battery has enough capacity to cover demand window
  const demandWindowRemainingHours = calculateRemainingDemandWindowHours(config, now);
  const avgHouseLoadKw = state.houseLoad;
  const requiredEnergyKwh = avgHouseLoadKw * demandWindowRemainingHours;
  const availableBatteryKwh = (state.batterySoC / 100) * config.system.powerwallCapacityKwh;

  if (availableBatteryKwh < requiredEnergyKwh) {
    const criticalThreshold = config.rule2_demandChargeAvoidance.lowBatteryCriticalThreshold;
    if (state.batterySoC < criticalThreshold) {
      logCriticalAlert(`Battery critically low (${state.batterySoC}%) during demand window!`);
      return {
        mode: "HOLDING",
        reason: "Battery critically low during demand window - conserve energy",
        alert: `Battery at ${state.batterySoC}% with ${demandWindowRemainingHours}h remaining in demand window`,
      };
    }
  }

  return null;
}
```

**Backend Integration**:
- Requires: Real-time battery SoC, grid import monitoring
- Alerts: CloudWatch alarm + SNS email if grid import > 0 during demand window
- Priority: **HIGHEST** - overrides all other rules

---

### Rule 3: Avoid Negative Feed-in Tariff

**Trigger**: Every 5-minute interval when export price < threshold

**Logic**:
```typescript
function evaluateRule3(config, state) {
  if (!config.rule3_negativeFITAvoidance.enabled) return null;

  const exportPrice = state.feedInPrice;

  if (exportPrice >= config.rule3_negativeFITAvoidance.stopExportBelowPrice) {
    return null; // Export price acceptable
  }

  // Negative or very low export price - stop exporting
  const excessSolar = state.solarOutput - state.houseLoad;

  if (excessSolar <= 0) {
    return null; // No excess to divert
  }

  // Follow diversion priority
  const priority = config.rule3_negativeFITAvoidance.diversionPriority;

  for (const target of priority) {
    if (target === "BATTERY") {
      if (state.batterySoC < 100) {
        return {
          mode: "CHARGING",
          reason: `Diverting excess solar to battery (export price ${exportPrice}¢ below threshold)`,
        };
      }
    } else if (target === "EV") {
      const evPluggedIn = await checkEVPluggedIn();
      const evSoC = await getEVSoC();
      if (evPluggedIn && evSoC < 100) {
        await divertToZappi(excessSolar);
        return {
          mode: "SELF-CONSUMPTION",
          reason: `Diverting excess solar to EV (export price ${exportPrice}¢)`,
        };
      }
    } else if (target === "GRID_EXPORT") {
      // Only export if above threshold
      if (exportPrice >= config.rule3_negativeFITAvoidance.stopExportBelowPrice) {
        return {
          mode: "SELLING",
          reason: "Exporting to grid",
        };
      }
    }
  }

  // Last resort: curtailment
  if (config.rule3_negativeFITAvoidance.curtailmentEnabled) {
    return {
      mode: "HOLDING",
      reason: `Curtailing excess solar (export price ${exportPrice}¢, no diversion available)`,
    };
  }

  return null;
}
```

**Backend Integration**:
- Requires: Amber API (feed-in price), Zappi API (EV control)
- Updates: `vpp-activity` table with curtailment events

---

### Rule 4: EV Tiered Charging by SoC

**Trigger**: Every 5-minute interval when EV is plugged in

**Logic**:
```typescript
function evaluateRule4(config, state) {
  if (!config.rule4_evTieredCharging.enabled) return null;

  const evPluggedIn = await checkEVPluggedIn();
  if (!evPluggedIn) {
    return null; // EV not plugged in
  }

  const evSoC = await getEVSoC();
  const tier = getEVChargingTier(config, evSoC);

  if (!tier) {
    return null; // No tier found (shouldn't happen)
  }

  // Check if in demand window (no EV charging in demand window in peak months)
  if (config.rule4_evTieredCharging.respectDemandWindow) {
    if (isPeakMonth(config) && isInDemandWindow(config)) {
      return null; // No EV charging during demand window
    }
  }

  // Check if Powerwall has priority
  if (config.rule4_evTieredCharging.lowerPriorityThanPowerwall) {
    if (state.batterySoC < config.rule1_batteryFullEveryDay.targetSoC) {
      return null; // Charge Powerwall first
    }
  }

  // Check price ceiling
  if (tier.priceCeiling === null) {
    return null; // No grid charging for this tier
  }

  const currentPrice = state.buyPrice;
  if (currentPrice > tier.priceCeiling) {
    return null; // Too expensive
  }

  // Charge EV
  await startZappiCharging(tier.priceCeiling);
  return {
    mode: "SELF-CONSUMPTION",
    reason: `Charging EV (${tier.level} tier, SoC ${evSoC}%, price ${currentPrice}¢)`,
    evCharging: true,
  };
}
```

**Backend Integration**:
- Requires: Zappi API (EV status, charge control)
- Note: Zappi handles actual charge rate throttling

---

### Rule 6: Minimum Battery Reserve

**Trigger**: Every decision (evaluated first)

**Logic**:
```typescript
function evaluateRule6(config, state) {
  if (!config.rule6_minimumBatteryReserve.enabled) return null;

  const minimumSoC = config.rule6_minimumBatteryReserve.minimumSoC;

  // Prevent any automation decision that would discharge below minimum
  if (state.batterySoC <= minimumSoC) {
    return {
      mode: "SELF-CONSUMPTION",
      reason: `Battery at minimum reserve (${minimumSoC}%)`,
      preventDischarge: true,
    };
  }

  // If a discharge decision is being considered, check if it would breach minimum
  const proposedMode = getPendingDecision()?.mode;
  if (proposedMode === "SELLING") {
    const estimatedFinalSoC = estimateSoCAfterDischarge(state, config);
    if (estimatedFinalSoC < minimumSoC) {
      return {
        mode: "HOLDING",
        reason: `Would breach minimum reserve (${minimumSoC}%)`,
        preventDischarge: true,
      };
    }
  }

  return null; // No violation
}
```

**Backend Integration**:
- Priority: **FIRST** - evaluated before all other rules
- Prevents: Any automation decision that would discharge below minimum

---

### Rule 7: Opportunistic Overnight Charging

**Trigger**: Overnight (11pm-6am) based on seasonal logic

**Logic**:
```typescript
function evaluateRule7(config, state) {
  if (!config.rule7_overnightCharging.enabled) return null;

  const now = new Date();
  const isNightTime = now.getHours() >= 23 || now.getHours() < 6;

  if (!isNightTime) {
    return null;
  }

  // Step 1: Safety net top-up
  if (config.rule7_overnightCharging.safetyNetTopUp.enabled) {
    const targetSafetyNetSoC = config.rule7_overnightCharging.safetyNetTopUp.targetSoC;
    const priceCeiling = config.rule7_overnightCharging.safetyNetTopUp.priceCeiling;

    if (state.batterySoC < targetSafetyNetSoC) {
      const currentPrice = state.buyPrice;
      if (currentPrice <= priceCeiling) {
        return {
          mode: "CHARGING",
          reason: `Overnight safety net top-up to ${targetSafetyNetSoC}% (price ${currentPrice}¢)`,
        };
      }
    }
  }

  // Step 2: Additional charging (seasonal)
  if (config.rule7_overnightCharging.additionalCharging.enabled) {
    const seasonalBehaviour = getSeasonalChargingBehaviour(config);
    if (!seasonalBehaviour || seasonalBehaviour.chargingCapPercent === null) {
      return null; // Skip overnight charging for this season
    }

    // Compare overnight price with Solar Sponge forecast
    if (config.rule7_overnightCharging.additionalCharging.compareWithSolarSponge) {
      const overnightPrice = state.buyPrice;
      const solarSpongePrice = await getAmberForecast(
        config.rule1_batteryFullEveryDay.solarSpongeWindow
      );

      if (overnightPrice >= solarSpongePrice) {
        return null; // Solar Sponge will be cheaper - wait
      }
    }

    const capSoC = seasonalBehaviour.chargingCapPercent;
    if (state.batterySoC < capSoC) {
      return {
        mode: "CHARGING",
        reason: `Overnight charging to ${capSoC}% (${seasonalBehaviour.season}, price beats Solar Sponge)`,
      };
    }
  }

  return null;
}
```

**Backend Integration**:
- Requires: Amber forecast API, Solcast forecast API
- Seasonal logic: SUMMER (skip), WINTER (charge to 80%), AUTUMN/SPRING (price-dependent)

---

### Rule 8: Negative Spot Price Maximization

**Trigger**: Any time spot price goes negative

**Logic**:
```typescript
function evaluateRule8(config, state) {
  if (!config.rule8_negativeSpotPrice.enabled) return null;

  const spotPrice = state.buyPrice;

  if (spotPrice >= config.rule8_negativeSpotPrice.negativePriceThreshold) {
    return null; // Price not negative
  }

  // OPPORTUNITY: Grid is paying us to consume!
  const actions: string[] = [];

  if (config.rule8_negativeSpotPrice.chargePowerwallTo100) {
    if (state.batterySoC < 100) {
      await chargePowerwall(100);
      actions.push("Powerwall to 100%");
    }
  }

  if (config.rule8_negativeSpotPrice.chargeEVTo100) {
    const evPluggedIn = await checkEVPluggedIn();
    const evSoC = await getEVSoC();
    if (evPluggedIn && evSoC < 100) {
      await startZappiCharging(null); // No price ceiling - charge at max rate
      actions.push("EV to 100%");
    }
  }

  if (config.rule8_negativeSpotPrice.triggerSmartAppliances) {
    // Future: trigger AC, heat pump, etc.
    await triggerHighDrawAppliances();
    actions.push("Smart appliances");
  }

  return {
    mode: "CHARGING",
    reason: `NEGATIVE PRICE (${spotPrice}¢) - charging ${actions.join(", ")}`,
    opportunity: true,
  };
}
```

**Backend Integration**:
- Priority: **HIGH** (only below Rule 6 and Rule 2)
- Overrides: All other rules except Rule 2 (demand window) and Rule 6 (minimum battery)
- Alerts: Send notification "Negative price event - maximizing consumption"

---

### Rule 9: Cloudy Day Detection

**Trigger**: Once per day at 6am

**Logic**:
```typescript
function evaluateRule9(config, state) {
  if (!config.rule9_cloudyDayDetection.enabled) return null;

  const now = new Date();
  if (now.getHours() !== 6) {
    return null; // Only evaluate at 6am
  }

  // Get Solcast forecast for today
  const todaySolarForecastKwh = await getSolcastDailyForecast();

  if (todaySolarForecastKwh >= config.rule9_cloudyDayDetection.solarForecastThreshold) {
    return null; // Good solar day - no action needed
  }

  // Cloudy day detected - grid top-up early
  const targetSoC = config.rule9_cloudyDayDetection.gridTopUpTargetSoC;

  if (state.batterySoC >= targetSoC) {
    return null; // Already at target
  }

  // Find cheapest window before 9am
  let cheapestWindow = null;
  if (config.rule9_cloudyDayDetection.usesCheapestMorningWindow) {
    cheapestWindow = await getAmberForecastCheapestWindow(
      config.rule9_cloudyDayDetection.gridTopUpWindow
    );
  }

  if (isInTimeWindow(cheapestWindow || config.rule9_cloudyDayDetection.gridTopUpWindow)) {
    return {
      mode: "CHARGING",
      reason: `Cloudy day (forecast ${todaySolarForecastKwh}kWh) - early top-up to ${targetSoC}%`,
    };
  }

  return null;
}
```

**Backend Integration**:
- Requires: Solcast daily forecast API
- Trigger: 6am daily evaluation (separate EventBridge rule)

---

## DynamoDB Schema Updates

The existing `vpp-config` table needs to be extended to store the full `EnergyAutomationConfig`:

```json
{
  "PK": "CONFIG#default",
  "SK": "METADATA",
  "userId": "default",
  
  // Legacy fields (keep for backward compatibility)
  "minExportPrice": 150,
  "minBatteryReserve": 20,
  "maxExportPower": 5,
  "commandDuration": 30,
  
  // New: Full energy rules config (JSON serialized)
  "energyRulesConfig": {
    "rule1_batteryFullEveryDay": { ... },
    "rule2_demandChargeAvoidance": { ... },
    // ... all rules
  },
  
  "updatedAt": "2026-05-17T17:34:00Z"
}
```

---

## API Endpoints for Rules Config

### GET /config/rules
Returns the current energy automation configuration.

### PUT /config/rules
Updates the energy automation configuration. Validates config before saving.

Request body:
```json
{
  "energyRulesConfig": { ... }
}
```

Response:
```json
{
  "success": true,
  "validationErrors": [],
  "updatedAt": "2026-05-17T18:00:00Z"
}
```

---

## Testing Strategy

1. **Unit Tests**: Test each rule evaluation function independently with mocked state
2. **Integration Tests**: Test full strategy engine with various scenarios
3. **Dry Run Mode**: Use `advanced.dryRunMode = true` to log decisions without executing
4. **Validation**: Frontend validates config before saving, backend validates on load

---

## Migration Path

1. **Phase 1**: Deploy new config schema to DynamoDB (default values)
2. **Phase 2**: Update strategy engine to read from new config structure
3. **Phase 3**: Deploy new frontend `/config-rules` page
4. **Phase 4**: Test in dry-run mode for 1 week
5. **Phase 5**: Enable live automation with monitoring

---

## Monitoring & Alerts

CloudWatch alarms for:
- **Rule 2 violation**: Grid import during demand window (CRITICAL)
- **Rule 6 violation**: Battery below minimum reserve (WARNING)
- **Negative price events**: Opportunity to maximize consumption (INFO)
- **Config validation errors**: Invalid config uploaded (ERROR)

SNS topics:
- `vpp-critical-alerts` → Email + SMS
- `vpp-warnings` → Email only
- `vpp-opportunities` → Email only (negative prices)

---

## Future Enhancements

1. **Rule Override**: Allow manual override with expiry timestamp
2. **Rule Templates**: Presets for different user profiles (conservative, aggressive, balanced)
3. **Machine Learning**: Learn optimal thresholds based on historical performance
4. **Weather Integration**: More sophisticated solar forecasting
5. **Smart Appliance Integration**: Trigger high-draw appliances during negative prices
6. **EV Departure Time**: Deadline-based EV charging optimization
7. **Multi-Vehicle Support**: Support for multiple EVs with separate rules

---

## Documentation Links

- Frontend Config UI: `/app/config-rules/page.tsx`
- Config Types: `/lib/energy-rules-config.ts`
- Backend Strategy Engine: `/backend/src/functions/strategy-engine/index.ts` (to be created)
- AWS Backend Plan: `/AWS-BACKEND-PLAN.md`
