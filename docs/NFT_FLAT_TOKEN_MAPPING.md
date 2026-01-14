# NFT Flat Token ID Mapping Guide

**Purpose:** Restructure metadata from nested folders to flat `1.json` through `42.json` format for the ZenSolarNFT smart contract.

**Metadata Base URI:** `ipfs://bafybeicz6u6p76wenepe352onkv7l2bvlk3ulcv62uzrekqaj2viyr2a24/`

---

## Complete Token ID Mapping (42 NFTs Total)

### Token 0: Welcome NFT
| Token ID | Name | Milestone ID | Old File | New File |
|----------|------|--------------|----------|----------|
| 0 | Welcome | welcome | `welcome.json` | `0.json` |

---

### Tokens 1-8: Solar Production (8 NFTs)
| Token ID | Name | Threshold | Milestone ID | Old File | New File |
|----------|------|-----------|--------------|----------|----------|
| 1 | Sunspark | 500 kWh | solar_1 | `solar/1-sunspark.json` | `1.json` |
| 2 | Photonic | 1,000 kWh | solar_2 | `solar/2-photonic.json` | `2.json` |
| 3 | Rayforge | 2,500 kWh | solar_3 | `solar/3-rayforge.json` | `3.json` |
| 4 | Solaris | 5,000 kWh | solar_4 | `solar/4-solaris.json` | `4.json` |
| 5 | Helios | 10,000 kWh | solar_5 | `solar/5-helios.json` | `5.json` |
| 6 | Sunforge | 25,000 kWh | solar_6 | `solar/6-sunforge.json` | `6.json` |
| 7 | Gigasun | 50,000 kWh | solar_7 | `solar/7-gigasun.json` | `7.json` |
| 8 | Starforge | 100,000 kWh | solar_8 | `solar/8-starforge.json` | `8.json` |

---

### Tokens 9-15: Battery Discharge (7 NFTs)
| Token ID | Name | Threshold | Milestone ID | Old File | New File |
|----------|------|-----------|--------------|----------|----------|
| 9 | Voltbank | 500 kWh | battery_1 | `battery/1-voltbank.json` | `9.json` |
| 10 | Gridpulse | 1,000 kWh | battery_2 | `battery/2-gridpulse.json` | `10.json` |
| 11 | Megacell | 2,500 kWh | battery_3 | `battery/3-megacell.json` | `11.json` |
| 12 | Reservex | 5,000 kWh | battery_4 | `battery/4-reservex.json` | `12.json` |
| 13 | Dynamax | 10,000 kWh | battery_5 | `battery/5-dynamax.json` | `13.json` |
| 14 | Ultracell | 25,000 kWh | battery_6 | `battery/6-ultracell.json` | `14.json` |
| 15 | Gigavolt | 50,000 kWh | battery_7 | `battery/7-gigavolt.json` | `15.json` |

---

### Tokens 16-23: EV Charging (8 NFTs)
| Token ID | Name | Threshold | Milestone ID | Old File | New File |
|----------|------|-----------|--------------|----------|----------|
| 16 | Ignite | 100 kWh | charge_1 | `charging/1-ignite.json` | `16.json` |
| 17 | Voltcharge | 500 kWh | charge_2 | `charging/2-voltcharge.json` | `17.json` |
| 18 | Kilovolt | 1,000 kWh | charge_3 | `charging/3-kilovolt.json` | `18.json` |
| 19 | Ampforge | 1,500 kWh | charge_4 | `charging/4-ampforge.json` | `19.json` |
| 20 | Chargeon | 2,500 kWh | charge_5 | `charging/5-chargeon.json` | `20.json` |
| 21 | Gigacharge | 5,000 kWh | charge_6 | `charging/6-gigacharge.json` | `21.json` |
| 22 | Megacharge | 10,000 kWh | charge_7 | `charging/7-megacharge.json` | `22.json` |
| 23 | Teracharge | 25,000 kWh | charge_8 | `charging/8-teracharge.json` | `23.json` |

---

