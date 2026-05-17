# AWS Backend Architecture Plan for VPP Dashboard

## Context

The VPP (Virtual Power Plant) dashboard is currently a frontend-only Next.js application displaying mock data. The system needs a backend to:

1. **Integrate with external APIs**: Fetch live wholesale electricity prices from Amber Electric API and control a Sigenergy solar inverter
2. **Execute automation strategy**: Monitor prices every 5 minutes, evaluate all automation settings in priority order, and send commands to the inverter
3. **Persist data**: Store system configuration, historical intervals (5-min granularity), daily earnings, and activity logs
4. **Real-time updates**: Push live system state to the frontend dashboard via WebSocket

The backend must be architected as **single-user initially** (no authentication) but **scalable to multi-tenant** (architecture should support future addition of user accounts without major refactoring).

**User Requirements**:
- Pure AWS stack (no third-party services)
- DynamoDB for database
- EventBridge + Lambda for scheduled processing
- API Gateway WebSocket for real-time updates
- AWS Amplify for hosting (already configured)

---

## AWS Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS CLOUD                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐         ┌──────────────────┐                 │
│  │  EventBridge     │         │  EventBridge     │                 │
│  │  Rule (5 min)    │────────▶│  Rule (hourly)   │                 │
│  └────────┬─────────┘         └────────┬─────────┘                 │
│           │                            │                            │
│           ▼                            ▼                            │
│  ┌─────────────────────────────────────────────────┐               │
│  │         Lambda Functions (.NET 10 / C#)              │               │
│  ├─────────────────────────────────────────────────┤               │
│  │ • price-monitor      (fetch Amber prices)       │               │
│  │ • strategy-engine    (evaluate settings, decide)│               │
│  │ • inverter-control   (send Sigenergy commands)  │               │
│  │ • data-aggregator    (daily rollups)            │               │
│  └──────────┬──────────────────────┬────────────┬──┘               │
│             │                      │            │                   │
│             ▼                      ▼            ▼                   │
│  ┌──────────────────┐   ┌──────────────────┐  ┌─────────────────┐ │
│  │   DynamoDB       │   │  Secrets Manager │  │  CloudWatch     │ │
│  │   Tables         │   │  (API tokens)    │  │  Logs + Alarms  │ │
│  ├──────────────────┤   └──────────────────┘  └─────────────────┘ │
│  │ • vpp-config     │                                              │
│  │ • vpp-intervals  │                                              │
│  │ • vpp-daily      │                                              │
│  │ • vpp-activity   │                                              │
│  └──────────────────┘                                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐               │
│  │  API Gateway (WebSocket + REST)                 │               │
│  ├─────────────────────────────────────────────────┤               │
│  │ WebSocket: wss://api.dasco.me/ws                │               │
│  │   • $connect    → store connectionId            │               │
│  │   • $disconnect → remove connectionId           │               │
│  │   • $default    → echo/ping                     │               │
│  │                                                  │               │
│  │ REST API: https://api.dasco.me/v1               │               │
│  │   • GET  /system/state                          │               │
│  │   • GET  /intervals?from=&to=                   │               │
│  │   • GET  /daily?days=14                         │               │
│  │   • GET  /activity?limit=20                     │               │
│  │   • GET  /config                                │               │
│  │   • PUT  /config                                │               │
│  │   • POST /command/manual (override mode)        │               │
│  └──────────┬──────────────────────────────────────┘               │
│             │                                                        │
│             ▼                                                        │
│  ┌─────────────────────────────────────────────────┐               │
│  │  Lambda Functions (API handlers — .NET 10)             │               │
│  ├─────────────────────────────────────────────────┤               │
│  │ • api-system-state   • api-config-get           │               │
│  │ • api-intervals      • api-config-put           │               │
│  │ • api-daily          • api-command-manual       │               │
│  │ • api-activity       • ws-connect               │               │
│  │ • ws-disconnect      • ws-default               │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
            ▲                                     │
            │                                     ▼
     ┌──────────────┐                    ┌──────────────┐
     │   Frontend   │◀──── WebSocket ───▶│   Frontend   │
     │  (Amplify)   │                    │   Polling    │
     └──────────────┘                    └──────────────┘
```

---

## DynamoDB Table Schemas

### 1. **vpp-config** (System configuration)

The config table stores two things: the full `EnergyAutomationConfig` (all automation settings) and the dispatch parameters. These map directly to what the user configures in the `/config` page.

```json
{
  "PK": "CONFIG#default",
  "SK": "METADATA",
  "userId": "default",

  "dispatch": {
    "minExportPrice": 150,
    "maxExportPower": 5,
    "commandDuration": 30
  },

  "automation": {
    "dailyChargeTarget": {
      "enabled": true,
      "targetSoC": 100,
      "targetTimeHour": 15,
      "targetTimeMinute": 0,
      "solarSpongeWindow": { "startHour": 10, "startMinute": 0, "endHour": 15, "endMinute": 0 },
      "gridTopUpEnabled": true,
      "gridTopUpPriceCeiling": 12,
      "cloudyDayEarlyTopUp": true
    },
    "minimumBatteryReserve": {
      "enabled": true,
      "minimumSoC": 20
    },
    "avoidDemandCharges": {
      "enabled": true,
      "peakMonths": [11, 12, 1, 2, 3, 6, 7, 8],
      "offPeakMonths": [4, 5, 9, 10],
      "demandWindow": { "startHour": 15, "startMinute": 0, "endHour": 21, "endMinute": 0 },
      "zeroGridImportInPeakMonths": true
    },
    "avoidNegativeFeedIn": {
      "enabled": true,
      "stopExportBelowPrice": 0,
      "curtailmentEnabled": true,
      "diversionPriority": ["BATTERY", "EV", "GRID_EXPORT"]
    },
    "getPaidToCharge": {
      "enabled": true,
      "chargePowerwallTo100": true,
      "chargeEVTo100": true,
      "triggerSmartAppliances": false,
      "negativePriceThreshold": 0
    },
    "smartCarCharging": {
      "enabled": true,
      "publicChargerCostReference": 60,
      "tiers": [
        { "socMin": 0,  "socMax": 15,  "level": "CRITICAL",      "priceCeiling": 40 },
        { "socMin": 15, "socMax": 30,  "level": "LOW",           "priceCeiling": 20 },
        { "socMin": 30, "socMax": 60,  "level": "BELOW_TARGET",  "priceCeiling": 12 },
        { "socMin": 60, "socMax": 80,  "level": "TARGET_RANGE",  "priceCeiling": 8  },
        { "socMin": 80, "socMax": 100, "level": "FULL",          "priceCeiling": null }
      ]
    },
    "advanced": {
      "enableAutomationSettings": true,
      "dryRunMode": false,
      "notificationsEnabled": true,
      "logLevel": "INFO"
    }
  },

  "system": {
    "powerwallCapacityKwh": 13.5,
    "solarPeakKw": 5,
    "evBatteryCapacityKwh": 100,
    "zappiChargeRateKw": 7.4,
    "dnspId": "ausgrid",
    "planId": "ea025"
  },

  "updatedAt": "2026-05-17T17:34:00Z",
  "createdAt": "2026-05-17T10:00:00Z"
}
```

**Notes**:
- `dispatch` maps to the "Dispatch Settings" section in Basic Settings
- `automation` maps to the `EnergyAutomationConfig` type in `lib/energy-rules-config.ts`
- `system` maps to the "System Information" section in Basic Settings
- `amberToken` and Sigenergy credentials are stored in Secrets Manager, not here
- The DNSP selection (`dnspId`, `planId`) drives `avoidDemandCharges.demandWindow` and `peakMonths` — the resolved values are stored, not just the IDs

**Access Patterns**:
- Get config: `PK = "CONFIG#default"`
- Update config: Same key, overwrite attributes

**GSI for future multi-user**: `userId-index` (GSI on `userId`)

---

### 2. **vpp-intervals** (Time-series 5-minute interval data)

```json
{
  "PK": "INTERVAL#2026-05-17",
  "SK": "2026-05-17T17:30:00Z",
  "userId": "default",
  "timestamp": "2026-05-17T17:30:00+10:00",
  "mode": "SELLING",
  "feedInPrice": 182,
  "buyPrice": 28,
  "batterySoC": 87,
  "currentExport": 4.8,
  "solarOutput": 1.2,
  "houseLoad": 0.4,
  "earnings": 0.146,
  "activeSetting": "DAILY_CHARGE_TARGET",
  "ttl": 1747123200
}
```

**Notes**:
- `activeSetting` records which automation setting drove the current mode (matches `decisionPriorityOrder.settings` values: `"MINIMUM_BATTERY_RESERVE"`, `"AVOID_DEMAND_CHARGES"`, `"GET_PAID_TO_CHARGE"`, etc.)

**Access Patterns**:
- Get today's intervals: `PK = "INTERVAL#2026-05-17"`, sort by SK
- Get last 24h: Query today + yesterday if needed
- Cleanup: TTL set to 90 days

**GSI for future multi-user**: `userId-timestamp-index`

---

### 3. **vpp-daily** (Aggregated daily earnings)

```json
{
  "PK": "DAILY#2026-05",
  "SK": "2026-05-17",
  "userId": "default",
  "date": "2026-05-17",
  "earnings": 3.42,
  "baseline": 0.44,
  "intervalCount": 288,
  "exportIntervals": 18,
  "totalExportKwh": 24.6,
  "avgFeedInPrice": 182,
  "maxFeedInPrice": 205,
  "ttl": 1778659200
}
```

**Access Patterns**:
- Get last 14 days: `PK = "DAILY#2026-05"`, sort by SK descending, limit 14
- Cleanup: TTL set to 365 days

**GSI for future multi-user**: `userId-date-index`

---

### 4. **vpp-activity** (Recent activity feed)

```json
{
  "PK": "ACTIVITY#default",
  "SK": "2026-05-17T17:30:00Z",
  "userId": "default",
  "timestamp": "2026-05-17T17:30:00+10:00",
  "time": "17:30",
  "action": "SELLING",
  "price": 182,
  "export": 4.8,
  "reason": "Price spike — dispatching at 182¢/kWh",
  "activeSetting": "DAILY_CHARGE_TARGET",
  "ttl": 1747987200
}
```

**Access Patterns**:
- Get last N activities: `PK = "ACTIVITY#default"`, sort by SK descending, limit N
- Cleanup: TTL set to 30 days

**GSI for future multi-user**: `userId-timestamp-index`

---

### 5. **vpp-connections** (WebSocket connection tracking)

```json
{
  "PK": "CONNECTION",
  "SK": "abc123connectionId",
  "userId": "default",
  "connectionId": "abc123connectionId",
  "connectedAt": "2026-05-17T17:30:00Z",
  "ttl": 1747130400
}
```

**Access Patterns**:
- Store on `$connect`, delete on `$disconnect`
- Broadcast: scan table (small), send to each connectionId
- Cleanup: TTL set to 24 hours

---

## Lambda Functions

### **Core Processing Functions** (EventBridge-triggered)

#### 1. **price-monitor** (Every 5 minutes)
- **Trigger**: EventBridge rule `rate(5 minutes)`
- **Purpose**: Fetch current wholesale prices from Amber Electric API
- **Flow**:
  1. Read `amberToken` from Secrets Manager
  2. Call Amber API: `GET /v1/sites/{siteId}/prices/current`
  3. Extract `feedInPrice`, `buyPrice`, `renewables%`
  4. Store in `vpp-intervals` table
  5. Invoke `strategy-engine` asynchronously
- **Output**: Current price interval written to DB

#### 2. **strategy-engine** (Invoked by price-monitor)
- **Trigger**: Async Lambda invocation
- **Purpose**: Evaluate all automation settings in priority order and decide the system mode
- **Flow**:
  1. Load `automation` config from `vpp-config`
  2. Check `automation.advanced.enableAutomationSettings` — if false, exit
  3. Get current battery SoC from Sigenergy API
  4. **Evaluate settings in priority order**:

     ```
     Priority 1 — Minimum Battery Reserve (SAFETY)
       If batterySoC <= minimumBatteryReserve.minimumSoC → HOLDING (protect battery floor)

     Priority 2 — Avoid Demand Charges (CRITICAL)
       If avoidDemandCharges.enabled AND isPeakMonth AND isInDemandWindow
         → HOLDING, zero grid import (override everything else)

     Priority 3 — Avoid Negative Feed-in Tariff
       If avoidNegativeFeedIn.enabled AND feedInPrice < stopExportBelowPrice
         → Stop export; divert solar per diversionPriority order

     Priority 4 — Get Paid to Charge (OPPORTUNITY)
       If getPaidToCharge.enabled AND feedInPrice < negativePriceThreshold
         → CHARGING to 100% (Powerwall + EV if enabled)

     Priority 5 — Daily Charge Target
       If dailyChargeTarget.enabled AND batterySoC < targetSoC AND timeBeforeTarget
         → CHARGING (solar sponge window, or grid if gridTopUpEnabled AND price < gridTopUpPriceCeiling)

     Priority 6 — Smart Car Charging
       If smartCarCharging.enabled AND EV plugged in
         → Find tier for current EV SoC; charge if buyPrice < tier.priceCeiling

     Default → SELF_CONSUMPTION
     ```

  5. If mode changed, invoke `inverter-control`
  6. Write activity log to `vpp-activity` (include `activeSetting`)
  7. Broadcast state update via WebSocket
- **Notes**:
  - If `dryRunMode` is true, log decisions but skip step 5 (no inverter commands)
  - Demand window and peak months come from `avoidDemandCharges` (set by DNSP/plan selection in UI)

#### 3. **inverter-control** (Invoked by strategy-engine)
- **Trigger**: Async Lambda invocation or manual API call
- **Purpose**: Send charge/discharge commands to Sigenergy inverter
- **Flow**:
  1. Get Sigenergy credentials from Secrets Manager
  2. Authenticate with Sigenergy OpenAPI
  3. Get current battery state: `GET /api/v1/device/{deviceId}/realtime`
  4. Send command based on mode:
     - **SELLING** → FORCED_DISCHARGE at `dispatch.maxExportPower` kW
     - **CHARGING** → FORCED_CHARGE at 5 kW
     - **HOLDING** → BACKUP_MODE (no import, no export)
     - **SELF_CONSUMPTION** → SELF_CONSUMPTION
  5. Set command duration from `dispatch.commandDuration` (minutes)
  6. Update `vpp-intervals` with actual battery state
- **Output**: Command sent, battery state updated

#### 4. **data-aggregator** (Hourly)
- **Trigger**: EventBridge rule `cron(0 * * * ? *)`
- **Purpose**: Calculate daily rollups and baseline comparisons
- **Flow**:
  1. Query `vpp-intervals` for the current day
  2. Calculate `earnings`, `baseline`, `exportIntervals`, `totalExportKwh`, price stats
  3. Write/update `vpp-daily` entry for today
  4. At midnight, finalise yesterday's record
- **Output**: Daily aggregates updated

---

### **REST API Functions** (API Gateway-triggered)

#### 5. **api-system-state** (GET /system/state)
Returns current system state for the dashboard.

```json
{
  "mode": "SELLING",
  "feedInPrice": 182,
  "buyPrice": 28,
  "batterySoC": 87,
  "currentExport": 4.8,
  "todayEarnings": 3.42,
  "todaySavings": 1.15,
  "solarOutput": 1.2,
  "houseLoad": 0.4,
  "activeSetting": "DAILY_CHARGE_TARGET",
  "lastUpdated": "2026-05-17T17:34:00+10:00"
}
```

#### 6. **api-intervals** (GET /intervals?from=&to=)
Returns 24-hour price chart data (288 intervals).

#### 7. **api-daily** (GET /daily?days=14)
Returns historical daily earnings (14-day default).

#### 8. **api-activity** (GET /activity?limit=20)
Returns recent activity feed.

#### 9. **api-config-get** (GET /config)
- Returns full `automation` + `dispatch` + `system` config
- Strips secrets (`amberToken`, Sigenergy credentials)

#### 10. **api-config-put** (PUT /config)
- Accepts body matching the `vpp-config` shape (minus secrets)
- Validates:
  - `minimumBatteryReserve.minimumSoC` between 5–50
  - `dispatch.maxExportPower` ≤ 5 kW
  - `smartCarCharging.tiers` coverage: first tier starts at 0%, last ends at 100%
  - `avoidDemandCharges.demandWindow` valid hours (0–23)
- If `amberToken` included, update Secrets Manager
- Update `vpp-config` table

#### 11. **api-command-manual** (POST /command/manual)
```json
{ "mode": "SELLING", "duration": 60 }
```
Forces a mode override, logs as "Manual override", invokes `inverter-control`.

---

### **WebSocket Functions**

#### 12–14. **ws-connect / ws-disconnect / ws-default**
Standard connection lifecycle — store/remove `connectionId` in `vpp-connections`. Default route handles ping/pong.

---

## WebSocket Broadcasting

On every state change (new interval, mode change, manual override):

```json
{
  "type": "STATE_UPDATE",
  "data": {
    "mode": "SELLING",
    "feedInPrice": 182,
    "batterySoC": 87,
    "currentExport": 4.8,
    "activeSetting": "DAILY_CHARGE_TARGET",
    "timestamp": "2026-05-17T17:35:00Z"
  }
}
```

Stale connections (410 Gone) are deleted from `vpp-connections`.

---

## API Gateway Configuration

### REST API Routes

| Method | Path | Lambda | Auth |
|--------|------|--------|------|
| GET | `/system/state` | api-system-state | None (future: API key) |
| GET | `/intervals` | api-intervals | None |
| GET | `/daily` | api-daily | None |
| GET | `/activity` | api-activity | None |
| GET | `/config` | api-config-get | None |
| PUT | `/config` | api-config-put | None (future: API key) |
| POST | `/command/manual` | api-command-manual | None (future: API key) |

**CORS**: Allow `https://vpp.dasco.me` origin only.

### WebSocket Routes

| Route | Lambda |
|-------|--------|
| `$connect` | ws-connect |
| `$disconnect` | ws-disconnect |
| `$default` | ws-default |

---

## AWS Secrets Manager

**Secret Name**: `vpp/api-credentials`

```json
{
  "amberToken": "psk_live_...",
  "sigenergySiteId": "...",
  "sigenergyAppKey": "...",
  "sigenergyAppSecret": "..."
}
```

---

## IAM Roles & Permissions

```yaml
LambdaExecutionRole:
  Policies:
    - AWSLambdaBasicExecutionRole (CloudWatch Logs)
    - DynamoDB:
        - GetItem, PutItem, UpdateItem, Query, Scan
        - Tables: vpp-*
    - Secrets Manager:
        - GetSecretValue
        - Secret: vpp/api-credentials
    - Lambda:
        - InvokeFunction (async invocations)
    - API Gateway Management API:
        - POST /@connections/* (WebSocket broadcasting)
```

---

## EventBridge Rules

| Rule | Schedule | Target |
|------|----------|--------|
| price-monitor-schedule | `rate(5 minutes)` | Lambda: price-monitor |
| data-aggregator-schedule | `cron(0 * * * ? *)` | Lambda: data-aggregator |

---

## CloudWatch Alarms

1. Lambda error rate > 5% over 5 minutes (any function)
2. REST API 5xx errors > 10 in 5 minutes
3. DynamoDB read/write capacity throttled
4. `inverter-control` fails 3 times consecutively
5. `price-monitor` fails (critical — arbitrage stops)

**Notification**: SNS topic → Email

---

## Infrastructure as Code

**Recommendation**: **AWS SAM** (`template.yaml`) — simplest for this serverless stack.

```
sam build && sam deploy --guided
```

SAM handles the .NET 10 build automatically via `dotnet publish`. Single YAML defines all Lambda, API Gateway, DynamoDB, and EventBridge resources.

**SAM Lambda runtime**: `dotnet10`  
**Handler pattern**: `VppBackend::VppBackend.Functions.PriceMonitor::FunctionHandler`

---

## Deployment Strategy

### Phase 1: Infrastructure Setup
1. Create DynamoDB tables (on-demand billing)
2. Create Secrets Manager secret with placeholder tokens
3. Deploy Lambda functions (.NET 10 — `dotnet10` runtime, `sam build` compiles via `dotnet publish`)
4. Create API Gateway (REST + WebSocket)
5. Set up EventBridge rules and CloudWatch alarms

### Phase 2: Backend Development
1. Implement Lambda functions as classes in `VppBackend/src/Functions/`
2. Shared infrastructure in `VppBackend/src/`:
   - `Services/DynamoDbService.cs` — DynamoDB wrapper using `AWSSDK.DynamoDBv2`
   - `Services/AmberClient.cs` — Amber Electric API wrapper (`HttpClient`)
   - `Services/SigenergyClient.cs` — Sigenergy OpenAPI wrapper
   - `Services/StrategyEngine.cs` — Automation settings evaluation (mirrors `lib/energy-rules-config.ts` logic)
   - `Services/WebSocketBroadcaster.cs` — API Gateway Management API calls
   - `Models/` — C# record types mirroring `EnergyAutomationConfig` from the frontend

### Phase 3: API Integration
1. Test Amber Electric API (read-only)
2. Test Sigenergy API (read battery state only)
3. Dry-run strategy engine — all settings evaluate, log decisions, no inverter commands
4. Test WebSocket broadcasting

### Phase 4: Frontend Integration
1. Replace `lib/mock-data.ts` with `lib/api-client.ts` (REST calls)
2. Add WebSocket context in `app/layout.tsx` for real-time updates
3. Update `/config` page to `PUT /config` on save instead of local state only
4. Test all dashboard pages against live data

### Phase 5: Production Launch
1. Remove `dryRunMode` flag, enable actual inverter commands
2. Configure CloudWatch monitoring dashboard
3. Set up email alerts for critical failures
4. Document emergency manual override runbook

---

## Frontend Config Integration

The `/config` page (`app/config/page.tsx`) currently manages all state locally. On backend integration:

- **GET /config** on page load → populate `config` (EnergyAutomationConfig) + `dispatch` state
- **PUT /config** on "Save & Apply" → persist full config to backend
- Config shape sent to backend:

```typescript
{
  dispatch: {
    minExportPrice: number,   // from dispatch state
    maxExportPower: number,
    commandDuration: number,
  },
  automation: EnergyAutomationConfig,  // from config state (lib/energy-rules-config.ts)
  system: config.system
}
```

- `amberToken` is sent separately (masked field) and stored in Secrets Manager, not DynamoDB

---

## Multi-User Migration Path

1. Integrate AWS Cognito — API Gateway Cognito authorizer, extract `userId` from JWT
2. DynamoDB: prefix PKs with `USER#{userId}#...` (GSIs already in schema)
3. WebSocket: filter broadcasts by `userId`

**No schema changes needed** — `userId` already present in all tables.

---

## Cost Estimate (Single User)

| Service | Usage | Cost |
|---------|-------|------|
| DynamoDB (On-Demand) | ~10k writes/day, 50k reads/day | $2–3 |
| Lambda | ~8,640 invocations/day (5-min), 256 MB (.NET cold start headroom) | $1–2 |
| API Gateway | ~1k REST calls/day, WebSocket ~24h/day | $1–2 |
| Secrets Manager | 1 secret, ~500 retrievals/day | $0.50 |
| CloudWatch Logs | ~100 MB/day | $0.50 |
| EventBridge | 2 rules | Free tier |
| **Total** | | **~$5–8/month** |

**Note**: Amplify hosting is free tier. .NET 10 Lambda cold starts (~500ms) are not a concern for this workload — the 5-minute price-monitor is EventBridge-scheduled, and the API endpoints are low-frequency. Enable Lambda SnapStart if cold starts become noticeable on the REST API.

---

```
backend/
└── VppBackend/
    ├── src/
    │   ├── Functions/
    │   │   ├── PriceMonitor.cs
    │   │   ├── StrategyEngine.cs
    │   │   ├── InverterControl.cs
    │   │   ├── DataAggregator.cs
    │   │   ├── ApiSystemState.cs
    │   │   ├── ApiIntervals.cs
    │   │   ├── ApiDaily.cs
    │   │   ├── ApiActivity.cs
    │   │   ├── ApiConfigGet.cs
    │   │   ├── ApiConfigPut.cs
    │   │   ├── ApiCommandManual.cs
    │   │   ├── WsConnect.cs
    │   │   ├── WsDisconnect.cs
    │   │   └── WsDefault.cs
    │   ├── Models/
    │   │   ├── EnergyConfig.cs          # C# records mirroring EnergyAutomationConfig
    │   │   ├── EvChargingTier.cs
    │   │   ├── TimeWindow.cs
    │   │   ├── SystemState.cs
    │   │   ├── IntervalRecord.cs
    │   │   ├── DailyRecord.cs
    │   │   └── ActivityRecord.cs
    │   ├── Services/
    │   │   ├── DynamoDbService.cs       # AWSSDK.DynamoDBv2 wrapper
    │   │   ├── AmberClient.cs           # Amber Electric API (HttpClient)
    │   │   ├── SigenergyClient.cs       # Sigenergy OpenAPI wrapper
    │   │   ├── StrategyEvaluator.cs     # Automation settings priority logic
    │   │   └── WebSocketBroadcaster.cs  # API Gateway Management API calls
    │   └── VppBackend.csproj
    ├── tests/
    │   ├── StrategyEvaluatorTests.cs
    │   ├── AmberClientTests.cs
    │   └── VppBackend.Tests.csproj
    ├── template.yaml                    # AWS SAM template
    └── samconfig.toml
```

**Key NuGet packages**:
- `Amazon.Lambda.Core`
- `Amazon.Lambda.APIGatewayEvents`
- `AWSSDK.DynamoDBv2`
- `AWSSDK.SecretsManager`
- `AWSSDK.ApiGatewayManagementApi`
- `System.Text.Json` (built-in .NET 10)
- `xunit` + `Moq` (tests)

**Frontend changes needed**:
```
lib/
├── api-client.ts        # Replace mock-data.ts — REST calls to api.dasco.me/v1
└── websocket-context.tsx  # React context for live state updates

.env.local
NEXT_PUBLIC_API_URL=https://api.dasco.me/v1
NEXT_PUBLIC_WS_URL=wss://api.dasco.me/ws
```

---

## Verification & Testing

### End-to-End Test Plan

1. **Configuration**:
   - [ ] Save config via PUT `/config` — verify in DynamoDB and Secrets Manager
   - [ ] Reload page, confirm config persists

2. **Price Monitoring**:
   - [ ] Trigger `price-monitor` manually (AWS Console)
   - [ ] Verify Amber API called, interval written to `vpp-intervals`

3. **Strategy Engine** (dry run first):
   - [ ] Trigger `strategy-engine` manually
   - [ ] Verify all 6 settings evaluated in priority order (CloudWatch Logs)
   - [ ] Verify `avoidDemandCharges` blocks dispatch correctly during demand window
   - [ ] Verify `getPaidToCharge` triggers at correct threshold
   - [ ] Verify activity log written with correct `activeSetting`

4. **Inverter Control** (read-only first):
   - [ ] Fetch battery state from Sigenergy API
   - [ ] Verify SoC returned correctly — no commands yet

5. **REST API**:
   - [ ] GET `/system/state` — check `activeSetting` field present
   - [ ] GET `/intervals` — 288 points per day
   - [ ] GET `/daily?days=14` — 14-day history
   - [ ] GET `/activity` — includes `activeSetting` per entry
   - [ ] PUT `/config` — full EnergyAutomationConfig round-trips correctly

6. **WebSocket**:
   - [ ] Connect, trigger state change, verify message received with `activeSetting`
   - [ ] Disconnect, verify removed from `vpp-connections`

7. **Frontend Integration**:
   - [ ] Dashboard shows real data, no mock imports
   - [ ] Config page loads from and saves to backend
   - [ ] WebSocket updates dashboard without refresh

8. **Production Commands** (after dry-run validation):
   - [ ] Manual SELLING via `/command/manual` — verify inverter receives FORCED_DISCHARGE
   - [ ] Verify mode reverts after `commandDuration` expires
   - [ ] Let `price-monitor` run 3 cycles automatically, verify strategy executes

9. **Monitoring**:
   - [ ] CloudWatch alarms active
   - [ ] Trigger a test failure → verify SNS email received

---

## External API Documentation

### Amber Electric API
- **Docs**: https://app.amber.com.au/developers
- **Base URL**: `https://api.amber.com.au/v1`
- **Auth**: Bearer token (from Secrets Manager)
- **Key endpoints**:
  - `GET /sites/{siteId}/prices/current` → current feed-in + buy prices
  - `GET /sites/{siteId}/prices` → historical prices

### Sigenergy OpenAPI
- **Auth**: OAuth2 or API key + secret (from Secrets Manager)
- **Key endpoints** (verify with official docs):
  - `GET /api/v1/device/{deviceId}/realtime` → battery SoC, power state
  - `POST /api/v1/device/{deviceId}/command` → send mode command

**Action Required**: Obtain Sigenergy API documentation and test credentials before implementing `inverter-control`.

---

## Security Considerations

1. All API credentials in Secrets Manager — never hardcoded or in DynamoDB
2. API Gateway throttling: 10 req/sec burst, 1000 req/hour steady
3. CORS: whitelist `https://vpp.dasco.me` only
4. DynamoDB: enable point-in-time recovery
5. Lambda: set memory/timeout limits to prevent runaway costs
6. Respect Amber/Sigenergy rate limits — cache price responses within 5-min windows

---

## Open Questions / Action Items

1. **Sigenergy API**: Need official documentation and test credentials
2. **Amber Site ID**: How does the user find their site ID? (Amber app or API)
3. **Baseline Calculation**: Does the Amber API provide SmartShift baseline data, or do we estimate it?
4. **Manual Override Safety**: Maximum duration cap on `/command/manual`? (Suggest 2 hours)
5. **Cloudy Day Detection**: Not yet in UI — `cloudyDayDetection` setting exists in config type but needs a UI card and backend evaluation step
6. **Overnight Charging**: Same — `overnightCharging` is in config type but not exposed in UI yet
7. **Smart Appliances**: `getPaidToCharge.triggerSmartAppliances` is in UI (checkbox) but marked future — backend should no-op this flag until integrations exist

---

## Summary

✅ **Pure AWS stack** (no third-party services)  
✅ **Serverless** (pay-per-use)  
✅ **Real-time updates** (WebSocket)  
✅ **Scalable to multi-user** (`userId` in all schemas)  
✅ **Config schema matches UI** (EnergyAutomationConfig type used end-to-end)  
✅ **Strategy engine reflects UI settings** (6 named settings in priority order)  
✅ **Cost-effective** (~$5–8/month single user)  
✅ **Dry-run safe** (`dryRunMode` flag prevents inverter commands during testing)  

**Next Steps**: Create `/backend` directory, implement strategy-engine logic mirroring `lib/energy-rules-config.ts`, deploy with AWS SAM.
