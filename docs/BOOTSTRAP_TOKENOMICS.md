# Bootstrap Tokenomics Model

## Executive Summary

This document outlines a self-funded tokenomics strategy for ZenSolar that enables organic growth without external capital. The model starts with 10 paying users and doubles periodically, using subscription revenue to build liquidity depth and maintain price stability.

---

## Initial Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Initial LP Seed** | $2,000 USDC + 20,000 $ZSOLAR | Founder-funded |
| **Launch Price** | $0.10 per token | AMM spot price |
| **Subscription Fee** | $9.99/month | Required for minting |
| **LP Revenue Share** | 50% of subscriptions | ~$5/user/month |
| **Mint Rate** | 800 tokens/user/month (gross) | Based on average energy production |
| **Mint Burn Rate** | 20% | 160 tokens burned per user/month |
| **Net Distribution** | 75% to user | 600 tokens/user/month |
| **Transfer Tax** | 7% total | 3% burn, 2% LP, 2% treasury |

---

## Growth Model: Controlled Doubling

The bootstrap model assumes slow, controlled growth to validate tokenomics before scaling.

| Phase | Month | Users | Monthly Tokens Minted (Gross) | Monthly Burn | Net to Users |
|-------|-------|-------|-------------------------------|--------------|--------------|
| Seed | 1-2 | 10 | 8,000 | 1,600 | 6,000 |
| Early | 3-4 | 20 | 16,000 | 3,200 | 12,000 |
| Growth | 5-6 | 40 | 32,000 | 6,400 | 24,000 |
| Scale | 7-8 | 80 | 64,000 | 12,800 | 48,000 |
| Traction | 9-12 | 160 | 128,000 | 25,600 | 96,000 |

**12-Month Totals:**
- Gross Minted: ~744,000 tokens
- Total Burned: ~148,800 tokens (20%)
- Net to Users: ~558,000 tokens

---

## Revenue & Liquidity Projections

### Subscription Revenue to LP (50% of $9.99)

| Month | Users | Monthly LP Injection | Cumulative LP (USDC) |
|-------|-------|---------------------|---------------------|
| 1 | 10 | $50 | $2,050 |
| 2 | 10 | $50 | $2,100 |
| 3 | 20 | $100 | $2,200 |
| 4 | 20 | $100 | $2,300 |
| 5 | 40 | $200 | $2,500 |
| 6 | 40 | $200 | $2,700 |
| 7 | 80 | $400 | $3,100 |
| 8 | 80 | $400 | $3,500 |
| 9 | 160 | $800 | $4,300 |
| 10 | 160 | $800 | $5,100 |
| 11 | 160 | $800 | $5,900 |
| 12 | 160 | $800 | $6,700 |

**12-Month LP Growth: $2,000 → $6,700 (+235%)**

---

## Price Trajectory Scenarios

### Scenario A: 100% HODL (Ideal)

If all users hold tokens for 12 months, subscription revenue acts as pure buying pressure:

Using AMM constant product formula (k = x × y):
- Initial: k = 2,000 × 20,000 = 40,000,000
- After $4,700 in buybacks: 
  - USDC reserve: 6,700
  - Token reserve: 40,000,000 ÷ 6,700 ≈ 5,970
  - **Price: $6,700 ÷ 5,970 ≈ $1.12**

**Result: 11.2x price increase from $0.10 to $1.12**

### Scenario B: Moderate Sell Pressure (25% from Month 9)

This is the realistic "Moderate" scenario:

| Period | Sell Rate | Monthly Sell Volume | Net LP Impact |
|--------|-----------|---------------------|---------------|
| Month 1-8 | 0% | 0 tokens | +$1,500 (buybacks only) |
| Month 9 | 25% | 24,000 tokens | Sell pressure begins |
| Month 10-12 | 25% | 24,000 tokens/month | Offset by subscriptions |

**Key Insight:** At 160 users × $5/month = $800 monthly LP injection vs. 24,000 tokens sold.

If tokens are sold at ~$0.50 average price, that's $12,000 in sell pressure vs. $800 in buys.

**This is where the flywheel can break** without sufficient user growth or LP depth.

### Scenario C: Conservative (10% sell from Month 6)

| Period | Sell Rate | Impact |
|--------|-----------|--------|
| Month 1-5 | 0% | Price rises to ~$0.35 |
| Month 6-12 | 10% | Gradual price stabilization around $0.25-0.30 |

---

## Sustainability Thresholds

### LP Coverage Ratio

The **LP Coverage Ratio** measures if subscription revenue can offset sell pressure:

```
LP Coverage = (Monthly LP Injection × Token Price) / (Tokens Sold × Token Price)
LP Coverage = Monthly LP Injection / (Tokens Sold × Token Price)
```

**Healthy threshold: > 1.0** (more buying than selling)

Example at Month 9 (Moderate scenario):
- LP Injection: $800
- Tokens Sold: 24,000 @ $0.50 = $12,000
- Coverage Ratio: 800 / 12,000 = **0.067 (unhealthy)**

**Solution:** Either reduce sell rate expectations OR scale users faster.

### Break-Even User Count

To maintain $0.10 floor with 25% sell rate:

```
Required Users = (Sell Volume × Price) / $5
Required Users = (0.25 × 600 tokens × $0.10) / $5
Required Users = $15 / $5 = 3 users per existing seller
```

For 160 users selling 25%, you need 3× growth to maintain floor → 480 users.

---

## Risk Mitigation Strategies

### 1. Vesting Schedule
Implement 6-month linear vesting for minted tokens to prevent immediate sell pressure.

### 2. HODL Incentives
- Staking rewards (bonus tokens for 6+ month holds)
- Tiered NFT access based on token balance
- Governance voting power

### 3. Dynamic Burn Rate
Increase burn rate if sell pressure exceeds thresholds:
- Normal: 20%
- Elevated: 25%
- Critical: 30%

### 4. Treasury Buybacks
Reserve 20% of treasury funds for market stabilization buybacks during high-sell periods.

---

## 12-Month Summary (Moderate Scenario)

| Metric | Start | Month 6 | Month 12 |
|--------|-------|---------|----------|
| Users | 10 | 40 | 160 |
| LP (USDC) | $2,000 | $2,700 | $5,500* |
| Token Price | $0.10 | $0.35 | $0.25-0.40* |
| Total Minted | 0 | 168,000 | 558,000 |
| Total Burned | 0 | 33,600 | 148,800 |
| Circulating Supply | 20,000 | ~154,000 | ~429,000 |

*Adjusted for 25% sell pressure from Month 9

---

## Comparison to Funded Model

| Metric | Bootstrap ($2K LP) | Seed Round ($300K LP) |
|--------|-------------------|----------------------|
| Initial Floor | $0.10 | $0.10 |
| LP Depth | Shallow | Deep |
| Sell Tolerance | Low (10-15%) | High (30-40%) |
| Break-even Timeline | 18+ months | 6 months |
| Risk Level | High | Moderate |
| Investor Dilution | 0% | 15-20% |

---

## Conclusion

The Bootstrap Model is viable if:
1. ✅ Early users commit to 6-12 month HODL periods
2. ✅ Growth doubles every 2-3 months organically
3. ✅ Sell pressure stays under 15% until 500+ users
4. ✅ Vesting schedules delay token liquidity

**Recommendation:** Use Bootstrap for initial validation (10-100 users), then seek seed funding for scale if metrics prove sustainable.

---

*Last Updated: January 2026*
*Model Version: Bootstrap v1.0 (Moderate)*
