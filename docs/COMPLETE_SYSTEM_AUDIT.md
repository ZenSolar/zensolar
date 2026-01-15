# ZenSolar Complete System Audit

**Last Updated:** January 15, 2026  
**Status:** ✅ All Systems Aligned

---

## Executive Summary

This document provides a comprehensive cross-reference audit of all token issuance and NFT minting rules across the ZenSolar ecosystem. All components have been verified to be consistent and aligned.

---

## 1. Token Issuance Rules (ZSOLAR ERC-20)

### Core Principle
**1 unit of activity = 1 ZSOLAR token (issued ONCE)**

| Activity Type | Unit | Rate | Can Double-Issue? |
|---------------|------|------|-------------------|
| Solar Production | kWh | 1:1 | ❌ NO |
| Battery Discharge | kWh | 1:1 | ❌ NO |
| EV Charging | kWh | 1:1 | ❌ NO |
| EV Miles Driven | miles | 1:1 | ❌ NO |

### Cross-Reference Verification

| Component | File | Token Rate | Status |
|-----------|------|------------|--------|
| Smart Contract | `contracts/ZenSolar.sol` | `TOKENS_PER_UNIT = 1e18` | ✅ |
| Edge Function | `supabase/functions/calculate-rewards/index.ts` | `REWARD_RATES = {all: 1}` | ✅ |
| Dashboard Types | `src/types/dashboard.ts` | Documented 1:1 | ✅ |
| Documentation | `docs/TOKEN_ISSUANCE_RULES.md` | 1:1 per unit | ✅ |

### Token Distribution on Mint

| Recipient | Percentage | Verified In |
|-----------|------------|-------------|
| User | 93% | `ZenSolar.sol` line 130-133 |
| Burned | 5% | `ZenSolar.sol` line 130 |
| LP Rewards | 1% | `ZenSolar.sol` line 131 |
| Treasury | 1% | `ZenSolar.sol` line 132 |

---

## 2. NFT Token ID Mapping (42 Total NFTs)

### Token ID Ranges

| Category | Token IDs | Count | Verified |
|----------|-----------|-------|----------|
| Welcome | 0 | 1 | ✅ |
| Solar Production | 1-8 | 8 | ✅ |
| Battery Discharge | 9-15 | 7 | ✅ |
| EV Charging | 16-23 | 8 | ✅ |
| EV Miles Driven | 24-33 | 10 | ✅ |
| Combo Achievements | 34-41 | 8 | ✅ |
| **Total** | 0-41 | **42** | ✅ |

### Solar Production NFTs (Token IDs 1-8)

| Token ID | Milestone ID | Name | Threshold | Verified Sources |
|----------|--------------|------|-----------|------------------|
| 1 | `solar_1` | Sunspark | 500 kWh | ✅ All 5 sources |
| 2 | `solar_2` | Photonic | 1,000 kWh | ✅ All 5 sources |
| 3 | `solar_3` | Rayforge | 2,500 kWh | ✅ All 5 sources |
| 4 | `solar_4` | Solaris | 5,000 kWh | ✅ All 5 sources |
| 5 | `solar_5` | Helios | 10,000 kWh | ✅ All 5 sources |
| 6 | `solar_6` | Sunforge | 25,000 kWh | ✅ All 5 sources |
| 7 | `solar_7` | Gigasun | 50,000 kWh | ✅ All 5 sources |
| 8 | `solar_8` | Starforge | 100,000 kWh | ✅ All 5 sources |

### Battery Discharge NFTs (Token IDs 9-15)

| Token ID | Milestone ID | Name | Threshold | Verified Sources |
|----------|--------------|------|-----------|------------------|
| 9 | `battery_1` | Voltbank | 500 kWh | ✅ All 5 sources |
| 10 | `battery_2` | Gridpulse | 1,000 kWh | ✅ All 5 sources |
| 11 | `battery_3` | Megacell | 2,500 kWh | ✅ All 5 sources |
| 12 | `battery_4` | Reservex | 5,000 kWh | ✅ All 5 sources |
| 13 | `battery_5` | Dynamax | 10,000 kWh | ✅ All 5 sources |
| 14 | `battery_6` | Ultracell | 25,000 kWh | ✅ All 5 sources |
| 15 | `battery_7` | Gigavolt | 50,000 kWh | ✅ All 5 sources |

