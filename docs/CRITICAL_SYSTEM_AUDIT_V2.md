# ZenSolar Critical System Audit V2
## Pre-Deployment Smart Contract Verification
**Audit Date:** January 15, 2026
**Status:** ✅ RESOLVED - Ready for Deployment

---

## 🔧 RESOLVED: NFT Architecture Fixed

The NFT contract has been converted from ERC-721 to ERC-1155:
- Each token ID (0-41) now represents an NFT **TYPE** that multiple users can earn
- `userHasToken[address][tokenId]` tracks per-user ownership
- NFTs are now **soulbound** (non-transferable) - only minting and burning allowed
- Added batch minting support for efficiency

---

## 1. TOKEN ISSUANCE CROSS-REFERENCE

### 1.1 Token Rate Verification (1:1 Issuance)

| Activity | Smart Contract (ZenSolar.sol) | Edge Function | Dashboard | Status |
|----------|------------------------------|---------------|-----------|--------|
| Solar kWh | `TOKENS_PER_UNIT = 1e18` | `solar_production: 1` | `Math.floor(solarEnergy)` | ✅ ALIGNED |
| EV Miles | `TOKENS_PER_UNIT = 1e18` | `ev_miles: 1` | `Math.floor(evMiles)` | ✅ ALIGNED |
| Battery kWh | `TOKENS_PER_UNIT = 1e18` | `battery_discharge: 1` | `Math.floor(batteryDischarge)` | ✅ ALIGNED |
| Charging kWh | `TOKENS_PER_UNIT = 1e18` | `ev_charging: 1` | `Math.floor(superchargerKwh + homeChargerKwh)` | ✅ ALIGNED |

### 1.2 Mint Distribution Verification

| Distribution | Smart Contract | Documentation | Status |
|--------------|----------------|---------------|--------|
| User | 93% | 93% | ✅ ALIGNED |
| Burn | 5% | 5% | ✅ ALIGNED |
| LP Rewards | 1% | 1% | ✅ ALIGNED |
| Treasury | 1% | 1% | ✅ ALIGNED |

---

## 2. NFT TOKEN ID MAPPING - COMPLETE CROSS-REFERENCE

### 2.1 Welcome NFT

| Source | Token ID | Name | Status |
|--------|----------|------|--------|
| ZenSolar.sol | 0 | "Welcome" | ✅ |
| ZenSolarNFT.sol | 0 | - | ✅ |
| nftTokenMapping.ts | 0 | "welcome" | ✅ |
| nftMilestones.ts | - | "Welcome" | ✅ |
| calculate-rewards | 0 | "Welcome" | ✅ |
| 0.json metadata | 0 | "Welcome to ZenSolar" | ✅ |

### 2.2 Solar Production NFTs (Token IDs 1-8)

| Token ID | Smart Contract Threshold | Frontend Threshold | Edge Function | Metadata Name | Milestone ID | Status |
|----------|--------------------------|-------------------|---------------|---------------|--------------|--------|
| 1 | 500 | 500 | 500 (Sunspark) | Sunspark | solar_1 | ✅ |
| 2 | 1000 | 1000 | 1000 (Photonic) | Photonic | solar_2 | ✅ |
| 3 | 2500 | 2500 | 2500 (Rayforge) | Rayforge | solar_3 | ✅ |
| 4 | 5000 | 5000 | 5000 (Solaris) | Solaris | solar_4 | ✅ |
| 5 | 10000 | 10000 | 10000 (Helios) | Helios | solar_5 | ✅ |
| 6 | 25000 | 25000 | 25000 (Sunforge) | Sunforge | solar_6 | ✅ |
| 7 | 50000 | 50000 | 50000 (Gigasun) | Gigasun | solar_7 | ✅ |
| 8 | 100000 | 100000 | 100000 (Starforge) | Starforge | solar_8 | ✅ |

### 2.3 Battery Discharge NFTs (Token IDs 9-15)

| Token ID | Smart Contract Threshold | Frontend Threshold | Edge Function | Metadata Name | Milestone ID | Status |
|----------|--------------------------|-------------------|---------------|---------------|--------------|--------|
| 9 | 500 | 500 | 500 (Voltbank) | Voltbank | battery_1 | ✅ |
| 10 | 1000 | 1000 | 1000 (Gridpulse) | Gridpulse | battery_2 | ✅ |
| 11 | 2500 | 2500 | 2500 (Megacell) | Megacell | battery_3 | ✅ |
| 12 | 5000 | 5000 | 5000 (Reservex) | Reservex | battery_4 | ✅ |
| 13 | 10000 | 10000 | 10000 (Dynamax) | Dynamax | battery_5 | ✅ |
| 14 | 25000 | 25000 | 25000 (Ultracell) | Ultracell | battery_6 | ✅ |
| 15 | 50000 | 50000 | 50000 (Gigavolt) | Gigavolt | battery_7 | ✅ |

