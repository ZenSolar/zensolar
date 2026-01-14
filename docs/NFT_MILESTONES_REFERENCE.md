# ZenSolar NFT Milestones Reference

**Generated:** January 14, 2026  
**Purpose:** Smart contract alignment reference for blockchain minting  
**Total NFTs:** 35

---

## Overview

| Category | NFT Count | Unit | Notes |
|----------|-----------|------|-------|
| Solar Production | 9 | kWh | Includes Genesis (welcome NFT at 0 threshold) |
| EV Miles Driven | 7 | miles | |
| EV Charging | 6 | kWh | |
| Battery Discharge | 6 | kWh | |
| Combo Achievements | 7 | varies | Cross-category achievements |

---

## Category 1: Solar Production (9 NFTs)

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `solar_welcome` | Genesis | 0 kWh | Welcome to the grid | `solar-genesis.png` |
| 2 | `solar_1` | Sunlink | 500 kWh | 500 kWh generated | `solar-sunlink.png` |
| 3 | `solar_2` | Photon | 1,000 kWh | 1,000 kWh generated | `solar-photon.png` |
| 4 | `solar_3` | Rayfield | 2,500 kWh | 2,500 kWh generated | `solar-rayfield.png` |
| 5 | `solar_4` | Solarflare | 5,000 kWh | 5,000 kWh generated | `solar-solarflare.png` |
| 6 | `solar_5` | Heliogen | 10,000 kWh | 10,000 kWh generated | `solar-heliogen.png` |
| 7 | `solar_6` | Sunvault | 25,000 kWh | 25,000 kWh generated | `solar-sunvault.png` |
| 8 | `solar_7` | Gigasol | 50,000 kWh | 50,000 kWh generated | `solar-gigasol.png` |
| 9 | `solar_8` | Starpower | 100,000 kWh | 100,000 kWh generated | `solar-starpower.png` |

**Note:** Genesis (solar_welcome) is awarded automatically to new users with threshold = 0.

---

## Category 2: EV Miles Driven (7 NFTs)

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `ev_1` | Ignition | 100 miles | 100 miles driven | `ev-ignition.png` |
| 2 | `ev_2` | Cruiser | 500 miles | 500 miles driven | `ev-cruiser.png` |
| 3 | `ev_3` | Autobahn | 1,000 miles | 1,000 miles driven | `ev-autobahn.png` |
| 4 | `ev_4` | Hyperlane | 5,000 miles | 5,000 miles driven | `ev-hyperlane.png` |
| 5 | `ev_5` | Roadster | 10,000 miles | 10,000 miles driven | `ev-roadster.png` |
| 6 | `ev_6` | Plaid | 25,000 miles | 25,000 miles driven | `ev-plaid.png` |
| 7 | `ev_7` | Ludicrous | 50,000 miles | 50,000 miles driven | `ev-ludicrous.png` |

---

## Category 3: EV Charging (6 NFTs)

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `charge_1` | Spark | 100 kWh | 100 kWh charged | `charge-spark.png` |
| 2 | `charge_2` | Supercharger | 500 kWh | 500 kWh charged | `charge-supercharger.png` |
| 3 | `charge_3` | Megavolt | 1,000 kWh | 1,000 kWh charged | `charge-megavolt.png` |
| 4 | `charge_4` | Amperage | 2,500 kWh | 2,500 kWh charged | `charge-amperage.png` |
| 5 | `charge_5` | Destination | 5,000 kWh | 5,000 kWh charged | `charge-destination.png` |
| 6 | `charge_6` | Gigawatt | 10,000 kWh | 10,000 kWh charged | `charge-gigawatt.png` |

---

## Category 4: Battery Discharge (6 NFTs)

| # | ID | Name | Threshold | Description | Artwork File |
|---|-----|------|-----------|-------------|--------------|
| 1 | `battery_1` | Powerwall | 500 kWh | 500 kWh discharged | `battery-powerwall.png` |
| 2 | `battery_2` | Gridlink | 1,000 kWh | 1,000 kWh discharged | `battery-gridlink.png` |
| 3 | `battery_3` | Megapack | 2,500 kWh | 2,500 kWh discharged | `battery-megapack.png` |
| 4 | `battery_4` | Reservoir | 5,000 kWh | 5,000 kWh discharged | `battery-reservoir.png` |
| 5 | `battery_5` | Dynamo | 10,000 kWh | 10,000 kWh discharged | `battery-dynamo.png` |
| 6 | `battery_6` | Gigabank | 25,000 kWh | 25,000 kWh discharged | `battery-gigabank.png` |

---

## Category 5: Combo Achievements (7 NFTs)

