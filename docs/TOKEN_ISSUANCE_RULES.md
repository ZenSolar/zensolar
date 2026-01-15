# ZenSolar Token Issuance Rules

## Core Principle: One Token Per Unit, Forever

**Each unit of sustainable activity can ONLY generate tokens ONCE.**

- 1 kWh of solar energy = 1 $ZSOLAR token (issued once)
- 1 kWh of battery discharge = 1 $ZSOLAR token (issued once)
- 1 kWh of EV charging = 1 $ZSOLAR token (issued once)
- 1 mile of EV driving = 1 $ZSOLAR token (issued once)

This ensures the integrity and accuracy of tokenized sustainable behaviors.

---

## System Architecture

### 1. Smart Contract Level (`ZenSolar.sol`)

The `mintRewards()` function accepts **DELTA values only**:

```solidity
function mintRewards(
    address user,
    uint256 solarDeltaKwh,      // NEW kWh since last mint
    uint256 evMilesDelta,        // NEW miles since last mint
    uint256 batteryDeltaKwh,     // NEW kWh since last mint
    uint256 chargingDeltaKwh     // NEW kWh since last mint
) external onlyOwner
```

**Important:**
- Parameters MUST be delta values, NOT lifetime totals
- The contract trusts the backend to calculate deltas correctly
- On-chain cumulative tracking is ONLY for NFT milestone checks

### 2. Backend Level (Edge Functions)

The backend is responsible for:

#### A. Baseline Tracking (`connected_devices.baseline_data`)
```json
{
  "captured_at": "2026-01-15T10:00:00Z",
  "total_solar_produced_wh": 12847000,
  "total_energy_discharged_wh": 3218000,
  "odometer": 24532
}
```

#### B. Delta Calculation
```
pending_solar = current_lifetime_solar - baseline_solar
pending_miles = current_odometer - baseline_odometer
pending_battery = current_lifetime_battery - baseline_battery
pending_charging = current_lifetime_charging - baseline_charging
```

#### C. Baseline Reset (After Mint)
When a user successfully mints:
1. Fetch current lifetime values from device APIs
2. Update `baseline_data` to current values
3. Set `last_minted_at` timestamp
4. Next sync will show pending = 0 (until new activity occurs)

### 3. Frontend Level (Dashboard)

The dashboard displays TWO types of values:

| Field | Purpose | Resets After Mint? |
|-------|---------|-------------------|
| **Lifetime Totals** | NFT milestone progress | No (cumulative forever) |
| **Pending Values** | Tokens eligible for minting | Yes (resets to 0) |

---

## User Flow Example

### Initial Connection
1. User connects Tesla account
2. System captures current odometer: 20,000 miles
3. Baseline set: `{ odometer: 20000 }`
4. Pending miles: 0

### After Driving
1. User drives 500 miles (odometer now 20,500)
2. Sync fetches new odometer: 20,500
3. Pending miles: 20,500 - 20,000 = **500**
4. Dashboard shows: "500 miles ready to mint"

### After Minting
1. User mints tokens
2. Smart contract receives: `evMilesDelta = 500`
3. User receives: 500 $ZSOLAR tokens
4. Baseline updates: `{ odometer: 20500 }`
5. Pending miles resets to: **0**

### Next Sync
1. User drives 200 more miles (odometer now 20,700)
2. Pending miles: 20,700 - 20,500 = **200**
3. Previous 500 miles are NOT counted again

---

## NFT Milestones vs Token Rewards

### NFT Milestones (Use Lifetime Totals)
NFT milestones are based on **cumulative lifetime values**:
- Solar: 500 kWh → Sunspark NFT
- Solar: 1,000 kWh → Photonic NFT
- etc.

NFTs are minted when lifetime thresholds are crossed. Each NFT can only be minted once per user.

### Token Rewards (Use Pending Delta)
Token rewards are based on **new activity since last mint**:
- New solar: +100 kWh → +100 $ZSOLAR
- New miles: +50 miles → +50 $ZSOLAR

Tokens are issued per unit, then that unit's eligibility is consumed.

---

## Error Prevention

### Double-Issuance Protection
1. **Backend validates delta > 0** before calling smart contract
2. **Smart contract tracks cumulative** per user for NFT checks
3. **Baseline resets atomically** after successful mint

### Recovery Scenarios

| Scenario | Handling |
|----------|----------|
| Mint transaction fails | Baseline NOT reset, user can retry |
| API fetch fails | Use cached lifetime values |
| Device disconnected | Preserve baseline for reconnection |
| New contract deployed | See Migration Guide below |

---

## Migration Guide (If Contract Redeployment Needed)

If a new smart contract must be deployed:

1. **Export user cumulative values** from old contract
2. **Initialize new contract** with existing cumulatives
3. **User baselines remain unchanged** in database
4. **No re-minting occurs** - deltas calculated from same baselines

Users do NOT need to take any action - the migration is handled by the admin.

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOKEN ISSUANCE FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Device API ──► Lifetime Total ──► Delta Calculation           │
│                      │                    │                     │
│                      │                    ▼                     │
│                      │            Pending Tokens                │
│                      │                    │                     │
│                      ▼                    ▼                     │
│               NFT Milestones      mintRewards(delta)            │
│               (cumulative)              │                       │
│                                         ▼                       │
│                                  Tokens Minted                  │
│                                         │                       │
│                                         ▼                       │
│                                  Baseline Reset                 │
│                                         │                       │
│                                         ▼                       │
│                                  Pending = 0                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

This architecture ensures:
- ✅ No double-issuance of tokens
- ✅ Accurate tokenization of sustainable behaviors
- ✅ Clear separation of NFT progress vs token rewards
- ✅ User-friendly dashboard experience
