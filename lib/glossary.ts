/**
 * Plain English explanations for technical terms used in the energy automation system
 */

export const GLOSSARY = {
  // Battery & Energy Terms
  soc: {
    term: "SoC (State of Charge)",
    short: "Battery Level",
    explanation: "How full your battery is, shown as a percentage (0% = empty, 100% = full). Like the battery indicator on your phone.",
  },
  kwh: {
    term: "kWh (Kilowatt-hour)",
    short: "Energy Amount",
    explanation: "A unit of energy. Your battery stores ~13.5 kWh. Running a 1 kW appliance for 1 hour uses 1 kWh. Your electricity bill is charged per kWh.",
  },
  kw: {
    term: "kW (Kilowatt)",
    short: "Power Rate",
    explanation: "How fast energy flows. 1 kW = 1000 watts. A kettle uses ~2 kW. Your battery can charge/discharge at ~5 kW maximum.",
  },
  powerwall: {
    term: "Powerwall",
    short: "Home Battery",
    explanation: "Tesla's home battery system. Stores solar energy during the day so you can use it at night or sell it when prices are high.",
  },

  // Pricing Terms
  feedInTariff: {
    term: "Feed-in Tariff (FIT)",
    short: "Sell Price",
    explanation: "How much you earn (in cents) for each kWh of electricity you sell back to the grid. This price changes every 30 minutes with Amber.",
  },
  buyPrice: {
    term: "Buy Price",
    short: "Grid Cost",
    explanation: "How much you pay (in cents) for each kWh of electricity you buy from the grid. This price changes every 30 minutes with Amber.",
  },
  spotPrice: {
    term: "Spot Price",
    short: "Live Market Price",
    explanation: "The real-time wholesale electricity price. Amber passes this directly to you. Can be negative (grid pays you!) or very high during peak demand.",
  },
  negativePrice: {
    term: "Negative Price",
    short: "Free Electricity!",
    explanation: "When there's too much renewable energy (wind/solar), the grid actually pays you to use electricity. Charge everything!",
  },
  priceCeiling: {
    term: "Price Ceiling",
    short: "Maximum Price",
    explanation: "The highest price you're willing to pay for something. If the grid price goes above this, the system won't buy electricity.",
  },

  // Time Windows
  solarSpongeWindow: {
    term: "Solar Sponge Window",
    short: "Super Cheap Period",
    explanation: "10am-3pm when solar flooding the grid makes electricity super cheap (often under 10¢/kWh). Best time to charge your battery from the grid if needed.",
  },
  demandWindow: {
    term: "Demand Window",
    short: "Expensive Time",
    explanation: "3pm-9pm when everyone's home and electricity demand peaks. Your network charges you based on your highest usage during this time each month.",
  },
  demandCharge: {
    term: "Demand Charge",
    short: "Peak Usage Fee",
    explanation: "Ausgrid finds your single worst 30-minute usage spike between 3-9pm each month and charges you $/kW for that peak. One bad evening can double your bill!",
  },

  // Modes
  selling: {
    term: "SELLING Mode",
    short: "Exporting to Grid",
    explanation: "Your battery is actively discharging and sending power to the grid. You're earning money! This happens when grid prices are high.",
  },
  charging: {
    term: "CHARGING Mode",
    short: "Filling Battery",
    explanation: "Your battery is charging from either excess solar or the grid (when prices are cheap). Storing energy for later.",
  },
  holding: {
    term: "HOLDING Mode",
    short: "Waiting Mode",
    explanation: "Battery isn't charging or discharging. Saving energy for when prices get better, or waiting for the demand window.",
  },
  selfConsumption: {
    term: "SELF-CONSUMPTION Mode",
    short: "Normal House Use",
    explanation: "Solar powers your house first, excess goes to battery or grid. No special charging or selling happening. This is the default normal mode.",
  },

  // Strategies
  arbitrage: {
    term: "Arbitrage",
    short: "Buy Low, Sell High",
    explanation: "Charge your battery when electricity is cheap (or negative!), then sell it back when prices spike. Like trading stocks, but with electricity.",
  },
  curtailment: {
    term: "Solar Curtailment",
    short: "Reduce Solar Output",
    explanation: "Intentionally limiting how much your solar panels produce. Only done when grid prices are negative AND your battery is full, to avoid paying the grid to take your power.",
  },
  diversion: {
    term: "Solar Diversion",
    short: "Redirect Excess Solar",
    explanation: "When you're making more solar than you're using, automatically send the extra power somewhere useful: battery first, then EV, then grid export.",
  },

  // EV Terms
  zappi: {
    term: "Zappi",
    short: "Smart EV Charger",
    explanation: "Your EV charger that can automatically adjust charging speed to match available solar power. Eco mode only charges from excess solar.",
  },
  ecoMode: {
    term: "Eco Mode",
    short: "Solar-Only Charging",
    explanation: "Zappi only charges your EV using excess solar power. If clouds block the sun, charging slows or stops. Free charging, but slower.",
  },

  // System Terms
  inverter: {
    term: "Inverter",
    short: "Power Converter",
    explanation: "Converts DC power (from solar/battery) to AC power (for your home). Also controls when your battery charges or discharges. Your system uses a Sigenergy inverter.",
  },
  dnsp: {
    term: "DNSP (Distribution Network)",
    short: "Your Power Lines Company",
    explanation: "The company that owns the power lines in your area (Ausgrid for you). They charge you for using the network, separate from electricity costs.",
  },
  baselineComparison: {
    term: "Baseline Comparison",
    short: "What You'd Normally Pay",
    explanation: "How much you would have spent/earned with Amber's default SmartShift mode (just self-consumption). Shows how much extra you're making with arbitrage.",
  },

  // Technical Settings
  dryRunMode: {
    term: "Dry Run Mode",
    short: "Test Mode",
    explanation: "The system makes decisions and logs what it would do, but doesn't actually send commands to your battery. Safe way to test rule changes.",
  },
  ttl: {
    term: "TTL (Time To Live)",
    short: "Auto-Delete Timer",
    explanation: "How long data is kept before being automatically deleted. Saves storage space. Old price data gets deleted after 90 days.",
  },
  webhook: {
    term: "Webhook",
    short: "Automatic Notification",
    explanation: "When something happens (like a negative price), the system automatically sends you a message or notification. No need to keep checking.",
  },

  // Australian Specific
  amber: {
    term: "Amber Electric",
    short: "Your Retailer",
    explanation: "Your electricity retailer. Unlike traditional retailers, Amber passes through wholesale prices in real-time every 30 minutes. No markup, just wholesale + ~$20/month fee.",
  },
  smartShift: {
    term: "Amber SmartShift",
    short: "Basic Solar Mode",
    explanation: "Amber's default battery mode. Uses solar to power your home and charges battery when there's excess. Doesn't actively buy/sell for arbitrage.",
  },
  ausgrid: {
    term: "Ausgrid",
    short: "Your Network",
    explanation: "The company that owns the physical power lines and poles in Sydney. They charge network fees including the demand charge (3-9pm peak).",
  },
  ea116: {
    term: "EA116 Tariff",
    short: "Your Network Plan",
    explanation: "Your specific Ausgrid network tariff. Has a demand charge during 3-9pm that can significantly increase your bill if you import during that time.",
  },

  // Seasonal
  peakMonths: {
    term: "Peak Months",
    short: "Demand Charge Active",
    explanation: "Nov-Mar (summer) and Jun-Aug (winter) when the demand charge applies. You must avoid importing 3-9pm in these months or face high fees.",
  },
  offPeakMonths: {
    term: "Off-Peak Months",
    short: "No Demand Charge",
    explanation: "Apr, May, Sep, Oct when demand charges don't apply. You can import during 3-9pm if prices are good without worrying about the demand penalty.",
  },
};