### EV Charging NFTs (Token IDs 16-23)

| Token ID | Milestone ID | Name | Threshold | Verified Sources |
|----------|--------------|------|-----------|------------------|
| 16 | `charge_1` | Ignite | 100 kWh | ✅ All 5 sources |
| 17 | `charge_2` | Voltcharge | 500 kWh | ✅ All 5 sources |
| 18 | `charge_3` | Kilovolt | 1,000 kWh | ✅ All 5 sources |
| 19 | `charge_4` | Ampforge | 1,500 kWh | ✅ All 5 sources |
| 20 | `charge_5` | Chargeon | 2,500 kWh | ✅ All 5 sources |
| 21 | `charge_6` | Gigacharge | 5,000 kWh | ✅ All 5 sources |
| 22 | `charge_7` | Megacharge | 10,000 kWh | ✅ All 5 sources |
| 23 | `charge_8` | Teracharge | 25,000 kWh | ✅ All 5 sources |

### EV Miles Driven NFTs (Token IDs 24-33)

| Token ID | Milestone ID | Name | Threshold | Verified Sources |
|----------|--------------|------|-----------|------------------|
| 24 | `ev_1` | Ignitor | 100 miles | ✅ All 5 sources |
| 25 | `ev_2` | Velocity | 500 miles | ✅ All 5 sources |
| 26 | `ev_3` | Autobahn | 1,000 miles | ✅ All 5 sources |
| 27 | `ev_4` | Hyperdrive | 5,000 miles | ✅ All 5 sources |
| 28 | `ev_5` | Electra | 10,000 miles | ✅ All 5 sources |
| 29 | `ev_6` | Velocity Pro | 25,000 miles | ✅ All 5 sources |
| 30 | `ev_7` | Mach One | 50,000 miles | ✅ All 5 sources |
| 31 | `ev_8` | Centaurion | 100,000 miles | ✅ All 5 sources |
| 32 | `ev_9` | Voyager | 150,000 miles | ✅ All 5 sources |
| 33 | `ev_10` | Odyssey | 200,000 miles | ✅ All 5 sources |

### Combo Achievement NFTs (Token IDs 34-41)

| Token ID | Milestone ID | Name | Condition | Verified Sources |
|----------|--------------|------|-----------|------------------|
| 34 | `combo_1` | Duality | 2 categories with ≥1 NFT | ✅ All 5 sources |
| 35 | `combo_2` | Trifecta | 3 categories with ≥1 NFT | ✅ All 5 sources |
| 36 | `combo_3` | Quadrant | 5 total category NFTs | ✅ All 5 sources |
| 37 | `combo_4` | Constellation | 10 total category NFTs | ✅ All 5 sources |
| 38 | `combo_5` | Cyber Echo | 20 total category NFTs | ✅ All 5 sources |
| 39 | `combo_6` | Zenith | 30 total category NFTs | ✅ All 5 sources |
| 40 | `combo_7` | ZenMaster | 1 category maxed | ✅ All 5 sources |
| 41 | `combo_8` | Total Eclipse | All 4 categories maxed | ✅ All 5 sources |

---

## 3. Source File Cross-Reference

### Verified Source Files (5 Total)

1. **Smart Contract:** `contracts/ZenSolar.sol`
2. **Frontend Milestones:** `src/lib/nftMilestones.ts`
3. **Frontend Token Mapping:** `src/lib/nftTokenMapping.ts`
4. **Edge Function:** `supabase/functions/calculate-rewards/index.ts`
5. **IPFS Metadata:** `public/nft-metadata-flat/*.json`

### Alignment Status

| Check | Status |
|-------|--------|
| Token IDs match across all files | ✅ PASS |
| Threshold values match across all files | ✅ PASS |
| NFT names match across all files | ✅ PASS |
| Milestone IDs match across all files | ✅ PASS |
| Combo logic matches across all files | ✅ PASS |
| Token issuance rates match | ✅ PASS |
| Redemption rules match | ✅ PASS |

---

## 4. Anti-Double-Issuance Mechanisms

### Smart Contract Level

```solidity
// ZenSolar.sol
mapping(address => mapping(string => mapping(uint256 => bool))) public milestonesMinted;
```

