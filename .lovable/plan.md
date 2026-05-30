**LOVABLE TASK — Execute Powerwall Discharge Visibility + Number Readability Fix**

I like the detailed plan you sent. Please proceed with **exactly** the scope you outlined.

**Files to change:**

•  src/components/dashboard/LiveEnergyMonitoringCard.tsx

•  src/components/dashboard/AnimatedEnergyFlow.tsx

•  src/components/dashboard/__tests__/powerwallFlow.test.tsx (update existing test file)

**Key requirements from your plan:**

•  Fix Powerwall sign convention for Tesla Fleet API (battery_power > 0 from Tesla = discharging). Invert only for Tesla-shaped keys (battery_power, energy_sites.0.battery_power) in batterySnapshot.

•  Extract and export derivePowerwallDisplay helper (used by both the SVG node and tests).

•  Improve SVG text sizing, weight, and contrast for all kW values and labels so they are Tesla-grade readable at 390px (no squinting).

•  Use proper minus sign (U+2212), thin non-breaking spaces, and smart decimal handling.

•  Add one new test case for Tesla discharge payload.

**Do NOT change:**

•  Any backend, telemetry hooks, Clean Energy Center, or other visuals.

•  Light mode.

**Success Criteria (from screenshots):**

•  When Powerwall is discharging at night (solar = 0 kW), the node must clearly show downward flow, amber color, and correct −0.8 kW (or similar).

•  All kW numbers across the diagram must be significantly larger, bolder, and easier to read.

•  No regression on daytime solar + EV charging visuals.

•  All tests pass.

Once complete, reply with:

**“Powerwall discharge visibility + number readability improved in Live Energy Flow”**