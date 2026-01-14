# ZenSolar NFT Milestones Reference

**Updated:** January 14, 2026  
**Source:** final_milestones.docx  
**Total NFTs:** 34

---

## Overview

| Category | NFT Count | Unit | Notes |
|----------|-----------|------|-------|
| Welcome | 1 | - | Auto-minted on registration, non-redeemable |
| Solar Production | 8 | kWh | |
| Battery Discharge | 7 | kWh | |
| EV Charging | 8 | kWh | Combined supercharger + home charger |
| EV Miles Driven | 10 | miles | |

**CO₂ Offset:** Display-only metric, no direct rewards or NFTs

---

## Welcome NFT (1 NFT)

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `welcome` | Welcome | 0 | Welcome to ZenSolar | `solar-genesis.png` |

**Note:** Issued automatically on account registration. Non-redeemable. Only one per user.

---

## Category 1: Solar Energy Produced (8 NFTs)

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `solar_1` | Sunlink | 500 kWh | 500 kWh generated | `solar-sunlink.png` |
| 2 | `solar_2` | Photon | 1,000 kWh | 1,000 kWh generated | `solar-photon.png` |
| 3 | `solar_3` | Rayfield | 2,500 kWh | 2,500 kWh generated | `solar-rayfield.png` |
| 4 | `solar_4` | Solarflare | 5,000 kWh | 5,000 kWh generated | `solar-solarflare.png` |
| 5 | `solar_5` | Heliogen | 10,000 kWh | 10,000 kWh generated | `solar-heliogen.png` |
| 6 | `solar_6` | Sunvault | 25,000 kWh | 25,000 kWh generated | `solar-sunvault.png` |
| 7 | `solar_7` | Gigasol | 50,000 kWh | 50,000 kWh generated | `solar-gigasol.png` |
| 8 | `solar_8` | Starpower | 100,000 kWh | 100,000 kWh generated | `solar-starpower.png` |

---

## Category 2: Battery Storage Discharged (7 NFTs)

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `battery_1` | Powerwall | 500 kWh | 500 kWh discharged | `battery-powerwall.png` |
| 2 | `battery_2` | Gridlink | 1,000 kWh | 1,000 kWh discharged | `battery-gridlink.png` |
| 3 | `battery_3` | Megapack | 2,500 kWh | 2,500 kWh discharged | `battery-megapack.png` |
| 4 | `battery_4` | Reservoir | 5,000 kWh | 5,000 kWh discharged | `battery-reservoir.png` |
| 5 | `battery_5` | Dynamo | 10,000 kWh | 10,000 kWh discharged | `battery-dynamo.png` |
| 6 | `battery_6` | Gigabank | 25,000 kWh | 25,000 kWh discharged | `battery-gigabank.png` |
| 7 | `battery_7` | Ultrabank | 50,000 kWh | 50,000 kWh discharged | `battery-gigabank.png` ⚠️ |

⚠️ Needs unique artwork

---

## Category 3: EV Charging (8 NFTs)

Combined supercharger + home charger kWh

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `charge_1` | Spark | 100 kWh | 100 kWh charged | `charge-spark.png` |
| 2 | `charge_2` | Supercharger | 500 kWh | 500 kWh charged | `charge-supercharger.png` |
| 3 | `charge_3` | Megavolt | 1,000 kWh | 1,000 kWh charged | `charge-megavolt.png` |
| 4 | `charge_4` | Amperage | 1,500 kWh | 1,500 kWh charged | `charge-amperage.png` |
| 5 | `charge_5` | Destination | 2,500 kWh | 2,500 kWh charged | `charge-destination.png` |
| 6 | `charge_6` | Gigawatt | 5,000 kWh | 5,000 kWh charged | `charge-gigawatt.png` |
| 7 | `charge_7` | Megawatt | 10,000 kWh | 10,000 kWh charged | `charge-gigawatt.png` ⚠️ |
| 8 | `charge_8` | Terawatt | 25,000 kWh | 25,000 kWh charged | `charge-gigawatt.png` ⚠️ |

⚠️ Needs unique artwork

---

## Category 4: EV Miles Driven (10 NFTs)

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `ev_1` | Ignition | 100 miles | 100 miles driven | `ev-ignition.png` |
| 2 | `ev_2` | Cruiser | 500 miles | 500 miles driven | `ev-cruiser.png` |
| 3 | `ev_3` | Autobahn | 1,000 miles | 1,000 miles driven | `ev-autobahn.png` |
| 4 | `ev_4` | Hyperlane | 5,000 miles | 5,000 miles driven | `ev-hyperlane.png` |
| 5 | `ev_5` | Roadster | 10,000 miles | 10,000 miles driven | `ev-roadster.png` |
| 6 | `ev_6` | Plaid | 25,000 miles | 25,000 miles driven | `ev-plaid.png` |
| 7 | `ev_7` | Ludicrous | 50,000 miles | 50,000 miles driven | `ev-ludicrous.png` |
| 8 | `ev_8` | Centurion | 100,000 miles | 100,000 miles driven | `ev-ludicrous.png` ⚠️ |
| 9 | `ev_9` | Voyager | 150,000 miles | 150,000 miles driven | `ev-ludicrous.png` ⚠️ |
| 10 | `ev_10` | Legend | 200,000 miles | 200,000 miles driven | `ev-ludicrous.png` ⚠️ |

