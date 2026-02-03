# Token Integrity Architecture

## Overview

This document defines the architectural approach to ensure **1:1 token-to-energy integrity**—every $ZSOLAR token is permanently tied to a specific unit of energy (kWh or mile) and can never be issued twice.

## The Problem

### Double-Issuance Attack Vector

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ATTACK SCENARIO: Account Deletion & Re-Creation                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Day 1: User A connects Tesla (odometer: 50,000 miles)                      │
│         → Mints 50,000 $ZSOLAR tokens                                       │
│         → Tokens sent to Wallet A                                           │
│                                                                             │
│  Day 2: User A deletes account (baseline data deleted)                      │
│                                                                             │
│  Day 3: User A creates new account with same Tesla credentials              │
│         → Tesla API returns same 50,000 miles                               │
│         → New baseline captured at 0 (no previous record)                   │
│         → User could mint 50,000 MORE tokens for SAME miles                 │
│                                                                             │
│  Result: 100,000 tokens backed by only 50,000 miles of actual driving       │
│          Token supply inflated 2x, integrity destroyed                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Current Architecture Is Vulnerable

The current `connected_devices` table stores:
- `baseline_data`: Captured at device claim time
- `lifetime_totals`: Updated on each sync
- `last_minted_at`: Timestamp of last mint

**Problem**: This data is tied to `user_id`. When a user deletes their account, all device claim records are deleted, including the baseline. A new account starts fresh with no memory of what was previously tokenized.

---

## Solution: Device Watermark Registry

### Core Concept

Create a **permanent, user-independent registry** that tracks the highest tokenized values for each physical device. This registry survives account deletion.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DEVICE WATERMARK REGISTRY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  device_id: "TESLA-VIN-5YJ3E..."                                            │
│  provider: "tesla"                                                          │
│  device_type: "vehicle"                                                     │
│                                                                             │
│  WATERMARKS (highest values ever tokenized):                                │
│  ├── odometer_miles: 50,000                                                 │
│  ├── charging_kwh: 12,500                                                   │
│  └── supercharger_kwh: 3,200                                                │
│                                                                             │
│  AUDIT TRAIL:                                                               │
│  ├── first_claimed_at: 2025-01-15                                           │
│  ├── last_minted_at: 2025-06-20                                             │
│  ├── total_tokens_issued: 65,700                                            │
│  └── claim_history: [{user_id, claimed_at, released_at}, ...]               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### How It Works

#### 1. Device Claim (New User Connects Energy Account)

```typescript
// When user claims a device:
async function claimDevice(userId: string, deviceId: string, provider: string) {
  // Check if device has prior tokenization history
  const watermark = await getDeviceWatermark(deviceId, provider);
  
  if (watermark) {
    // Device was previously claimed - use watermark as baseline
    baseline = {
      odometer: watermark.odometer_miles,
      solar_kwh: watermark.solar_kwh,
      battery_kwh: watermark.battery_kwh,
      // ... other fields
    };
    console.log(`Device previously tokenized. Baseline set to watermark.`);
  } else {
    // First-ever claim - capture current API values as baseline
    const currentData = await fetchFromAPI(deviceId, provider);
    baseline = currentData.lifetimeValues;
    
    // Create watermark record (initially empty - no tokens issued yet)
    await createDeviceWatermark(deviceId, provider, baseline);
  }
  
  return baseline;
}
```

#### 2. Minting Tokens

```typescript
// When user mints tokens:
async function mintTokens(userId: string, deviceId: string, deltaValues: object) {
  // Mint tokens for delta
  const txHash = await mintOnChain(walletAddress, deltaValues);
  
  // Update watermark to new high-water mark
  await updateDeviceWatermark(deviceId, provider, {
    odometer_miles: currentOdometer,
    solar_kwh: currentSolarKwh,
    // ... other fields
    last_minted_at: new Date(),
    total_tokens_issued: previous + newTokens,
  });
  
  // Add to claim history
  await addMintAuditLog(deviceId, userId, deltaValues, txHash);
}
```

#### 3. Account Deletion

```typescript
// When user deletes account:
async function deleteAccount(userId: string) {
  // Remove user's claim on devices
  await releaseDeviceClaims(userId);
  
  // WATERMARKS ARE PRESERVED
  // The device_tokenization_registry is NOT deleted
  
  // Delete user profile and personal data
  await deleteUserData(userId);
}
```

#### 4. Re-Claim After Deletion

```typescript
// Same device, new (or same) user:
async function reclaimDevice(newUserId: string, deviceId: string) {
  const watermark = await getDeviceWatermark(deviceId, provider);
  
  // Watermark exists from previous owner
  // Baseline = MAX(currentAPIValue, watermark)
  const currentData = await fetchFromAPI(deviceId, provider);
  
  const baseline = {
    odometer: Math.max(currentData.odometer, watermark.odometer_miles),
    solar_kwh: Math.max(currentData.solarKwh, watermark.solar_kwh),
    // ...
  };
  
  // User can ONLY earn tokens for activity AFTER the watermark
  // Previous 50,000 miles? Already tokenized. Start from there.
}
```

---

## Database Schema

### New Table: `device_tokenization_registry`