### Tokens 24-33: EV Miles Driven (10 NFTs)
| Token ID | Name | Threshold | Milestone ID | Old File | New File |
|----------|------|-----------|--------------|----------|----------|
| 24 | Ignitor | 100 miles | ev_1 | `ev/1-ignitor.json` | `24.json` |
| 25 | Velocity | 500 miles | ev_2 | `ev/2-velocity.json` | `25.json` |
| 26 | Autobahn | 1,000 miles | ev_3 | `ev/3-autobahn.json` | `26.json` |
| 27 | Hyperdrive | 5,000 miles | ev_4 | `ev/4-hyperdrive.json` | `27.json` |
| 28 | Electra | 10,000 miles | ev_5 | `ev/5-electra.json` | `28.json` |
| 29 | Velocity Pro | 25,000 miles | ev_6 | `ev/6-velocity-pro.json` | `29.json` |
| 30 | Mach One | 50,000 miles | ev_7 | `ev/7-mach-one.json` | `30.json` |
| 31 | Centaurion | 100,000 miles | ev_8 | `ev/8-centaurion.json` | `31.json` |
| 32 | Voyager | 150,000 miles | ev_9 | `ev/9-voyager.json` | `32.json` |
| 33 | Odyssey | 200,000 miles | ev_10 | `ev/10-odyssey.json` | `33.json` |

---

### Tokens 34-41: Combo Achievements (8 NFTs)
| Token ID | Name | Requirement | Milestone ID | Old File | New File |
|----------|------|-------------|--------------|----------|----------|
| 34 | Duality | 2 categories | combo_1 | `combo/1-duality.json` | `34.json` |
| 35 | Trifecta | 3 categories | combo_2 | `combo/2-trifecta.json` | `35.json` |
| 36 | Quadrant | 5 total NFTs | combo_3 | `combo/3-quadrant.json` | `36.json` |
| 37 | Constellation | 10 total NFTs | combo_4 | `combo/4-constellation.json` | `37.json` |
| 38 | Cyber Echo | 20 total NFTs | combo_5 | `combo/5-cyber-echo.json` | `38.json` |
| 39 | Zenith | 30 total NFTs | combo_6 | `combo/6-zenith.json` | `39.json` |
| 40 | ZenMaster | Max 1 category | combo_7 | `combo/7-zenmaster.json` | `40.json` |
| 41 | Total Eclipse | Max all categories | combo_8 | `combo/8-total-eclipse.json` | `41.json` |

---

## Restructuring Commands

Run these commands to restructure your metadata folder before re-uploading to Pinata:

```bash
# Create a new flat structure directory
mkdir -p nft-metadata-flat

# Copy and rename all files to flat structure
# Welcome
cp nft-metadata/welcome.json nft-metadata-flat/0.json

# Solar (1-8)
cp nft-metadata/solar/1-sunspark.json nft-metadata-flat/1.json
cp nft-metadata/solar/2-photonic.json nft-metadata-flat/2.json
cp nft-metadata/solar/3-rayforge.json nft-metadata-flat/3.json
cp nft-metadata/solar/4-solaris.json nft-metadata-flat/4.json
cp nft-metadata/solar/5-helios.json nft-metadata-flat/5.json
cp nft-metadata/solar/6-sunforge.json nft-metadata-flat/6.json
cp nft-metadata/solar/7-gigasun.json nft-metadata-flat/7.json
cp nft-metadata/solar/8-starforge.json nft-metadata-flat/8.json

# Battery (9-15)
cp nft-metadata/battery/1-voltbank.json nft-metadata-flat/9.json
cp nft-metadata/battery/2-gridpulse.json nft-metadata-flat/10.json
cp nft-metadata/battery/3-megacell.json nft-metadata-flat/11.json
cp nft-metadata/battery/4-reservex.json nft-metadata-flat/12.json
cp nft-metadata/battery/5-dynamax.json nft-metadata-flat/13.json
cp nft-metadata/battery/6-ultracell.json nft-metadata-flat/14.json
cp nft-metadata/battery/7-gigavolt.json nft-metadata-flat/15.json

# Charging (16-23)
cp nft-metadata/charging/1-ignite.json nft-metadata-flat/16.json
cp nft-metadata/charging/2-voltcharge.json nft-metadata-flat/17.json
cp nft-metadata/charging/3-kilovolt.json nft-metadata-flat/18.json
cp nft-metadata/charging/4-ampforge.json nft-metadata-flat/19.json
cp nft-metadata/charging/5-chargeon.json nft-metadata-flat/20.json
cp nft-metadata/charging/6-gigacharge.json nft-metadata-flat/21.json
cp nft-metadata/charging/7-megacharge.json nft-metadata-flat/22.json
cp nft-metadata/charging/8-teracharge.json nft-metadata-flat/23.json

# EV Miles (24-33)
cp nft-metadata/ev/1-ignitor.json nft-metadata-flat/24.json
cp nft-metadata/ev/2-velocity.json nft-metadata-flat/25.json
cp nft-metadata/ev/3-autobahn.json nft-metadata-flat/26.json
cp nft-metadata/ev/4-hyperdrive.json nft-metadata-flat/27.json
cp nft-metadata/ev/5-electra.json nft-metadata-flat/28.json
cp nft-metadata/ev/6-velocity-pro.json nft-metadata-flat/29.json
cp nft-metadata/ev/7-mach-one.json nft-metadata-flat/30.json
cp nft-metadata/ev/8-centaurion.json nft-metadata-flat/31.json
cp nft-metadata/ev/9-voyager.json nft-metadata-flat/32.json
cp nft-metadata/ev/10-odyssey.json nft-metadata-flat/33.json

# Combos (34-41)
cp nft-metadata/combo/1-duality.json nft-metadata-flat/34.json
cp nft-metadata/combo/2-trifecta.json nft-metadata-flat/35.json
cp nft-metadata/combo/3-quadrant.json nft-metadata-flat/36.json
cp nft-metadata/combo/4-constellation.json nft-metadata-flat/37.json
cp nft-metadata/combo/5-cyber-echo.json nft-metadata-flat/38.json
cp nft-metadata/combo/6-zenith.json nft-metadata-flat/39.json
cp nft-metadata/combo/7-zenmaster.json nft-metadata-flat/40.json
cp nft-metadata/combo/8-total-eclipse.json nft-metadata-flat/41.json
```

