## Plan: Elevate ZenSolar's UX differentiators on `/investor/solarcoin-comparison`

Single file edit: `src/pages/InvestorSolarCoinComparison.tsx`. No new deps, no routing changes, semantic tokens only, mobile-first (390×844).

### 1. Tighten Executive Summary
Rewrite the opening paragraphs to lead with the UX gap in plain language:
- SolarCoin has **no native app, no wallet, no live OEM telemetry, no AI, no store, no proactive device intelligence** — it is a passive registry that emails a token grant after a third-party inspector validates a production claim.
- ZenSolar is a full consumer product: embedded wallet, Tap-to-Mint™, live multi-OEM monitoring, Deason AI concierge, $ZSOLAR redemption store, proactive device alerts, and weekly + monthly personalized energy reports.

### 2. New hero block: "The Core User Experience Gap"
Placed directly under the summary, above the Scoreboard. Centerpiece of the page — slightly larger padding, `border-secondary/30`, subtle gradient background, more breathing room than other cards.

**7 bold pillars** rendered as a responsive grid (1 col mobile → 2 col md → 3 col lg, with the 7th spanning gracefully). Each card: icon + bold title + 1-line ZenSolar value + dim "SolarCoin: —" line.

1. **Native consumer app** (`Smartphone`) — iOS/Android/PWA. *SolarCoin: none.*
2. **Live multi-OEM telemetry** (`Activity`) — Tesla + Enphase + SolarEdge + Wallbox in one unified, more engaging UI than any single OEM's native app. *SolarCoin: none.*
3. **Deason AI concierge** (`Sparkles`) — purpose-trained LLM. Analyzes bills, contracts, PPAs, ROI, warranty terms, and answers any product question 24/7. *SolarCoin: none.*
4. **Weekly hyper-personalized device reports** (`CalendarDays`) — every Saturday Deason emails a per-user story covering how each connected device performed (Tesla EV miles + charging, solar production per panel, battery cycles, home charger sessions). **No other solar app in the market does this.** *SolarCoin: none.*
5. **Monthly progressive clean-energy insights** (`LineChart`) — once-a-month deep report that compounds over time: tariff/rate-plan optimization, peak/off-peak shifting, battery & EV coaching, savings forecasts, year-over-year trendlines. *SolarCoin: none.*
6. **Proactive device intelligence** (`BellRing`) — auto grid-outage alerts + battery-life coaching to extend hardware lifespan during outages. *SolarCoin: none.*
7. **$ZSOLAR Redemption Store** (`Store`) — spend tokens on solar gear, EV accessories, home-energy products, gift cards. Closes the "what do I do with the token?" loop. *SolarCoin: none.*
8. **Tap-to-Mint™ + embedded Coinbase wallet** (`Zap`) — zero-friction earning, no external wallet setup, no gas. *SolarCoin: external wallet only.*

(8 pillars total — listing #8 because it's the friction-free earning mechanic that makes everything else usable. Can drop to 7 if you'd prefer a tighter grid; flag if so.)

### 3. Bold matching cells in existing comparison tables
In "User Experience & Friction", "Ecosystem Reach", and "Additional Revenue Streams" tables, wrap ZenSolar cells in `font-semibold text-foreground` so they visually tie back to the hero block.

### 4. Add new rows to "User Experience & Friction" table
- **AI concierge** — ZenSolar: "Deason AI — bills, contracts, PPAs, ROI, warranty, 24/7 Q&A" · SolarCoin: "None"
- **Weekly device performance report** — ZenSolar: "Saturday hyper-personalized per-device story" · SolarCoin: "None"
- **Monthly clean-energy insights** — ZenSolar: "Progressive month-over-month savings & optimization report" · SolarCoin: "None"
- **Proactive device intelligence** — ZenSolar: "Grid-outage alerts + battery-life coaching" · SolarCoin: "None"
- **Token redemption** — ZenSolar: "$ZSOLAR Store — gear, EV accessories, gift cards" · SolarCoin: "None"

### Technical notes
- All new icons from `lucide-react` (already imported set extended with `Smartphone, Activity, Sparkles, CalendarDays, LineChart, BellRing, Store`).
- Reuse existing card styling pattern (`bg-card/40 border-border/60 rounded-2xl`).
- No content claims beyond what's already documented in project memory (Deason weekly/monthly reports per `mem://features/deason-utility-optimizer` and `mem://features/weekly-narrative`).