| # | ID | Name | Condition | Description | Rarity Tier | Artwork File |
|---|-----|------|-----------|-------------|-------------|--------------|
| 1 | `combo_1` | Duality | 2 categories | Earn NFT in 2 categories | Premium | `combo-duality.png` |
| 2 | `combo_2` | Trifecta | 3 categories | Earn NFT in 3 categories | Trifecta | `combo-trifecta.png` |
| 3 | `combo_3` | Quadrant | 4 categories | Earn NFT in all 4 categories | Quadrant | `combo-quadrant.png` |
| 4 | `combo_4` | Constellation | 5 total NFTs | Earn 5 total NFTs | Constellation | `combo-constellation.png` |
| 5 | `combo_5` | Ecosystem | 10 total NFTs | Earn 10 total NFTs | Ecosystem | `combo-ecosystem.png` |
| 6 | `combo_6` | Apex | 1 maxed category | Max out any category | Apex | `combo-apex.png` |
| 7 | `combo_7` | Zenith | 4 maxed categories | Max out all categories | Zenith (Ultimate) | `combo-zenith.png` |

### Combo Achievement Logic

```javascript
// Categories with at least 1 NFT earned (excluding welcome)
categoriesWithNFTs = count of categories where earned > 0

// Total NFTs across all categories (excluding welcome)
totalNFTs = solar + evMiles + evCharging + battery

// Category maxed = earned all NFTs in that category
solarMaxed = earned 9 solar NFTs (including Genesis)
evMilesMaxed = earned 7 EV miles NFTs  
evChargingMaxed = earned 6 EV charging NFTs
batteryMaxed = earned 6 battery NFTs

// Combo Awards:
Duality → categoriesWithNFTs >= 2
Trifecta → categoriesWithNFTs >= 3  
Quadrant → categoriesWithNFTs >= 4
Constellation → totalNFTs >= 5
Ecosystem → totalNFTs >= 10
Apex → any 1 category maxed
Zenith → all 4 categories maxed
```

---

## Smart Contract Data Structure

### Suggested Token ID Mapping

| Token ID Range | Category |
|----------------|----------|
| 1-9 | Solar Production |
| 10-16 | EV Miles Driven |
| 17-22 | EV Charging |
| 23-28 | Battery Discharge |
| 29-35 | Combo Achievements |

### Complete Token ID Mapping

| Token ID | Milestone ID | Name | Category |
|----------|--------------|------|----------|
| 1 | `solar_welcome` | Genesis | Solar |
| 2 | `solar_1` | Sunlink | Solar |
| 3 | `solar_2` | Photon | Solar |
| 4 | `solar_3` | Rayfield | Solar |
| 5 | `solar_4` | Solarflare | Solar |
| 6 | `solar_5` | Heliogen | Solar |
| 7 | `solar_6` | Sunvault | Solar |
| 8 | `solar_7` | Gigasol | Solar |
| 9 | `solar_8` | Starpower | Solar |
| 10 | `ev_1` | Ignition | EV Miles |
| 11 | `ev_2` | Cruiser | EV Miles |
| 12 | `ev_3` | Autobahn | EV Miles |
| 13 | `ev_4` | Hyperlane | EV Miles |
| 14 | `ev_5` | Roadster | EV Miles |
| 15 | `ev_6` | Plaid | EV Miles |
| 16 | `ev_7` | Ludicrous | EV Miles |
| 17 | `charge_1` | Spark | EV Charging |
| 18 | `charge_2` | Supercharger | EV Charging |
| 19 | `charge_3` | Megavolt | EV Charging |
| 20 | `charge_4` | Amperage | EV Charging |
| 21 | `charge_5` | Destination | EV Charging |
| 22 | `charge_6` | Gigawatt | EV Charging |
| 23 | `battery_1` | Powerwall | Battery |
| 24 | `battery_2` | Gridlink | Battery |
| 25 | `battery_3` | Megapack | Battery |
| 26 | `battery_4` | Reservoir | Battery |
| 27 | `battery_5` | Dynamo | Battery |
| 28 | `battery_6` | Gigabank | Battery |
| 29 | `combo_1` | Duality | Combo |
| 30 | `combo_2` | Trifecta | Combo |
| 31 | `combo_3` | Quadrant | Combo |
| 32 | `combo_4` | Constellation | Combo |
| 33 | `combo_5` | Ecosystem | Combo |
| 34 | `combo_6` | Apex | Combo |
| 35 | `combo_7` | Zenith | Combo |

---

## Metadata URI Structure

Suggested format for NFT metadata:

```json
{
  "name": "Genesis",
  "description": "Welcome to the grid",
  "image": "ipfs://[CID]/solar-genesis.png",
  "attributes": [
    {
      "trait_type": "Category",
      "value": "Solar Production"
    },
    {
      "trait_type": "Threshold",
      "value": 0
    },
    {
      "trait_type": "Unit",
      "value": "kWh"
    },
    {
      "trait_type": "Milestone ID",
      "value": "solar_welcome"
    },
    {
      "trait_type": "Token ID",
      "value": 1
    }
  ]
}
```

---

## Artwork Files Location

All artwork files are stored in: `src/assets/nft/`

Total: 35 PNG files at 1024x1024 resolution

---

## Notes for Smart Contract

1. **Genesis NFT** is auto-minted for new users (threshold = 0)
2. **Combo NFTs** require cross-category calculations, not simple threshold checks
3. **Apex** requires checking if ANY category is fully completed
4. **Zenith** requires ALL 4 categories to be fully completed
5. All thresholds are **greater than or equal to** (>=) checks
6. Consider implementing batch minting for users who qualify for multiple NFTs at once
