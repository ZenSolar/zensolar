

# Energy Command Center - Tesla-Inspired Redesign

## Overview

A comprehensive redesign of the Energy Command Center to achieve a sleek, minimal, Tesla-inspired aesthetic that prioritizes clarity, functionality, and visual elegance.

---

## Technical Changes

### 1. Icon Consistency with Landing Page

**Current State:** ActivityMetrics uses generic Lucide icons
**Target State:** Match landing page icon colors exactly

| Field | Current Icon | Landing Page Style |
|-------|-------------|-------------------|
| Solar | `Sun` (text-solar) | `Sun` with `text-amber-500` |
| EV Miles | `Car` (text-energy) | `Car` with `text-blue-500` |
| Battery | `Battery` (text-secondary) | `Battery` with `text-emerald-500` |
| Charging | `Zap` (text-accent) | `Zap` with `text-purple-500` |

---

### 2. Unified Token Price (Sync with TokenPriceCard)

**Problem:** ActivityMetrics has its own `tokenPrice` state (hardcoded $0.10) while TokenPriceCard has a separate editable price

**Solution:** 
- Accept `tokenPrice` as a prop from parent `ZenSolarDashboard`
- TokenPriceCard will lift its state up OR use a shared context
- Both components display the same price

**Implementation:**
```
ZenSolarDashboard.tsx:
- Add tokenPrice state: const [tokenPrice, setTokenPrice] = useState(0.10);
- Pass to TokenPriceCard: <TokenPriceCard onPriceChange={setTokenPrice} ... />
- Pass to ActivityMetrics: <ActivityMetrics tokenPrice={tokenPrice} ... />

ActivityMetrics.tsx:
- Remove internal tokenPrice state
- Accept tokenPrice as prop
- Remove price edit popover (centralized in TokenPriceCard)
```

---

### 3. LiveBetaToggle Text Update

**File:** `src/components/layout/LiveBetaToggle.tsx`

**Changes:**
- When OFF: Display "Live Beta" (not "Mainnet Mode")
- When ON: Display "Live Beta (10x)" (unchanged)

```tsx
// Line 81
{isLiveBeta ? "Live Beta (10x)" : "Live Beta"}

// Tooltip Line 56
<p>{isLiveBeta ? "Live Beta ON (10x)" : "Live Beta OFF"}</p>
```

---

### 4. Simplified Refresh Indicator

**File:** `src/components/dashboard/RefreshIndicators.tsx`

**Current:** Shows Tesla, Enphase, SolarEdge, Wallbox pills
**Target:** Single "Last updated 2:45 PM" text only

**New Component:**
```tsx
export function RefreshIndicators({ lastUpdatedAt }: { lastUpdatedAt?: string | null }) {
  const time = formatTime(lastUpdatedAt ?? undefined);
  
  return (
    <span className="text-xs text-muted-foreground">
      Last updated{time ? ` ${time}` : ''}
    </span>
  );
}
```

---

### 5. Tesla-Inspired Activity Fields Redesign

**Design Philosophy:**
- Clean, minimal cards with generous whitespace
- Label ABOVE the value (like "Solar Energy Produced" above "1,234 kWh")
- Subtle borders, no heavy gradients
- Compact, uniform sizing
- Tap-to-mint is elegant and non-intrusive

**New Card Structure:**
```
+----------------------------------------+
| ☀️  Solar Energy Produced         [→] |
|     1,234 kWh                          |
+----------------------------------------+
```

**Key Style Changes:**
- Reduce padding from `p-4` to `p-3`
- Smaller icons: `h-5 w-5` instead of `h-6 w-6`
- Label on top, value below (reversed order)
- Remove sublabel (redundant)
- Unified card height
- Subtle tap indicator (just chevron, no pulse badge on every card)

---

### 6. Total Available Tokens - Same Card Style

**Current:** Large hero treatment with p-5, big icons, animations
**Target:** Match activity field styling - same compact height and treatment

**New Design:**
```
+----------------------------------------+
| 💰  Total Available Tokens        [→] |
|     2,124 $ZSOLAR · $212.40 USD        |
+----------------------------------------+
| [MINT ALL]                             |
+----------------------------------------+
```

---

### 7. Complete ActivityMetrics.tsx Restructure

**New Component Layout:**
```tsx
<Card className="overflow-hidden border-border/50 bg-card">
  <CardContent className="p-4 space-y-3">
    
    {/* Header Row */}
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <Gauge className="h-4 w-4 text-primary" />
        Energy Command Center
      </h2>
      <div className="flex items-center gap-2">
        {/* Provider logos */}
        {connectedProviders.map(...)}
        {/* Mint All button */}
      </div>
    </div>
    
    {/* Single last updated time */}
    <span className="text-xs text-muted-foreground">
      Last updated 2:45 PM
    </span>
    
    {/* Activity Grid - 2 columns on mobile */}
    <div className="grid grid-cols-2 gap-2">
      <ActivityField icon={Sun} label="Solar Produced" value="1,234" unit="kWh" color="amber" onTap={...} />
      <ActivityField icon={Car} label="EV Miles" value="567" unit="mi" color="blue" onTap={...} />
      <ActivityField icon={Battery} label="Battery Discharged" value="89" unit="kWh" color="emerald" onTap={...} />
      <ActivityField icon={Zap} label="EV Charging" value="234" unit="kWh" color="purple" onTap={...} />
    </div>
    
    {/* Total Available Tokens - Same card style */}
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total Available Tokens</p>
          <p className="text-xl font-bold">
            2,124 <span className="text-sm text-muted-foreground">$ZSOLAR</span>
          </p>
          <p className="text-xs text-primary">≈ $212.40 @ $0.10</p>
        </div>
        <Button size="sm" className="gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          MINT ALL
        </Button>
      </div>
    </div>
    
    {/* Footer: NFTs + Lifetime */}
    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
      ...
    </div>
    
  </CardContent>
</Card>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ActivityMetrics.tsx` | Complete redesign with Tesla aesthetic, icon color matching, simplified fields, label-above-value layout, unified token price prop |
| `src/components/dashboard/TokenPriceCard.tsx` | Add `onPriceChange` callback prop to lift state up |
| `src/components/dashboard/RefreshIndicators.tsx` | Simplify to single timestamp, remove provider pills |
| `src/components/layout/LiveBetaToggle.tsx` | Change "Mainnet Mode" to "Live Beta" when off |
| `src/components/ZenSolarDashboard.tsx` | Add shared tokenPrice state, pass to both TokenPriceCard and ActivityMetrics |

---

## Visual Comparison

### Before (Current)
- Cluttered provider pills (Tesla, Enphase, SolarEdge, Wallbox)
- Value displayed first, label below
- Large inconsistent card sizes
- Separate token price state
- "Mainnet Mode" text

### After (Tesla-Inspired)
- Single "Last updated 2:45 PM" timestamp
- Label above value (industry standard)
- 2-column grid with uniform compact cards
- Synchronized token price across components
- "Live Beta" text
- Icon colors match landing page
- Clean, minimal, generous whitespace
- Subtle tap indicators
- Unified Total Available Tokens card size

---

## Color Mapping (Landing Page Alignment)

```tsx
const fieldColors = {
  solar: { icon: 'text-amber-500', bg: 'bg-amber-500/10' },
  ev: { icon: 'text-blue-500', bg: 'bg-blue-500/10' },
  battery: { icon: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  charging: { icon: 'text-purple-500', bg: 'bg-purple-500/10' },
};
```