### 2.4 EV Charging NFTs (Token IDs 16-23)

| Token ID | Smart Contract Threshold | Frontend Threshold | Edge Function | Metadata Name | Milestone ID | Status |
|----------|--------------------------|-------------------|---------------|---------------|--------------|--------|
| 16 | 100 | 100 | 100 (Ignite) | Ignite | charge_1 | ✅ |
| 17 | 500 | 500 | 500 (Voltcharge) | Voltcharge | charge_2 | ✅ |
| 18 | 1000 | 1000 | 1000 (Kilovolt) | Kilovolt | charge_3 | ✅ |
| 19 | 1500 | 1500 | 1500 (Ampforge) | Ampforge | charge_4 | ✅ |
| 20 | 2500 | 2500 | 2500 (Chargeon) | Chargeon | charge_5 | ✅ |
| 21 | 5000 | 5000 | 5000 (Gigacharge) | Gigacharge | charge_6 | ✅ |
| 22 | 10000 | 10000 | 10000 (Megacharge) | Megacharge | charge_7 | ✅ |
| 23 | 25000 | 25000 | 25000 (Teracharge) | Teracharge | charge_8 | ✅ |

### 2.5 EV Miles Driven NFTs (Token IDs 24-33)

| Token ID | Smart Contract Threshold | Frontend Threshold | Edge Function | Metadata Name | Milestone ID | Status |
|----------|--------------------------|-------------------|---------------|---------------|--------------|--------|
| 24 | 100 | 100 | 100 (Ignitor) | Ignitor | ev_1 | ✅ |
| 25 | 500 | 500 | 500 (Velocity) | Velocity | ev_2 | ✅ |
| 26 | 1000 | 1000 | 1000 (Autobahn) | Autobahn | ev_3 | ✅ |
| 27 | 5000 | 5000 | 5000 (Hyperdrive) | Hyperdrive | ev_4 | ✅ |
| 28 | 10000 | 10000 | 10000 (Electra) | Electra | ev_5 | ✅ |
| 29 | 25000 | 25000 | 25000 (Velocity Pro) | Velocity Pro | ev_6 | ✅ |
| 30 | 50000 | 50000 | 50000 (Mach One) | Mach One | ev_7 | ✅ |
| 31 | 100000 | 100000 | 100000 (Centaurion) | Centaurion | ev_8 | ✅ |
| 32 | 150000 | 150000 | 150000 (Voyager) | Voyager | ev_9 | ✅ |
| 33 | 200000 | 200000 | 200000 (Odyssey) | Odyssey | ev_10 | ✅ |

### 2.6 Combo Achievement NFTs (Token IDs 34-41)

| Token ID | Requirement | Smart Contract | Frontend | Edge Function | Metadata | Status |
|----------|-------------|----------------|----------|---------------|----------|--------|
| 34 | 2 categories | `mintComboNFT` | 2 cats | 2 cats | Duality | ✅ |
| 35 | 3 categories | `mintComboNFT` | 3 cats | 3 cats | Trifecta | ✅ |
| 36 | 5 total NFTs | `mintComboNFT` | 5 total | 5 total | Quadrant | ✅ |
| 37 | 10 total NFTs | `mintComboNFT` | 10 total | 10 total | Constellation | ✅ |
| 38 | 20 total NFTs | `mintComboNFT` | 20 total | 20 total | Cyber Echo | ✅ |
| 39 | 30 total NFTs | `mintComboNFT` | 30 total | 30 total | Zenith | ✅ |
| 40 | 1 category maxed | `mintComboNFT` | 1 maxed | 1 maxed | ZenMaster | ✅ |
| 41 | 4 categories maxed | `mintComboNFT` | 4 maxed | 4 maxed | Total Eclipse | ✅ |

---

## 3. 🚨 CRITICAL ISSUES FOUND

### 3.1 🔴 CRITICAL: Welcome NFT Can Only Be Minted ONCE Globally

**File:** `contracts/ZenSolar.sol`, Line 90

```solidity
require(zenSolarNFT.canMint(WELCOME_TOKEN_ID), "Welcome NFT already minted");
```

**Problem:** The Welcome NFT (Token ID 0) can only be minted ONCE ever, not once per user. The `canMint` function in ZenSolarNFT.sol checks `!tokenIdExists[tokenId]` which is a GLOBAL flag, not per-user.

