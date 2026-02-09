

# Update "What is your company going to make?" — Add First-Mover + IP Defensibility

## What Changes

Update the `what_does_company_make` answer in the `yc_application_content` table (section_key: `company`) to:

1. **Opening line** — Add "first" positioning: "ZenSolar is the first platform that cryptographically verifies clean energy use and rewards users with $ZSOLAR tokens and NFTs."
2. **IP paragraph** — Add a concise closing paragraph before the "result" line:
   > "This is a first-of-its-kind platform. The core verification engine is protected by a patent-pending utility application covering three dependent claims: Mint-on-Proof, Proof-of-Delta, and Proof-of-Origin, with trademark filings on all three. The Device Watermark Registry creates an on-chain anti-double-mint standard that makes competing claims provably fraudulent."
3. **Minor tone polish** — Tighten any remaining marketing-speak in the same pass.

## How

- Single database update to the `content` JSONB field for section_key `company`, updating only the `what_does_company_make` entry's `answer` value.
- No schema changes, no code changes, no new files.

## Full Proposed Answer

> ZenSolar is the first platform that cryptographically verifies clean energy use and rewards users with $ZSOLAR tokens and NFTs for hitting clean energy milestones.
>
> We use patent-pending technology to verify solar production, battery storage, EV charging, and EV miles driven across 4 hardware integrations (Tesla, Enphase, SolarEdge, Wallbox).
>
> For every verified kilowatt-hour or mile, users earn $ZSOLAR tokens. They unlock collectible NFTs for hitting milestones, gamifying the sustainable actions people already do daily.
>
> The entire experience from signup to blockchain mint happens inside ZenSolar. No MetaMask. No seed phrases. No browser extensions.
>
> Through a first-of-its-kind tokenomics flywheel (50% of subscription revenue feeds the liquidity pool), tokens and NFTs carry real USD value. Users can trade them or redeem them in our in-app store for consumer tech, EV chargers, and Tesla Supercharging gift cards, or cash out from right inside the app.
>
> The core verification engine is protected by a patent-pending utility application covering three proprietary methods: Mint-on-Proof, Proof-of-Delta, and Proof-of-Origin, with trademark filings on all three. Our Device Watermark Registry creates an on-chain anti-double-mint standard, giving us strong first-mover defensibility.
>
> The result: ongoing financial incentives for the millions who already own solar, batteries, or EVs, and a compelling new reason for those who haven't switched yet.

