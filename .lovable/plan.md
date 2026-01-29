

# Energy Command Center Fixes + NFT Milestone Card Reimagining

## Overview

This plan addresses two key areas:
1. **Fix unit text colors** in Activity Fields (keep kWh/mi white instead of colored)
2. **Completely redesign the NFT Milestone Card** with an ultra-minimal, image-focused approach

---

## Part 1: Fix Activity Field Unit Colors

### Current Issue
In `src/components/dashboard/ActivityMetrics.tsx`, the unit text (kWh, mi) uses `styles.text` which applies category colors (amber, blue, emerald, purple).

### Solution
Change the unit span to use `text-muted-foreground` for inactive and `text-foreground/70` for active states, maintaining white/neutral text.

**File:** `src/components/dashboard/ActivityMetrics.tsx`

**Current Code (Lines 398-402):**
```tsx
<span className={cn(
  "text-base font-semibold ml-1",
  active ? styles.text : "text-muted-foreground"
)}>{unit}</span>
```

**New Code:**
```tsx
<span className="text-base font-semibold ml-1 text-muted-foreground">{unit}</span>
```

This keeps the unit text neutral/white regardless of active state.

---

## Part 2: NFT Milestone Card - Complete Reimagining

### Design Philosophy
Inspired by Apple/Tesla minimalism. The card should feel like a premium collectible preview, not a data dashboard.

### New Concept: "Next NFT Preview"

**Visual Layout:**
```text
+----------------------------------------------------------+
|  [12 Earned]                              [View All →]   |
|                                                          |
|  +--------------------------------------------------+    |
|  |                                                  |    |
|  |          [Large NFT Artwork Image]               |    |
|  |              (Next to unlock)                    |    |
|  |                                                  |    |
|  +--------------------------------------------------+    |
|                                                          |
|              "Photonic"                                  |
|         ☀️ Solar · 1,000 kWh                             |
|                                                          |
|  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●○○○○○○○           |
|           750 / 1,000 kWh                                |
|                                                          |
|  +------+  +------+  +------+  +------+                  |
|  | ☀️ 1 |  | 🔋 0 |  | 🚗 2 |  | ⚡ 1 |    Category dots |
|  +------+  +------+  +------+  +------+                  |
+----------------------------------------------------------+
```

### Key Features

1. **Badge Counter** - Simple "12 Earned" badge in top-left
2. **Hero Image** - Large, beautiful NFT artwork taking center stage
3. **NFT Name** - Clean typography below the image
4. **Category + Threshold** - "Solar · 1,000 kWh" with icon
5. **Minimal Progress** - Thin, elegant progress bar
6. **Category Dots** - Tiny indicators showing earned count per category (Solar, Battery, EV Miles, Charging) - matches user's requested order

### Category Cycling Logic

The card automatically shows the **next unlockable NFT** in priority order:
1. Solar (if next milestone available)
2. Battery (if next milestone available)
3. EV Miles (if next milestone available)
4. EV Charging (if next milestone available)

If all categories are complete, show a "Collection Complete" celebration state.

---

## Technical Implementation

### New Component Structure

**File:** `src/components/dashboard/RewardProgress.tsx` (Complete Rewrite)

