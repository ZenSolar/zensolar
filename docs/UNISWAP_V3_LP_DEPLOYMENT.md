# Uniswap V3 Pool Deployment Guide - Base Sepolia

## Overview

This guide walks you through creating a Uniswap V3 liquidity pool on Base Sepolia testnet pairing $ZSOLAR with test USDC.

---

## Pre-Deployment Requirements

### ✅ Contract Addresses (Already Deployed)

| Contract | Address | Status |
|----------|---------|--------|
| **ZSOLAR Token** | `0x4e704f5223FbfB588E9171981F40DB480B61106D` | ✅ Deployed |
| **Test USDC (Base Sepolia)** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | ✅ Official Testnet |
| **Uniswap V3 Factory** | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` | ✅ Base Sepolia |
| **Uniswap V3 Router** | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` | ✅ Base Sepolia |
| **NonfungiblePositionManager** | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` | ✅ Base Sepolia |

### ✅ Wallet Requirements

- **Minter Wallet**: `0x79ded21cF400F3ce354914D91fb209737d76b16D`
- **Testnet ETH**: ~0.1 ETH for gas (from Base Sepolia faucet)
- **Test USDC**: 1,000 USDC from faucet
- **ZSOLAR Tokens**: 10,000 tokens (already minted)

---

## Step 1: Get Testnet Assets

### 1.1 Get Base Sepolia ETH

1. Go to [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Enter: `0x79ded21cF400F3ce354914D91fb209737d76b16D`
3. Request 0.1 ETH

### 1.2 Get Test USDC

**Option A - Circle Faucet:**
1. Go to [Circle USDC Testnet Faucet](https://faucet.circle.com/)
2. Select "Base Sepolia"
3. Enter wallet address
4. Request 1,000 USDC

**Option B - If faucet is unavailable:**
1. The test USDC contract allows anyone to mint for testing
2. Call `mint(address to, uint256 amount)` on the USDC contract
3. Address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### 1.3 Ensure ZSOLAR Balance

Verify 10,000+ ZSOLAR in minter wallet:
1. Go to [BaseScan Sepolia](https://sepolia.basescan.org)
2. Search: `0x4e704f5223FbfB588E9171981F40DB480B61106D`
3. Check "Holders" tab for minter wallet balance

---

## Step 2: Create Uniswap V3 Pool

### 2.1 Open Uniswap Interface

1. Go to [Uniswap App](https://app.uniswap.org)
2. Connect wallet (MetaMask/Base Wallet)
3. **CRITICAL**: Switch to "Base Sepolia" network
4. Click "Pool" tab → "New Position"

### 2.2 Select Token Pair

1. **Token A**: USDC
   - Click "Select token"
   - Paste: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Confirm "USDC" appears

2. **Token B**: ZSOLAR
   - Click "Select token"  
   - Paste: `0x4e704f5223FbfB588E9171981F40DB480B61106D`
   - Confirm "ZSOLAR" appears
   - (May show as unknown token - that's OK)

### 2.3 Configure Pool Parameters

| Parameter | Value | Explanation |
|-----------|-------|-------------|
| **Fee Tier** | 1% (10000) | Higher fee for low-volume testnet |
| **Starting Price** | 0.10 USDC per ZSOLAR | Matches $0.10 launch floor |
| **Price Range** | Full Range | For initial testing |
| **USDC Amount** | 1,000 | Initial liquidity |
| **ZSOLAR Amount** | 10,000 | Matches 0.10 price ratio |

### 2.4 Approve Tokens

1. Click "Approve USDC" → Confirm in wallet
2. Wait for transaction confirmation
3. Click "Approve ZSOLAR" → Confirm in wallet
4. Wait for transaction confirmation

### 2.5 Create Pool & Add Liquidity

1. Click "Preview" to review position
2. Verify:
   - Price: ~0.10 USDC/ZSOLAR
   - Liquidity depth looks correct
3. Click "Add" → Confirm in wallet
4. Wait for transaction confirmation

---

## Step 3: Verify Pool Creation

### 3.1 Get Pool Address

After creation, Uniswap shows the pool address. Save it!

**Expected Pool Details:**
- Token0: USDC (lower address)
- Token1: ZSOLAR (higher address)
- Fee: 1% (10000)
- Initial liquidity: ~$2,000 total value

### 3.2 Verify on BaseScan

1. Go to [BaseScan Sepolia](https://sepolia.basescan.org)
2. Search the pool address
3. Confirm:
   - Contract is verified as UniswapV3Pool
   - Token balances show USDC + ZSOLAR

### 3.3 Test a Swap

1. Return to Uniswap "Swap" tab
2. Select USDC → ZSOLAR
3. Enter 10 USDC
4. Verify output is ~100 ZSOLAR (at 0.10 price)
5. Execute swap to confirm pool works

---

## Step 4: Record Pool Information

After successful creation, update the app configuration:

```
Pool Address: 0x... (save from Uniswap)
Token0: USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
Token1: ZSOLAR (0x4e704f5223FbfB588E9171981F40DB480B61106D)
Fee: 10000 (1%)
Initial Price: 0.10 USDC/ZSOLAR
```

---

## Live Beta Configuration Summary

| Parameter | Live Beta Value | Mainnet Target |
|-----------|-----------------|----------------|
| LP Seed (USDC) | $1,000 | $300,000 |
| LP Seed (ZSOLAR) | 10,000 | 3,000,000 |
| Starting Price | $0.10 | $0.10 |
| Reward Multiplier | 10x | 1x |
| Scale Factor | 1:100 | 1:1 |

---

## Troubleshooting

### "Insufficient liquidity" error
- Pool hasn't been created yet, or tokens aren't approved

### "Pool does not exist" error
- Fee tier mismatch - ensure 1% (10000) is selected
- Token order might be swapped - try reversing

### Transaction failing
- Increase gas limit to 500,000
- Ensure sufficient ETH for gas
- Check token approvals

### ZSOLAR showing as "Unknown Token"
- This is expected for new tokens
- Proceed anyway - token will work correctly

---

## Post-Deployment Checklist

- [ ] Pool created on Base Sepolia
- [ ] Pool address recorded
- [ ] Test swap successful
- [ ] Live Beta toggle enabled in app
- [ ] On-chain metrics showing in dashboard

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     LIVE BETA FLOW                           │
└─────────────────────────────────────────────────────────────┘

User Activity (Solar/EV/Battery)
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│           Edge Function: calculate-rewards                   │
│   Applies 10x multiplier → Mints ZSOLAR to user              │
│   Distribution: 75% user, 20% burn, 3% LP, 2% treasury       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               Uniswap V3 Pool (Base Sepolia)                 │
│                                                              │
│   ┌─────────────┐     ┌─────────────┐                       │
│   │  1K USDC    │ ←→  │ 10K ZSOLAR  │   Price: $0.10       │
│   └─────────────┘     └─────────────┘                       │
│                                                              │
│   • 3% of mints flow here (LP share)                        │
│   • Simulated $49.95/mo from subscriptions                  │
│   • Price rises as LP depth grows                           │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Dashboard: Live Beta Economics            │
│                                                              │
│   📊 Real-time metrics from mint_transactions               │
│   📈 Price trajectory visualization                         │
│   🔥 Burn rate tracking                                     │
│   💰 LP depth monitoring                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps After Pool Creation

1. **Enable Live Beta Mode**: Toggle switch in Admin → Live Beta Economics
2. **Test Minting**: Mint rewards for a test user and verify LP receives 3%
3. **Monitor Dashboard**: Watch real-time metrics update
4. **Invite Beta Users**: Share with Han and other testers
