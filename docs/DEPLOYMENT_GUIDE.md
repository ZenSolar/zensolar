# ZenSolar Smart Contract Deployment Guide

## Overview

This guide covers the complete deployment process for ZenSolar smart contracts on Base Sepolia testnet.

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
| ZenSolarNFT (ERC-721) | `contracts/ZenSolarNFT.sol` | ✅ Ready |
| ZenSolar Controller | `contracts/ZenSolar.sol` | ✅ Ready |

### ✅ NFT Metadata Files

42 JSON files created in `public/nft-metadata/`:
- 1 Welcome NFT
- 8 Solar milestones
- 7 Battery milestones  
- 8 Charging milestones
- 10 EV Miles milestones
- 8 Combo milestones

---

## Step 1: Fund the Minter Wallet

1. Go to [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet) or [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)
2. Enter minter address: `0x70918Aa38d19BbBE0BD3e00C008442978c0e5cB1`
3. Request testnet ETH (need ~0.1 ETH for deployments)

---

## Step 2: Upload NFT Assets to IPFS

### Option A: Using Pinata (Recommended)

1. Go to [Pinata.cloud](https://pinata.cloud) and create account
2. Click "Upload" → "Folder"
3. Upload the NFT images from `src/assets/nft/` with this structure:

```
zensolar-nft/
├── welcome.png
├── solar/
│   ├── sunspark.png
│   ├── photonic.png
│   ├── rayforge.png
│   ├── solaris.png
│   ├── helios.png
│   ├── sunforge.png
│   ├── gigasun.png
│   └── starforge.png
├── battery/
│   ├── voltbank.png
│   ├── gridpulse.png
│   ├── megacell.png
│   ├── reservex.png
│   ├── dynamax.png
│   ├── ultracell.png
│   └── gigavolt.png
├── charging/
│   ├── ignite.png
│   ├── voltcharge.png
│   ├── kilovolt.png
│   ├── ampforge.png
│   ├── chargeon.png
│   ├── gigacharge.png
│   ├── megacharge.png
│   └── teracharge.png
├── ev/
│   ├── ignitor.png
│   ├── velocity.png
│   ├── autobahn.png
│   ├── hyperdrive.png
│   ├── electra.png
│   ├── velocity-pro.png
│   ├── mach-one.png
│   ├── centaurion.png
│   ├── voyager.png
│   └── odyssey.png
└── combo/
    ├── duality.png
    ├── trifecta.png
    ├── quadrant.png
    ├── constellation.png
    ├── cyber-echo.png
    ├── zenith.png
    ├── zenmaster.png
    └── total-eclipse.png
```

4. Copy the CID (e.g., `QmXXXXXXX...`)
5. Your image base URL: `ipfs://QmXXXXXXX/`

### Step 2b: Update Metadata Files

1. Open each JSON file in `public/nft-metadata/`
2. Replace `REPLACE_WITH_CID` with your actual IPFS CID
3. Upload the metadata folder to Pinata
4. Copy the new CID - this is your `baseURI`

---

## Step 3: Deploy Contracts

### Using Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create files for each contract
3. Install OpenZeppelin: `@openzeppelin/contracts`
4. Compile each contract (Solidity 0.8.20)

### Deployment Order (CRITICAL!)

#### 3.1 Deploy ZSOLAR Token First

```solidity
// Constructor arguments:
_founder: 0xFA7E5575f5C988221fBBe4f8186cC6EE20143308
_initialOwner: 0x70918Aa38d19BbBE0BD3e00C008442978c0e5cB1  
_treasury: 0xdF21d920A160119b350A7dDfa657abc77bB5cb40
```

**Save the deployed address!**

#### 3.2 Deploy ZenSolarNFT Second

```solidity
// Constructor argument:
_baseURI: "ipfs://YOUR_METADATA_CID/"
```

**Save the deployed address!**

#### 3.3 Deploy ZenSolar Controller Third

```solidity
// Constructor arguments:
_zSolarToken: [ZSOLAR address from step 3.1]
_zenSolarNFT: [ZenSolarNFT address from step 3.2]
_treasury: 0xdF21d920A160119b350A7dDfa657abc77bB5cb40
_lpRewards: 0xBFDea915dC5C7bFa87b488E09F29B9D353970a64
```

**Save the deployed address!**

---

## Step 4: Transfer Ownership

After all contracts are deployed:

### 4.1 Transfer ZSOLAR ownership to ZenSolar Controller

Call on ZSOLAR contract:
```solidity
transferOwnership([ZenSolar Controller address])
```

### 4.2 Transfer ZenSolarNFT ownership to ZenSolar Controller

Call on ZenSolarNFT contract:
```solidity
transferOwnership([ZenSolar Controller address])
```

---

## Step 5: Verify Contracts on BaseScan

1. Go to [BaseScan Sepolia](https://sepolia.basescan.org)
2. Find each contract by address
3. Click "Verify and Publish"
4. Select:
   - Compiler: 0.8.20
   - License: MIT
   - Optimization: Yes (200 runs)
5. Paste source code and constructor arguments

---

## Step 6: Update Application Configuration

Update `src/pages/AdminContracts.tsx` with deployed addresses:

```typescript
const CONTRACTS = {
  ZSOLAR: {
    address: '0x...', // Your deployed ZSOLAR address
  },
  ZenSolarNFT: {
    address: '0x...', // Your deployed ZenSolarNFT address
  },
  ZenSolar: {
    address: '0x...', // Your deployed ZenSolar Controller address
  },
};
```

---

## Step 7: Test Minting

### 7.1 Register a Test User

Call on ZenSolar Controller:
```solidity
registerUser(testUserAddress)
```

This mints the Welcome NFT.

### 7.2 Mint Test Rewards

Call on ZenSolar Controller:
```solidity
mintRewards(
  testUserAddress,
  1000,  // solarDeltaKwh (should trigger Sunspark NFT at 500)
  0,     // evMilesDelta
  0,     // batteryDeltaKwh
  0      // chargingDeltaKwh
)
```

### 7.3 Verify on BaseScan

- Check ZSOLAR balance of test user
- Check NFT ownership on ZenSolarNFT contract

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

- [ ] All 3 contracts deployed
- [ ] ZSOLAR ownership transferred to ZenSolar Controller
- [ ] ZenSolarNFT ownership transferred to ZenSolar Controller
- [ ] Contracts verified on BaseScan
- [ ] Test mint successful
- [ ] App configuration updated with contract addresses
- [ ] NFT metadata accessible via IPFS gateway

---

## Troubleshooting

### "Exceeds max supply" error
- Check total supply hasn't exceeded 50B tokens

### "Not owner" error
- Ensure ZenSolar Controller owns the token contracts
- Only owner can call mint functions

### NFT images not showing
- Verify IPFS CID is correct
- Try alternative gateway: `https://gateway.pinata.cloud/ipfs/YOUR_CID/`

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
