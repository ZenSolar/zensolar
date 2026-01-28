# Uniswap V3 Pool Deployment via BaseScan

## Overview

Step-by-step guide to create and seed a ZSOLAR/USDC liquidity pool on Base Sepolia using BaseScan's "Write Contract" interface.

---

## Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| **ZSOLAR Token** | `0xAb13cc345C8a3e88B876512A3fdD93cE334B20FE` |
| **Test USDC** | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **Uniswap V3 Factory** | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` |
| **NonfungiblePositionManager** | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` |
| **Minter Wallet** | `0x79ded21cF400F3ce354914D91fb209737d76b16D` |

---

## Pre-Calculated Values

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Fee Tier** | `10000` | 1% fee (for low-volume testnet) |
| **sqrtPriceX96** | `250541448375047931186413801569` | Sets $0.10 price (USDC/ZSOLAR) |
| **tickLower** | `-887200` | Full range lower bound |
| **tickUpper** | `887200` | Full range upper bound |

> **Token Order**: USDC (`0x036...`) < ZSOLAR (`0xAb1...`), so USDC is token0, ZSOLAR is token1.

---

## Step 1: Create the Pool

1. Go to **Uniswap V3 Factory** on BaseScan:
   ```
   https://sepolia.basescan.org/address/0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24#writeContract
   ```

2. Click **"Connect to Web3"** and connect your minter wallet

3. Find function **`createPool`** and enter:
   | Parameter | Value |
   |-----------|-------|
   | tokenA | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
   | tokenB | `0xAb13cc345C8a3e88B876512A3fdD93cE334B20FE` |
   | fee | `10000` |

4. Click **"Write"** → Confirm in MetaMask

5. **Save the pool address** from the transaction receipt (or read it via `getPool`)

---

## Step 2: Initialize the Pool Price

1. Go to the **newly created pool address** on BaseScan:
   ```
   https://sepolia.basescan.org/address/[POOL_ADDRESS]#writeContract
   ```

2. Find function **`initialize`** and enter:
   | Parameter | Value |
   |-----------|-------|
   | sqrtPriceX96 | `250541448375047931186413801569` |

3. Click **"Write"** → Confirm in MetaMask

> This sets the initial price to $0.10 USDC per ZSOLAR.

---

## Step 3: Approve USDC

1. Go to **Test USDC** on BaseScan:
   ```
   https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e#writeContract
   ```

2. Find function **`approve`** and enter:
   | Parameter | Value |
   |-----------|-------|
   | spender | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` |
   | amount | `1000000000` (1,000 USDC = 1000 × 10^6) |

   > **Adjust amount based on your USDC balance!**
   > - 100 USDC = `100000000`
   > - 10 USDC = `10000000`

3. Click **"Write"** → Confirm in MetaMask

---

## Step 4: Approve ZSOLAR

1. Go to **ZSOLAR Token** on BaseScan:
   ```
   https://sepolia.basescan.org/address/0xAb13cc345C8a3e88B876512A3fdD93cE334B20FE#writeContract
   ```

2. Find function **`approve`** and enter:
   | Parameter | Value |
   |-----------|-------|
   | spender | `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2` |
   | amount | `10000000000000000000000` (10,000 ZSOLAR = 10000 × 10^18) |

   > **Adjust amount based on your ZSOLAR balance!**
   > - 1,000 ZSOLAR = `1000000000000000000000`
   > - 100 ZSOLAR = `100000000000000000000`

3. Click **"Write"** → Confirm in MetaMask

---

## Step 5: Mint Liquidity Position

1. Go to **NonfungiblePositionManager** on BaseScan:
   ```
   https://sepolia.basescan.org/address/0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2#writeContract
   ```

2. Find function **`mint`** and enter the **MintParams** tuple:

   ```
   For 1,000 USDC + 10,000 ZSOLAR:
   ```

   | Parameter | Value |
   |-----------|-------|
   | token0 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
   | token1 | `0xAb13cc345C8a3e88B876512A3fdD93cE334B20FE` |
   | fee | `10000` |
   | tickLower | `-887200` |
   | tickUpper | `887200` |
   | amount0Desired | `1000000000` (1,000 USDC) |
   | amount1Desired | `10000000000000000000000` (10,000 ZSOLAR) |
   | amount0Min | `0` |
   | amount1Min | `0` |
   | recipient | `0x79ded21cF400F3ce354914D91fb209737d76b16D` |
   | deadline | `1800000000` (far future timestamp) |

   > **For smaller amounts** (100 USDC + 1,000 ZSOLAR):
   > - amount0Desired: `100000000`
   > - amount1Desired: `1000000000000000000000`

3. Click **"Write"** → Confirm in MetaMask

---

## Step 6: Verify Success

1. Check your wallet on BaseScan for the NFT position
2. Go to the pool address and verify reserves in **Read Contract** → `slot0` shows current price

---

## Scaling Reference

| USDC Amount | ZSOLAR Amount | Use Case |
|-------------|---------------|----------|
| 10 | 100 | Minimal test |
| 100 | 1,000 | Basic testing |
| 1,000 | 10,000 | Original doc spec |
| 5,000 | 50,000 | Live Beta spec |

All amounts maintain the $0.10 price ratio. Start small!

---

## Troubleshooting

### "Pool already exists" error
- The pool is already created. Skip to Step 2.

### "Already initialized" error  
- Pool price is already set. Skip to Step 3.

### "Insufficient allowance" error
- Re-run the approve steps with higher amounts.

### "Price slippage check" error
- Set `amount0Min` and `amount1Min` to `0` for testing.

---

## After Deployment

1. Record the pool address in project docs
2. Test a small swap on BaseScan using the pool's `swap` function
3. Enable Live Beta mode in ZenSolar admin panel