⚠️ Needs unique artwork

---

## Smart Contract Data Structure

### Suggested Token ID Mapping

| Token ID Range | Category |
|----------------|----------|
| 1 | Welcome |
| 2-9 | Solar Production |
| 10-16 | Battery Discharge |
| 17-24 | EV Charging |
| 25-34 | EV Miles Driven |

### Complete Token ID Mapping

| Token ID | Milestone ID | Name | Category |
|----------|--------------|------|----------|
| 1 | `welcome` | Welcome | Welcome |
| 2 | `solar_1` | Sunlink | Solar |
| 3 | `solar_2` | Photon | Solar |
| 4 | `solar_3` | Rayfield | Solar |
| 5 | `solar_4` | Solarflare | Solar |
| 6 | `solar_5` | Heliogen | Solar |
| 7 | `solar_6` | Sunvault | Solar |
| 8 | `solar_7` | Gigasol | Solar |
| 9 | `solar_8` | Starpower | Solar |
| 10 | `battery_1` | Powerwall | Battery |
| 11 | `battery_2` | Gridlink | Battery |
| 12 | `battery_3` | Megapack | Battery |
| 13 | `battery_4` | Reservoir | Battery |
| 14 | `battery_5` | Dynamo | Battery |
| 15 | `battery_6` | Gigabank | Battery |
| 16 | `battery_7` | Ultrabank | Battery |
| 17 | `charge_1` | Spark | EV Charging |
| 18 | `charge_2` | Supercharger | EV Charging |
| 19 | `charge_3` | Megavolt | EV Charging |
| 20 | `charge_4` | Amperage | EV Charging |
| 21 | `charge_5` | Destination | EV Charging |
| 22 | `charge_6` | Gigawatt | EV Charging |
| 23 | `charge_7` | Megawatt | EV Charging |
| 24 | `charge_8` | Terawatt | EV Charging |
| 25 | `ev_1` | Ignition | EV Miles |
| 26 | `ev_2` | Cruiser | EV Miles |
| 27 | `ev_3` | Autobahn | EV Miles |
| 28 | `ev_4` | Hyperlane | EV Miles |
| 29 | `ev_5` | Roadster | EV Miles |
| 30 | `ev_6` | Plaid | EV Miles |
| 31 | `ev_7` | Ludicrous | EV Miles |
| 32 | `ev_8` | Centurion | EV Miles |
| 33 | `ev_9` | Voyager | EV Miles |
| 34 | `ev_10` | Legend | EV Miles |

---

## Metadata URI Structure

Suggested format for NFT metadata:

```json
{
  "name": "Sunlink",
  "description": "500 kWh generated",
  "image": "ipfs://[CID]/solar-sunlink.png",
  "attributes": [
    {
      "trait_type": "Category",
      "value": "Solar Production"
    },
    {
      "trait_type": "Threshold",
      "value": 500
    },
    {
      "trait_type": "Unit",
      "value": "kWh"
    },
    {
      "trait_type": "Milestone ID",
      "value": "solar_1"
    },
    {
      "trait_type": "Token ID",
      "value": 2
    }
  ]
}
```

---

## Artwork Files Location

All artwork files are stored in: `src/assets/nft/`

### Existing (28 files):
- 1 Welcome: `solar-genesis.png` (reused)
- 8 Solar: `solar-sunlink.png` through `solar-starpower.png`
- 6 Battery: `battery-powerwall.png` through `battery-gigabank.png`
- 6 EV Charging: `charge-spark.png` through `charge-gigawatt.png`
- 7 EV Miles: `ev-ignition.png` through `ev-ludicrous.png`

### Artwork Needed (6 files):
- `battery-ultrabank.png` (battery_7)
- `charge-megawatt.png` (charge_7)
- `charge-terawatt.png` (charge_8)
- `ev-centurion.png` (ev_8)
- `ev-voyager.png` (ev_9)
- `ev-legend.png` (ev_10)

---

## Key Notes

1. **Welcome NFT** is auto-minted on account registration (non-redeemable)
2. **EV Miles** has higher thresholds to reflect real-world driving distances
3. **EV Charging** combines supercharger and home charger kWh
4. **CO₂ Offset** is display-only (no NFTs or direct rewards)
5. All thresholds are **greater than or equal to** (>=) checks
6. Each milestone cross mints one NFT per field
7. **No Combo NFTs** in this version
