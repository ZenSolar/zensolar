# ZenSolar Smart Contract Deployment Guide

## Overview

This guide covers the complete deployment process for ZenSolar smart contracts on Base Sepolia testnet.

---

## IPFS CIDs (FINAL)

| Asset | CID | Gateway URL |
|-------|-----|-------------|
| **NFT Images** | `bafybeibfu2jiex3g5aglwd2xfj4wq6umr77zoqnre55hpcpghp6mstm5iy` | `ipfs://bafybeibfu2jiex3g5aglwd2xfj4wq6umr77zoqnre55hpcpghp6mstm5iy/` |
| **Metadata (Flat)** | `bafybeigickzokhzp2kifomf7bcagg6qkzxdpy6q3nzscsctxorljbrtq2e` | `ipfs://bafybeigickzokhzp2kifomf7bcagg6qkzxdpy6q3nzscsctxorljbrtq2e/` |

**ZenSolarNFT baseURI**: `ipfs://bafybeigickzokhzp2kifomf7bcagg6qkzxdpy6q3nzscsctxorljbrtq2e/`

---

## Pre-Deployment Checklist

### ✅ Wallet Addresses Configured

| Wallet | Address | Purpose |
|--------|---------|---------|
| **Minter** | `0x70918Aa38d19BbBE0BD3e00C008442978c0e5cB1` | Signs minting transactions |
| **Treasury** | `0xdF21d920A160119b350A7dDfa657abc77bB5cb40` | Receives 1% mints + 3.5% transfers |
| **LP Rewards** | `0xBFDea915dC5C7bFa87b488E09F29B9D353970a64` | Receives 1% for LP incentives |
| **Founder** | `0xFA7E5575f5C988221fBBe4f8186cC6EE20143308` | Initial 2.5% allocation |
| **Co-Founder 1** | TBD | Reserved |
| **Co-Founder 2** | TBD | Reserved |
| **Co-Founder 3** | TBD | Reserved |

### ✅ Smart Contracts Ready

| Contract | File | Status |
|----------|------|--------|
| ZSOLAR (ERC-20) | `contracts/ZSOLAR.sol` | ✅ Ready |
| ZenSolarNFT (ERC-1155) | `contracts/ZenSolarNFT.sol` | ✅ Ready |
| ZenSolar Controller | `contracts/ZenSolar.sol` | ✅ Ready |

### ✅ DEPLOYED CONTRACT ADDRESSES (Base Sepolia Testnet)

| Contract | Address | Status |
|----------|---------|--------|
| **ZSOLAR Token** | `0x4e704f5223FbfB588E9171981F40DB480B61106D` | ✅ Deployed & Verified |
| **ZenSolarNFT** | `0x0D2E9f87c95cB95f37854DBe692e5BC1920e4B79` | ✅ Deployed & Verified |
| **ZenSolar Controller** | `0xADd3a1E135356806A382dd5008611b5E52AA867F` | ✅ Deployed & Verified |

**Deployed**: 2026-01-15  
**Network**: Base Sepolia (Chain ID: 84532)  
**Block Explorer**: https://sepolia.basescan.org

### ✅ NFT Metadata Files (Flat Structure)

42 JSON files uploaded to IPFS in flat format (`0.json` through `41.json`):

| Token ID | Name | Category |
|----------|------|----------|
| 0 | Welcome | Welcome |
| 1-8 | Sunspark → Starforge | Solar |
| 9-15 | Voltbank → Gigavolt | Battery |
| 16-23 | Ignite → Teracharge | Charging |
| 24-33 | Ignitor → Odyssey | EV Miles |
| 34-41 | Duality → Total Eclipse | Combo |

---

## Step 1: Fund the Minter Wallet

1. Go to [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet) or [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)
2. Enter minter address: `0x70918Aa38d19BbBE0BD3e00C008442978c0e5cB1`
3. Request testnet ETH (need ~0.1 ETH for deployments)

---

## Step 2: Deploy Contracts in Remix

### Using Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create files for each contract
3. Install OpenZeppelin: `@openzeppelin/contracts`
4. Compile each contract (Solidity 0.8.20)

### Deployment Order (CRITICAL!)

#### 2.1 Deploy ZSOLAR Token First

**No constructor arguments required!**

```solidity
// ZSOLAR has no constructor parameters - just deploy it
```

**Save the deployed address!** → `[ZSOLAR_ADDRESS]`

#### 2.2 Deploy ZenSolarNFT Second

```solidity
// Constructor argument:
baseTokenURI_: "ipfs://bafybeigickzokhzp2kifomf7bcagg6qkzxdpy6q3nzscsctxorljbrtq2e/"
```

⚠️ **IMPORTANT**: Include the trailing `/` in the baseURI!

**Save the deployed address!** → `[NFT_ADDRESS]`

#### 2.3 Deploy ZenSolar Controller Third

```solidity
// Constructor arguments:
_token: [ZSOLAR_ADDRESS from step 2.1]
_nft: [NFT_ADDRESS from step 2.2]
```

**Save the deployed address!** → `[CONTROLLER_ADDRESS]`

---

## Step 3: Set Minter Permissions (CRITICAL!)

After deploying all contracts, the ZenSolar Controller needs permission to mint tokens and NFTs.

### 3.1 On ZSOLAR Contract

Call `setMinter` function:
```solidity
setMinter([CONTROLLER_ADDRESS])
```

### 3.2 On ZenSolarNFT Contract

