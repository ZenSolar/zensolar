**LOVABLE TASK — Execute Powerwall Flow Hardening + Multi-Powerwall Support**

I like the detailed plan you sent. Please proceed with **exactly** the scope you outlined.

**Files to change:**

•  src/components/dashboard/LiveEnergyMonitoringCard.tsx

•  src/components/dashboard/AnimatedEnergyFlow.tsx

•  New file: src/components/dashboard/__tests__/powerwallFlow.test.tsx

**Key requirements from your plan:**

•  Add regression tests covering Idle full, Idle partial, Charging, Discharging, Unknown, and multi-Powerwall cases.

•  Fix multi-Powerwall fallback (use site-level totals; fallback to units × 13.5 when capacity is missing).

•  Extract derivePowerwallDisplay helper and use it in the SVG node + tests.

•  Mobile status line polish: non-breaking thin spaces, proper minus sign (U+2212), drop decimals when |kW| ≥ 10, and cleaner formatting for capacity ≥ 20 kWh.

**Do NOT change:**

•  Any backend, telemetry hooks, or Clean Energy Center code.

•  Existing solar/EV/grid visuals or animations.

•  Light mode.

Once complete, reply with:

**“Powerwall flow hardening + multi-Powerwall support implemented with tests”**

Priority: High