/**
 * Common questions users might have
 */
export const FAQ = {
  whyNegativePrices: {
    q: "Why would electricity prices go negative?",
    a: "When there's too much renewable energy (sunny/windy days), grid operators need to keep the grid balanced. They'll pay you to use electricity to absorb the excess. This is free money – charge everything!",
  },
  whatIsDemandCharge: {
    q: "What is the demand charge and why does it matter so much?",
    a: "Ausgrid measures your highest 30-minute import during 3-9pm each month. They charge you $/kW for that peak, applied to your whole month. One bad evening (like forgetting and running AC + dryer) can add $50-100 to your bill. That's why Rule 2 (zero import 3-9pm) is critical in peak months.",
  },
  howDoesArbitrageWork: {
    q: "How does battery arbitrage make money?",
    a: "Simple: buy low, sell high. Charge your battery when electricity is cheap (10am-3pm Solar Sponge, or overnight), then discharge and sell when prices spike (usually 5-8pm). You might buy at 8¢/kWh and sell at 180¢/kWh – that's 172¢ profit per kWh!",
  },
  isThisSafe: {
    q: "Is it safe to let automation control my battery?",
    a: "Yes! The system has multiple safety rules: minimum battery reserve (20% buffer), demand charge protection (absolute zero import 3-9pm), and dry-run mode to test first. You can manually override anytime.",
  },
  howMuchCanIEarn: {
    q: "How much money can I actually make?",
    a: "Based on the demo data: $3-6/day on good arbitrage days vs ~$0.40/day baseline. That's $100-150/month extra. Real results depend on how often prices spike and your solar generation.",
  },
  whatIfCloudyDay: {
    q: "What happens on cloudy days?",
    a: "Rule 9 detects cloudy days (Solcast forecast < 10 kWh) and charges your battery to 80% early in the morning using cheap grid power. This ensures you're ready for the 3-9pm demand window even without solar.",
  },
  canIStillManualControl: {
    q: "Can I still manually control my battery?",
    a: "Absolutely! You can disable automation anytime, or use manual override commands. There's also dry-run mode where you see what automation would do without actually doing it.",
  },
  whatIsMinimumReserve: {
    q: "Why keep 20% battery reserve?",
    a: "It's a safety buffer: protects against deep discharge (battery health), gives margin for errors in the 3-9pm window calculation, and provides backup power if something unexpected happens. Your home can still drain below 20% naturally – the 20% rule only stops automation from discharging further.",
  },
};
