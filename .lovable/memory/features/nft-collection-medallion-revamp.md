---
name: NFT Collection Medallion Revamp (parked)
description: Retire the current flat-icon 42-NFT artwork and regenerate the entire ZenSolar Genesis collection as Tesla-app-style embossed circular medallions
type: feature
---

## Decision (parked — revisit later)

The `/nft/genesis-founder` hero prototype set the new art direction for the ZenSolar NFT collection: **circular embossed medallion coins in the visual style of Tesla's in-app achievement badges** (engraved ring typography, iconic center emblem, holographic beveled edge, neon accent when unlocked, debossed gunmetal when locked).

When we revisit, regenerate all 42 NFTs currently mapped in `src/lib/nftArtwork.ts` in this medallion format so the whole collection reads as one shelf.

## Visual system per category

Keep the coin format identical across all 42. Vary only the center emblem and the accent color:

- **Solar** (8) — sun-ray emblems, accent `--solar` (amber/orange)
- **Battery** (7) — stacked cell / battery-bar emblems, accent `--eco` (emerald)
- **Charging** (8) — bolt-cluster / plug emblems, accent `--primary` (electric blue)
- **EV Miles** (10) — road / checkered-flag / speedometer emblems, accent `--token` (violet/token)
- **Combos** (8) — constellation / interlocking-ring emblems, accent `--accent` (multi-hue)
- **Welcome / Genesis** (1) — sun+bolt hybrid, holographic rim (already done)

Every coin renders in TWO states: `unlocked` (neon-glow emblem, holo rim) and `locked` (debossed gunmetal, padlock etched at top of ring). Store both.

## Reference render

`src/assets/nft/hero/genesis-founder-unlocked.png` and `.../genesis-founder-locked.png` are the canonical style reference — match this fidelity for every coin.

## Naming + wiring

- File path: `src/assets/nft/medallion/<milestone_id>-{locked,unlocked}.png`
- Update `src/lib/nftArtwork.ts` to point at the new files (keep milestone IDs unchanged so `nftTokenMapping.ts` and `public/nft-metadata-flat/*.json` still align)
- Update `public/nft-metadata-flat/*.json` `image` URLs after upload
- Old flat-icon assets in `src/assets/nft/` can be archived, not deleted, until the new set is fully live

## Rollout order when we revisit

1. Category sampler — one coin per family (6 renders) to approve the visual system
2. Full regeneration of the remaining 36 once the sampler is signed off
3. Swap `nftArtwork.ts` map + metadata JSON in one PR
4. Update `NFTMilestoneSection` and `TrophyShelf` to render the coins at larger size (they'll deserve it)

## Do not do now

Do not regenerate the 42 NFTs unprompted. This is parked until Joseph revisits.