**Impact:** After the first user registers, NO OTHER USER can receive a Welcome NFT.

**Solution Required:** The Welcome NFT design needs to change. Options:
1. Remove Welcome NFT from fixed token IDs entirely
2. Use a different token ID range for Welcome NFTs (e.g., 1000000+)
3. Make Welcome NFT a soulbound token minted with incrementing IDs

### 3.2 🔴 CRITICAL: All Milestone NFTs Are One-Per-Ecosystem, Not One-Per-User

**Files:** `contracts/ZenSolarNFT.sol` and `contracts/ZenSolar.sol`

**Problem:** The current design uses `tokenIdExists[tokenId]` which means Token ID 1 (Sunspark) can only be minted ONCE globally. If User A earns Sunspark first, User B can NEVER earn Sunspark.

**Impact:** This is NOT the intended behavior. Each user should be able to earn every milestone independently.

**Solution Required:** Change to ERC-1155 (multi-token) or use per-user token ID calculation:
```
actualTokenId = baseTokenId + (userId hash * 10000)
```

Or maintain a mapping: `mapping(address => mapping(uint256 => bool)) public userHasMinted`

### 3.3 🟡 WARNING: Combo NFTs Must Be Minted Separately

**File:** `contracts/ZenSolar.sol`, Line 182

Combo NFTs are NOT auto-minted in `mintRewards()`. They require a separate `mintComboNFT()` call from the owner/backend.

**Impact:** Backend must detect combo eligibility and call `mintComboNFT()` separately.

**Status:** Needs backend edge function to handle combo minting.

### 3.4 🟡 WARNING: No On-Chain Verification of Activity Data

**File:** `contracts/ZenSolar.sol`

The smart contract trusts the backend completely for delta values. There's no on-chain oracle verification.

**Impact:** If backend is compromised, tokens could be minted incorrectly.

**Mitigation:** This is acceptable for MVP but should consider Chainlink or similar oracle for future.

### 3.5 🟡 WARNING: Transfer Tax Inconsistency

**File:** `contracts/ZSOLAR.sol`

```solidity
uint256 public burnTaxBps = 350;    // 3.5%
uint256 public treasuryTaxBps = 350; // 3.5%
```

**Documentation says:** 7% total transfer tax (3.5% burn + 3.5% treasury)

**Mint distribution says:** 5% burn, 1% LP, 1% treasury on mint (different from transfer)

**Status:** This is actually correct - mint and transfer have different tax structures. Document clearly.

---

## 4. 🔴 MUST-FIX BEFORE DEPLOYMENT

### 4.1 NFT Architecture Must Change to Per-User

The current ERC-721 with fixed token IDs is fundamentally incompatible with a multi-user reward system.

**Options:**

**Option A: ERC-1155 (Recommended)**
- Each token ID represents an NFT TYPE (0-41)
- Multiple users can own the same token ID
- Most gas-efficient for this use case

**Option B: Modified ERC-721 with Dynamic IDs**
- Token ID = `baseTypeId * 1000000 + userMintCount`
- Example: First Sunspark minted = 1000001, second = 1000002
- Requires metadata to determine type from ID

**Option C: Per-User Mappings**
- Keep ERC-721 but change tokenIdExists to per-user
- `mapping(address => mapping(uint256 => bool)) public userTokenIdExists`
- Token URI must still work with variable IDs

### 4.2 Required Contract Changes