```sql
CREATE TABLE public.device_tokenization_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Device identification (unique per physical device)
  device_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'vehicle', 'solar', 'battery', 'charger'
  
  -- Watermarks (highest tokenized values - NEVER decrease)
  watermark_odometer_miles NUMERIC DEFAULT 0,
  watermark_solar_kwh NUMERIC DEFAULT 0,
  watermark_battery_kwh NUMERIC DEFAULT 0,
  watermark_charging_kwh NUMERIC DEFAULT 0,
  watermark_supercharger_kwh NUMERIC DEFAULT 0,
  
  -- Audit metadata
  first_tokenized_at TIMESTAMP WITH TIME ZONE,
  last_tokenized_at TIMESTAMP WITH TIME ZONE,
  total_tokens_issued NUMERIC DEFAULT 0,
  total_claims INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one record per physical device
  UNIQUE(provider, device_id)
);

-- This table has NO RLS - it's managed by backend functions only
-- No user can directly read/write to prevent manipulation
```

### New Table: `device_claim_history`

```sql
CREATE TABLE public.device_claim_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  device_registry_id UUID REFERENCES device_tokenization_registry(id),
  user_id UUID NOT NULL, -- Historical reference, not FK (user may be deleted)
  wallet_address TEXT,
  
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  release_reason TEXT, -- 'account_deleted', 'manual_disconnect', 'transferred'
  
  -- Snapshot at claim time
  baseline_at_claim JSONB,
  
  -- Tokens issued during this claim period
  tokens_issued_in_period NUMERIC DEFAULT 0,
  mint_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

---

## Security Considerations

### 1. Backend-Only Access

The `device_tokenization_registry` table should have **no RLS policies for users**. Only backend Edge Functions can read/write:

```sql
-- Revoke all access from anon and authenticated roles
REVOKE ALL ON public.device_tokenization_registry FROM anon, authenticated;

-- Only service role can access (used by Edge Functions)
GRANT SELECT, INSERT, UPDATE ON public.device_tokenization_registry TO service_role;
```

### 2. Watermark Integrity Rules

- **Watermarks can only INCREASE, never decrease**
- Updates must be atomic with mint transactions
- Failed mints should not update watermarks

```typescript
// In mint-onchain Edge Function:
async function updateWatermarkAfterMint(deviceId: string, newValues: object) {
  const { data, error } = await supabase
    .from('device_tokenization_registry')
    .update({
      watermark_odometer_miles: sql`GREATEST(watermark_odometer_miles, ${newValues.odometer})`,
      watermark_solar_kwh: sql`GREATEST(watermark_solar_kwh, ${newValues.solarKwh})`,
      // ... other fields
      last_tokenized_at: new Date(),
      total_tokens_issued: sql`total_tokens_issued + ${tokensIssued}`,
    })
    .eq('device_id', deviceId)
    .eq('provider', provider);
}
```

### 3. Device Transfer Scenarios

When a physical device is sold (e.g., used Tesla):

| Scenario | Handling |
|----------|----------|
| New owner creates ZenSolar account | Watermark ensures they only earn from NEW miles |
| Previous owner's tokens | They keep tokens already minted |
| Device history | Full audit trail in `device_claim_history` |

---

## Implementation Phases

### Phase 1: Foundation (Priority - Q1 2025)

- [ ] Create `device_tokenization_registry` table
- [ ] Create `device_claim_history` table
- [ ] Modify device claim flow to check/create watermarks
- [ ] Modify `mint-onchain` to update watermarks atomically
- [ ] Add watermark check to baseline calculation

### Phase 2: Migration (Q2 2025)

- [ ] Backfill watermarks from existing `connected_devices` data
- [ ] Backfill from `mint_transactions` for audit trail
- [ ] Validate no double-issuance in historical data

### Phase 3: Hardening (Q3 2025)

- [ ] Add monitoring for anomalous claim patterns
- [ ] Rate limiting on device claims (prevent rapid claim/release cycling)
- [ ] Admin dashboard for device history review
- [ ] On-chain device registry (optional - for maximum transparency)

---

## Verification & Auditing

### Integrity Check Query

```sql
-- Verify no device has issued more tokens than its current lifetime values
SELECT 
  r.device_id,
  r.provider,
  r.total_tokens_issued,
  r.watermark_odometer_miles + r.watermark_solar_kwh + r.watermark_battery_kwh as max_possible_tokens,
  CASE 
    WHEN r.total_tokens_issued > (r.watermark_odometer_miles + r.watermark_solar_kwh + r.watermark_battery_kwh)
    THEN 'INTEGRITY VIOLATION'
    ELSE 'OK'
  END as status
FROM device_tokenization_registry r;
```

### Claim History Audit

```sql
-- View full history of a device across all owners
SELECT 
  h.claimed_at,
  h.released_at,
  h.release_reason,
  h.tokens_issued_in_period,
  h.wallet_address
FROM device_claim_history h
JOIN device_tokenization_registry r ON h.device_registry_id = r.id
WHERE r.device_id = 'TESLA-VIN-5YJ3E...'
ORDER BY h.claimed_at;
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TOKEN INTEGRITY GUARANTEE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Every token tied to specific physical device                            │
│  ✅ Watermarks persist across account deletions                             │
│  ✅ Full audit trail of device ownership history                            │
│  ✅ No double-issuance possible (watermarks only increase)                  │
│  ✅ Backend-only access prevents user manipulation                          │
│  ✅ Compatible with device sales/transfers                                  │
│                                                                             │
│  CORE INVARIANT:                                                            │
│  total_tokens_issued(device) <= lifetime_activity(device)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

This architecture ensures that the ZenSolar tokenomics maintain their integrity regardless of user behavior, account lifecycle, or device ownership changes.