Call `transferOwnership` function:
```solidity
transferOwnership([CONTROLLER_ADDRESS])
```

---

## Step 4: Verify Contracts on BaseScan

1. Go to [BaseScan Sepolia](https://sepolia.basescan.org)
2. Find each contract by address
3. Click "Verify and Publish"
4. Select:
   - Compiler: 0.8.20
   - License: MIT
   - Optimization: Yes (200 runs)
5. Paste source code and constructor arguments

---

## Step 5: Update Application Configuration

After deployment, share the addresses here and I'll update the app:

```
ZSOLAR Address: 0x...
ZenSolarNFT Address: 0x...
ZenSolar Controller Address: 0x...
```

---

## Step 6: Test Minting

### 6.1 Register a Test User

Call on ZenSolar Controller:
```solidity
registerUser(testUserAddress)
```

This mints:
- Welcome NFT (Token ID 0) → deposited to user's wallet
- User can view at: `ipfs://bafybeigickzokhzp2kifomf7bcagg6qkzxdpy6q3nzscsctxorljbrtq2e/0.json`

### 6.2 Mint Test Rewards

Call on ZenSolar Controller:
```solidity
mintRewards(
  testUserAddress,
  1000,  // solarDeltaKwh (triggers Sunspark NFT at 500)
  0,     // evMilesDelta
  0,     // batteryDeltaKwh
  0      // chargingDeltaKwh
)
```

This mints:
- ZSOLAR tokens → deposited to user's wallet
- Sunspark NFT (Token ID 1) → deposited to user's wallet

### 6.3 Verify Results

- Check ZSOLAR balance on BaseScan
- Check NFT ownership: `ownerOf(0)` and `ownerOf(1)` should return user address
- View NFT metadata: `tokenURI(1)` returns `ipfs://bafybeigickzokhzp2kifomf7bcagg6qkzxdpy6q3nzscsctxorljbrtq2e/1.json`

---

## Token ID Quick Reference

| Token ID | NFT Name | Trigger |
|----------|----------|---------|
| 0 | Welcome | `registerUser()` |
| 1 | Sunspark | 500 kWh solar |
| 2 | Photonic | 1,000 kWh solar |
| 9 | Voltbank | 500 kWh battery |
| 16 | Ignite | 100 kWh charging |
| 24 | Ignitor | 100 EV miles |
| 34 | Duality | NFTs in 2 categories |

See `docs/NFT_FLAT_TOKEN_MAPPING.md` for complete reference.

---

## Network Configuration

### Base Sepolia Testnet

| Parameter | Value |
|-----------|-------|
| Network Name | Base Sepolia |
| RPC URL | `https://sepolia.base.org` |
| Chain ID | 84532 |
| Currency | ETH |
| Block Explorer | https://sepolia.basescan.org |

### Add to MetaMask

1. Open MetaMask → Settings → Networks → Add Network
2. Enter the values above
3. Save

---

## Post-Deployment Checklist

- [ ] ZSOLAR deployed
- [ ] ZenSolarNFT deployed with correct baseURI
- [ ] ZenSolar Controller deployed
- [ ] `setMinter()` called on ZSOLAR
- [ ] `transferOwnership()` called on ZenSolarNFT
- [ ] All contracts verified on BaseScan
- [ ] Test registration successful (Welcome NFT minted)
- [ ] Test rewards successful (tokens + NFT minted)
- [ ] App configuration updated with contract addresses

---

## How Tokens & NFTs Flow to Users

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTIVITY                             │
│         (Solar production, EV miles, charging, etc.)        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Edge Function)                         │
│   1. Fetches energy data from Tesla/Enphase/etc.            │
│   2. Calculates deltas since last mint                       │
│   3. Calls ZenSolar.mintRewards()                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            ZENSOLAR CONTROLLER CONTRACT                      │
│   1. Mints ZSOLAR tokens to user wallet (97% to user)       │
│   2. Checks milestone thresholds                             │
│   3. Mints NFTs for reached milestones to user wallet       │
│   4. Distributes: 1% LP, 1% Treasury, 1% Burn               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  USER'S WALLET                               │
│   ✅ ZSOLAR tokens deposited directly                        │
│   ✅ NFTs deposited directly (visible in wallet/OpenSea)    │
│   ✅ User can redeem NFTs for additional ZSOLAR             │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "Exceeds max supply" error
- Check total supply hasn't exceeded 50B tokens

### "Not owner" error
- Ensure `setMinter()` was called on ZSOLAR
- Ensure `transferOwnership()` was called on ZenSolarNFT

### NFT images not showing
- Verify IPFS gateway is working: `https://gateway.pinata.cloud/ipfs/bafybeibfu2jiex3g5aglwd2xfj4wq6umr77zoqnre55hpcpghp6mstm5iy/welcome.png`
- Try alternative: `https://ipfs.io/ipfs/...`

### Transaction failing
- Ensure minter wallet has enough ETH
- Check gas limit (use 300,000 for complex operations)

---

## Mainnet Migration Notes

When ready for Base Mainnet:

1. **Change network**: Use Base Mainnet RPC (`https://mainnet.base.org`, Chain ID 8453)
2. **Fund with real ETH**: Bridge ETH from Ethereum mainnet
3. **Deploy fresh**: Do NOT use testnet contracts
4. **Audit recommended**: Consider professional audit before mainnet
5. **Update all configs**: Contract addresses, network settings
6. **Test thoroughly**: On testnet replica first