```tsx
// Core component structure
export function RewardProgress({
  solarKwh,
  evMilesDriven,
  evChargingKwh,
  batteryDischargedKwh,
}: RewardProgressProps) {
  // Calculate next milestone across all categories (priority: solar, battery, ev_miles, charging)
  const nextMilestone = getNextPriorityMilestone(solarKwh, batteryKwh, evMiles, chargingKwh);
  
  // Get NFT artwork for the next milestone
  const artwork = getNftArtwork(nextMilestone?.id);
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header: Badge + View All */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{totalEarned} Earned</Badge>
          <Link to="/nft-collection">View All <ChevronRight /></Link>
        </div>
        
        {/* Hero NFT Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
          <img src={artwork} className="object-cover w-full h-full" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-3">
            <p className="text-white font-semibold">{nextMilestone.name}</p>
          </div>
        </div>
        
        {/* Category Label + Progress */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CategoryIcon category={nextMilestone.category} />
            <span>{categoryName} · {threshold.toLocaleString()} {unit}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {currentValue.toLocaleString()} / {threshold.toLocaleString()} {unit}
          </p>
        </div>
        
        {/* Category Summary Dots */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t">
          <CategoryDot icon={Sun} count={solarEarned.length} total={8} color="amber" />
          <CategoryDot icon={Battery} count={batteryEarned.length} total={7} color="emerald" />
          <CategoryDot icon={Car} count={evMilesEarned.length} total={10} color="blue" />
          <CategoryDot icon={Zap} count={chargingEarned.length} total={8} color="purple" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Helper Function: Priority Milestone Selection

```tsx
function getNextPriorityMilestone(solar, battery, evMiles, charging) {
  // Check in priority order: Solar → Battery → EV Miles → EV Charging
  const solarNext = getNextMilestone(solar, SOLAR_MILESTONES);
  if (solarNext) return { ...solarNext, category: 'solar', currentValue: solar };
  
  const batteryNext = getNextMilestone(battery, BATTERY_MILESTONES);
  if (batteryNext) return { ...batteryNext, category: 'battery', currentValue: battery };
  
  const evNext = getNextMilestone(evMiles, EV_MILES_MILESTONES);
  if (evNext) return { ...evNext, category: 'ev_miles', currentValue: evMiles };
  
  const chargeNext = getNextMilestone(charging, EV_CHARGING_MILESTONES);
  if (chargeNext) return { ...chargeNext, category: 'charging', currentValue: charging };
  
  return null; // All categories complete
}
```

### Category Dot Component

Tiny, clean indicator showing earned count per category:

```tsx
function CategoryDot({ icon: Icon, count, total, color }) {
  const styles = colorStyles[color];
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30">
      <div className={cn("p-1.5 rounded-md", styles.bg)}>
        <Icon className={cn("h-3.5 w-3.5", styles.text)} />
      </div>
      <span className="text-xs font-semibold tabular-nums">{count}/{total}</span>
    </div>
  );
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ActivityMetrics.tsx` | Fix unit text color from `styles.text` to neutral |
| `src/components/dashboard/RewardProgress.tsx` | Complete rewrite with new minimal design |
| `src/lib/nftMilestones.ts` | Add `getNextPriorityMilestone()` helper function |

---

## Visual Comparison

| Element | Before (Complex) | After (Minimal) |
|---------|-----------------|-----------------|
| Navigation | 4-tab interface | None (auto-cycles) |
| Progress bars | One per category per tab | Single progress bar |
| Earned badges | Scrolling horizontal list | Simple count badge |
| NFT imagery | Small icon badges | Large hero artwork |
| Category info | Per-tab breakdown | Compact 4-dot summary |
| Combo section | Separate labeled section | Removed (accessible via View All) |
| Total height | ~250px+ (with scrolling) | ~280px (fixed, no scroll) |

---

## Color Consistency Check

Verified landing page colors match dashboard:
- **Solar**: `from-amber-500 to-orange-500` 
- **EV Miles**: `from-blue-500 to-cyan-500`
- **Battery**: `from-emerald-500 to-green-500`
- **EV Charging**: `from-purple-500 to-pink-500`

These gradients are correctly used in `ActivityMetrics.tsx` for icon backgrounds.

---

## Responsive Considerations

- **Mobile (< 640px)**: Hero image takes full card width
- **Desktop**: Can optionally show 2 upcoming NFTs side-by-side
- **All sizes**: Category dots remain compact 4-column grid

---

## Animation Polish

- **Hero Image**: Subtle scale on hover (`hover:scale-102`)
- **Progress Bar**: Animate width on load
- **Badge Counter**: Pulse effect when new NFT earned
- **Card Entry**: Fade-in with `framer-motion`

