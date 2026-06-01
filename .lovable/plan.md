# Wave 1 QA Plan — Investor Demo Mode

Pause further waves. Run a focused QA pass on the shipped Wave 1 experience and deliver screenshots + a verification checklist.

## QA steps

1. **Entry point verification**
   - Desktop (1366×768): navigate to `/investor`, click the "Enter Investor Demo Mode" CTA, confirm redirect lands on the dashboard with the `InvestorDemoChip` visible and `localStorage` flag set.
   - Repeat using the `?demo=investor` URL param directly on `/demo` to confirm one-link sharing works.

2. **Rich Zen Monitoring capture (the headline shot)**
   - Mobile 390×844: screenshot `InvestorEnergyFlowCard` showing solar (5.4 kW), Powerwall (87% SOC, +2.1 kW), Tesla EV charging (7.2 kW), Wallbox active, halos + particle flows visible.
   - Desktop 1366×768: same view, full layout.
   - If animations don't read in a still, capture a second frame ~1.5s later.

3. **Seeded surfaces**
   - Dashboard (mobile + desktop) showing seeded mints, balance, devices.
   - First-mint flow → mint receipt screen.
   - Proof-of-Genesis receipt page.
   - `/deason` hub with seeded monthly report card + document library.

4. **Verification checklist** (text, alongside screenshots)
   - ✅/❌ `/investor` CTA enters demo mode
   - ✅/❌ `?demo=investor` enters demo mode
   - ✅/❌ `InvestorDemoChip` visible + exit works
   - ✅/❌ All four devices (Solar, Powerwall, Tesla EV, Wallbox) render active in flow diagram
   - ✅/❌ Halos + particle flows animate
   - ✅/❌ Sources chip row shows `Tesla · Enphase · Powerwall · Wallbox`
   - ✅/❌ Seeded mints + Deason report render without empty states
   - ✅/❌ No console errors during the flow

5. **Findings report**
   - If clean → reply with the exact required line.
   - If any ❌ → list issues (Critical / High / Low) and ask whether to fix in a coordinated pass before Wave 2.

## Out of scope for this pass
- Wave 2 (mobile perf), Wave 3 (demo-path audit), Wave 4 (Deason wow content)
- Any code changes unless a Critical bug blocks the demo path (will surface first, then ask)