---

## After Re-Upload

1. Upload the `nft-metadata-flat` folder to Pinata
2. Get the new CID
3. Deploy ZenSolarNFT with baseURI: `ipfs://[NEW_CID]/`
4. The contract's `tokenURI(tokenId)` will return: `ipfs://[NEW_CID]/[tokenId].json`

---

## Smart Contract Token ID Mapping

Add this to your backend to map milestone IDs to token IDs:

```typescript
export const MILESTONE_TO_TOKEN_ID: Record<string, number> = {
  // Welcome
  'welcome': 0,
  
  // Solar (1-8)
  'solar_1': 1,  // Sunspark
  'solar_2': 2,  // Photonic
  'solar_3': 3,  // Rayforge
  'solar_4': 4,  // Solaris
  'solar_5': 5,  // Helios
  'solar_6': 6,  // Sunforge
  'solar_7': 7,  // Gigasun
  'solar_8': 8,  // Starforge
  
  // Battery (9-15)
  'battery_1': 9,   // Voltbank
  'battery_2': 10,  // Gridpulse
  'battery_3': 11,  // Megacell
  'battery_4': 12,  // Reservex
  'battery_5': 13,  // Dynamax
  'battery_6': 14,  // Ultracell
  'battery_7': 15,  // Gigavolt
  
  // Charging (16-23)
  'charge_1': 16,  // Ignite
  'charge_2': 17,  // Voltcharge
  'charge_3': 18,  // Kilovolt
  'charge_4': 19,  // Ampforge
  'charge_5': 20,  // Chargeon
  'charge_6': 21,  // Gigacharge
  'charge_7': 22,  // Megacharge
  'charge_8': 23,  // Teracharge
  
  // EV Miles (24-33)
  'ev_1': 24,   // Ignitor
  'ev_2': 25,   // Velocity
  'ev_3': 26,   // Autobahn
  'ev_4': 27,   // Hyperdrive
  'ev_5': 28,   // Electra
  'ev_6': 29,   // Velocity Pro
  'ev_7': 30,   // Mach One
  'ev_8': 31,   // Centaurion
  'ev_9': 32,   // Voyager
  'ev_10': 33,  // Odyssey
  
  // Combos (34-41)
  'combo_1': 34,  // Duality
  'combo_2': 35,  // Trifecta
  'combo_3': 36,  // Quadrant
  'combo_4': 37,  // Constellation
  'combo_5': 38,  // Cyber Echo
  'combo_6': 39,  // Zenith
  'combo_7': 40,  // ZenMaster
  'combo_8': 41,  // Total Eclipse
};

export const TOKEN_ID_TO_MILESTONE: Record<number, string> = Object.fromEntries(
  Object.entries(MILESTONE_TO_TOKEN_ID).map(([k, v]) => [v, k])
);
```