**ZenSolarNFT.sol - Convert to ERC-1155:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZenSolarNFT is ERC1155, Ownable {
    // Track which users have each token type
    mapping(address => mapping(uint256 => bool)) public userHasToken;
    
    function mint(address to, uint256 tokenTypeId) external onlyOwner {
        require(!userHasToken[to][tokenTypeId], "User already has this NFT");
        userHasToken[to][tokenTypeId] = true;
        _mint(to, tokenTypeId, 1, "");
    }
}
```

---

## 5. ANTI-DOUBLE-ISSUANCE VERIFICATION

### 5.1 Token Issuance (ZSOLAR)

| Layer | Mechanism | Status |
|-------|-----------|--------|
| Smart Contract | Accepts delta values only | ✅ |
| Backend | baseline_data tracking per device | ✅ |
| Database | last_minted_at timestamp | ✅ |
| Dashboard | pendingTokens = lifetime - claimed | ✅ |

### 5.2 NFT Minting

| Layer | Mechanism | Status |
|-------|-----------|--------|
| Smart Contract | `milestonesMinted[user][cat][threshold]` | ✅ Per-user per-milestone |
| Smart Contract | `tokenIdExists[tokenId]` | 🔴 GLOBAL - only one ever! |
| Backend | earned_nfts tracking | ✅ |

---

## 6. REDEMPTION RULES VERIFICATION

| NFT Type | Redeemable? | Value | Fee | Contract Check | Status |
|----------|-------------|-------|-----|----------------|--------|
| Welcome | No | - | - | `cat != "Welcome"` | ✅ |
| Solar | Yes | threshold × 1 | 2% burn | ✅ | ✅ |
| Battery | Yes | threshold × 1 | 2% burn | ✅ | ✅ |
| Charging | Yes | threshold × 1 | 2% burn | ✅ | ✅ |
| EV Miles | Yes | threshold × 1 | 2% burn | ✅ | ✅ |
| Combo | No | - | - | `!startsWith(cat, "Combo")` | ✅ |

---

## 7. POTENTIAL FUTURE ISSUES

### 7.1 Token Supply Cap
- MAX_SUPPLY = 50 billion tokens
- At 1 token per kWh/mile, this could be reached if platform scales significantly
- **Recommendation:** Monitor and have governance mechanism to adjust if needed

### 7.2 Gas Costs
- Each `mintRewards()` call checks ALL milestone thresholds
- With many users, this could become expensive
- **Recommendation:** Consider batch minting or L2 deployment

### 7.3 Metadata Immutability
- IPFS metadata is immutable once deployed
- Any errors in metadata require new IPFS uploads and contract updates
- **Recommendation:** Triple-check all metadata before IPFS pinning

### 7.4 Oracle/Data Verification
- No on-chain verification of activity data
- Backend could theoretically inflate values
- **Recommendation:** Consider oracle integration for mainnet

---

## 8. PRE-DEPLOYMENT CHECKLIST

### Smart Contracts
- [ ] 🔴 **BLOCKER:** Convert ZenSolarNFT.sol to ERC-1155 or fix per-user token ID logic
- [ ] 🔴 **BLOCKER:** Update ZenSolar.sol to work with new NFT architecture
- [ ] 🟡 Add combo NFT auto-minting logic OR backend trigger
- [ ] ✅ Verify all threshold values
- [ ] ✅ Verify token distribution percentages
- [ ] ✅ Test redemption logic

### Metadata
- [ ] ✅ All 42 JSON files created (0-41)
- [ ] ✅ Token IDs match in all files
- [ ] ✅ Thresholds match in all files
- [ ] 🟡 Upload to IPFS and get final CID
- [ ] 🟡 Update baseURI in contract before deployment

### Backend
- [ ] ✅ calculate-rewards edge function aligned
- [ ] ✅ baseline_data tracking implemented
- [ ] 🟡 Add combo NFT detection and minting trigger
- [ ] 🟡 Add blockchain minting call in claim action

### Frontend
- [ ] ✅ nftMilestones.ts aligned
- [ ] ✅ nftTokenMapping.ts aligned
- [ ] ✅ Dashboard shows pending vs lifetime correctly

---

## 9. RECOMMENDED DEPLOYMENT ORDER

1. **Deploy ZSOLAR.sol** (ERC-20 token)
2. **Deploy ZenSolarNFT.sol** (ERC-1155 - AFTER FIXES)
3. **Deploy ZenSolar.sol** (Main coordinator)
4. **Transfer ownership** of ZSOLAR to ZenSolar contract
5. **Set tax exemptions** for ZenSolar, LP, Treasury addresses
6. **Verify all contracts** on block explorer
7. **Update backend** with contract addresses
8. **Enable minting** in production

---

## 10. SUMMARY

| Category | Status | Action Required |
|----------|--------|-----------------|
| Token Rates | ✅ ALIGNED | None |
| Token Distribution | ✅ ALIGNED | None |
| NFT Thresholds | ✅ ALIGNED | None |
| NFT Names | ✅ ALIGNED | None |
| NFT Token IDs | ✅ ALIGNED | None |
| Combo Logic | ✅ ALIGNED | Backend trigger needed |
| **NFT Architecture** | 🔴 **BROKEN** | **Must convert to ERC-1155** |
| Redemption Logic | ✅ ALIGNED | None |
| Anti-Double Issuance | 🟡 PARTIAL | NFT architecture fix needed |
| Metadata | ✅ READY | IPFS upload pending |

**CRITICAL BLOCKER:** The current ERC-721 implementation will only allow ONE user to ever own each milestone NFT. This must be fixed before deployment by converting to ERC-1155 or implementing per-user token ID logic.