- Each milestone can only be minted ONCE per user
- `tokenIdExists` mapping in `ZenSolarNFT.sol` prevents duplicate token IDs
- `canMint(tokenId)` check before every mint

### Backend Level

```typescript
// connected_devices.baseline_data
{
  "captured_at": "2026-01-15T10:00:00Z",
  "total_solar_produced_wh": 12847000,
  "odometer": 24532
}
```

- Baseline tracking prevents re-counting activity
- Delta calculation: `pending = current_lifetime - baseline`
- Baseline reset ONLY after successful mint

### Database Level

- `last_minted_at` timestamp on `connected_devices`
- `user_rewards` table tracks all issued rewards
- Foreign key constraints prevent orphaned records

---

## 5. NFT Redemption Rules

| NFT Type | Redeemable? | Value | Fee |
|----------|-------------|-------|-----|
| Welcome | ❌ NO | - | - |
| Solar | ✅ YES | threshold × 1 ZSOLAR | 2% burn |
| Battery | ✅ YES | threshold × 1 ZSOLAR | 2% burn |
| EV Charging | ✅ YES | threshold × 1 ZSOLAR | 2% burn |
| EV Miles | ✅ YES | threshold × 1 ZSOLAR | 2% burn |
| Combo | ❌ NO | - | - |

**Verified in:** `ZenSolar.sol` lines 193-216

---

## 6. Dashboard KPI to Token Mapping

| Dashboard KPI | Token Type | Rate | Resets After Mint? |
|---------------|------------|------|-------------------|
| `solarEnergyProduced` (lifetime) | NFT milestones | - | No |
| `pendingSolarKwh` (delta) | ZSOLAR tokens | 1:1 | Yes |
| `evMilesDriven` (lifetime) | NFT milestones | - | No |
| `pendingEvMiles` (delta) | ZSOLAR tokens | 1:1 | Yes |
| `batteryStorageDischarged` (lifetime) | NFT milestones | - | No |
| `pendingBatteryKwh` (delta) | ZSOLAR tokens | 1:1 | Yes |
| `teslaSuperchargerKwh + homeChargerKwh` (lifetime) | NFT milestones | - | No |
| `pendingChargingKwh` (delta) | ZSOLAR tokens | 1:1 | Yes |
| `co2OffsetPounds` | Display only | - | No |

---

## 7. Pre-Deployment Checklist

### Smart Contracts

- [x] ZSOLAR token contract (`ZSOLAR.sol`)
- [x] ZenSolarNFT contract (`ZenSolarNFT.sol`) 
- [x] ZenSolar main contract (`ZenSolar.sol`)
- [x] Fixed token IDs in all milestone arrays
- [x] Combo NFT minting function
- [x] NFT redemption with 2% burn
- [x] Tax exemptions configured

### Metadata (IPFS)

- [x] 42 JSON files (0.json - 41.json)
- [x] Token IDs embedded in each file
- [x] Milestone IDs embedded in each file
- [x] Threshold values embedded in each file
- [x] Images referenced correctly

### Backend (Edge Functions)

- [x] Correct NFT names (not legacy names)
- [x] Token IDs included in response
- [x] Combo NFT calculation logic
- [x] Baseline reset on claim
- [x] Delta calculation for tokens

### Frontend

- [x] nftMilestones.ts aligned
- [x] nftTokenMapping.ts aligned
- [x] Dashboard displays pending vs lifetime
- [x] Types include pending fields

---

## 8. Known Constraints

1. **Welcome NFT (Token ID 0):** Only ONE can ever exist globally (first registered user gets it)
2. **NFT Uniqueness:** Each token ID can only be minted once total (not per user)
3. **Combo NFTs:** Based on category NFTs only (combos don't count toward combos)
4. **Max Category NFTs:** Solar=8, Battery=7, Charging=8, EV Miles=10 (total=33)
5. **Token Supply:** Max 50 billion ZSOLAR tokens

---

## 9. Audit Conclusion

**All systems are aligned and ready for mainnet deployment.**

The comprehensive cross-reference confirms:
- ✅ Token issuance rates are consistent (1:1)
- ✅ NFT token IDs match across all 5 source files
- ✅ Milestone thresholds are identical everywhere
- ✅ Combo logic is consistent
- ✅ Anti-double-issuance mechanisms are in place
- ✅ Redemption rules are clear and enforced

---

*Document generated: January 15, 2026*
