
# NFT Milestone Card Enhancement + Layout Optimization

## Overview

This plan enhances the NFT Milestone card with interactive category selection and cleaner layout organization, creating a more intuitive and engaging experience.

---

## Changes Summary

### 1. Add "ZenSolar NFTs" Title to Card Header

**Current Header:**
```
[24 Earned]                    [View All →]
```

**New Header:**
```
ZenSolar NFTs                  [24 Earned]
```

The "View All →" link moves below the category dots.

---

### 2. Tap-to-Cycle Feature on Hero NFT Image

When the user taps on the hero NFT image, it cycles to the next category's milestone:
- Solar → Battery → EV Miles → Charging → Solar (loops)

A subtle visual indicator shows the current category.

---

### 3. Tappable Category Dots with Labels

Each category dot becomes tappable and shows the category name above it:

```
+--------+  +--------+  +---------+  +----------+
|  Solar |  | Battery|  | EV Miles|  | Charging |
|  [☀️]  |  |  [🔋]  |  |  [🚗]   |  |   [⚡]   |
|   2/8  |  |   1/7  |  |   3/10  |  |   2/8    |
+--------+  +--------+  +---------+  +----------+
     ^                                    
   Active (highlighted)
```

Tapping a category switches the hero NFT to show that category's next milestone.

---

### 4. Move NFT Footer from Energy Command Center

**Remove from ActivityMetrics:**
- "NFTs Earned" indicator
- "Lifetime Minted" indicator

**Add to RewardProgress (below category dots):**
- "View All" link (was in header)
- "Lifetime Minted" indicator with tap-to-navigate

---

## Technical Implementation

### File 1: `src/components/dashboard/RewardProgress.tsx`

**Key Changes:**

1. **Add state for selected category:**
```tsx
const [selectedCategory, setSelectedCategory] = useState<'solar' | 'battery' | 'ev_miles' | 'charging' | null>(null);
```

2. **New header with title:**
```tsx
<div className="flex items-center justify-between">
  <h3 className="text-base font-semibold text-foreground">ZenSolar NFTs</h3>
  <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
    <Award className="h-3.5 w-3.5" />
    <span className="font-semibold">{totalEarned} Earned</span>
  </Badge>
</div>
```

3. **Tap-to-cycle on hero image:**
```tsx
<motion.div 
  onClick={handleCycleCategory}
  className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
>
  {/* Image and overlay */}
</motion.div>
```

4. **Category dots with labels and tap handlers:**
```tsx
function CategoryDot({ icon, label, count, total, color, isActive, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all",
        isActive 
          ? cn("bg-gradient-to-br", styles.gradient, "shadow-lg", styles.glow)
          : "bg-muted/50 hover:bg-muted"
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
      <Icon className={...} />
      <span className="text-xs font-bold tabular-nums">
        {count}/{total}
      </span>
    </motion.button>
  );
}
```

5. **Footer with "View All" and "Lifetime Minted":**
```tsx
<div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
  <Link to="/nft-collection" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all">
    <Award className="h-4 w-4 text-primary" />
    <span>View Collection</span>
    <ChevronRight className="h-4 w-4" />
  </Link>
  
  <Link to="/mint-history" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all">
    <Coins className="h-4 w-4" />
    <div>
      <p className="text-[10px] text-muted-foreground uppercase">Lifetime Minted</p>
      <p className="text-sm font-bold">{lifetimeMinted.toLocaleString()}</p>
    </div>
    <ChevronRight className="h-4 w-4" />
  </Link>
</div>
```

---

### File 2: `src/components/dashboard/ActivityMetrics.tsx`

**Remove the footer section (lines 276-303):**
- Delete the entire "Footer: NFTs + Lifetime" grid
- The card ends after the "Total Available Tokens" section

---

### File 3: `src/components/ZenSolarDashboard.tsx`

**Pass lifetimeMinted to RewardProgress:**
```tsx
<RewardProgress
  tokensEarned={activityData.tokensEarned}
  solarKwh={activityData.solarEnergyProduced}
  evMilesDriven={activityData.evMilesDriven}
  evChargingKwh={activityData.teslaSuperchargerKwh + activityData.homeChargerKwh}
  batteryDischargedKwh={activityData.batteryStorageDischarged}
  nftsEarned={activityData.nftsEarned}
  lifetimeMinted={activityData.lifetimeMinted}  // NEW
  isNewUser={true}
/>
```

---

## New Category Cycling Logic

```tsx
// Category order for cycling
const categoryOrder = ['solar', 'battery', 'ev_miles', 'charging'] as const;

// Get milestone for selected category (or use priority if none selected)
const displayMilestone = useMemo(() => {
  if (selectedCategory) {
    return getMilestoneForCategory(selectedCategory, categoryValues);
  }
  return getNextPriorityMilestone(...);
}, [selectedCategory, categoryValues]);

// Cycle through categories on tap
const handleCycleCategory = () => {
  const currentIndex = selectedCategory 
    ? categoryOrder.indexOf(selectedCategory) 
    : -1;
  const nextIndex = (currentIndex + 1) % categoryOrder.length;
  setSelectedCategory(categoryOrder[nextIndex]);
};

// Select specific category on dot tap
const handleSelectCategory = (category: typeof categoryOrder[number]) => {
  setSelectedCategory(category);
};
```

---

## Helper Function Addition to `nftMilestones.ts`

```tsx
// Get next milestone for a specific category
export function getMilestoneForCategory(
  category: 'solar' | 'battery' | 'ev_miles' | 'charging',
  values: { solar: number; battery: number; evMiles: number; charging: number }
): PriorityMilestone | null {
  const milestoneMap = {
    solar: { milestones: SOLAR_MILESTONES, value: values.solar, unit: 'kWh' },
    battery: { milestones: BATTERY_MILESTONES, value: values.battery, unit: 'kWh' },
    ev_miles: { milestones: EV_MILES_MILESTONES, value: values.evMiles, unit: 'miles' },
    charging: { milestones: EV_CHARGING_MILESTONES, value: values.charging, unit: 'kWh' },
  };
  
  const config = milestoneMap[category];
  const next = getNextMilestone(config.value, config.milestones);
  
  if (next) {
    return { ...next, category, currentValue: config.value, unit: config.unit };
  }
  
  // If category is complete, show the last earned milestone
  const earned = calculateEarnedMilestones(config.value, config.milestones);
  if (earned.length > 0) {
    const last = earned[earned.length - 1];
    return { ...last, category, currentValue: config.value, unit: config.unit };
  }
  
  // No milestones at all - show the first one
  const first = config.milestones[0];
  return { ...first, category, currentValue: config.value, unit: config.unit };
}
```

---

## Visual Design Updates

### Category Dot Layout (New)

```
+----------------------------------------------------------+
|  ZenSolar NFTs                            [24 Earned]    |
+----------------------------------------------------------+
|                                                          |
|  [Hero NFT Image - Tap to Cycle Categories]              |
|                                                          |
|  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             |
|  750 / 1,000 kWh                                         |
|                                                          |
|  +--------+  +--------+  +---------+  +----------+       |
|  |  Solar |  | Battery|  | EV Miles|  | Charging |       |
|  |  [☀️]  |  |  [🔋]  |  |  [🚗]   |  |   [⚡]   |       |
|  |   2/8  |  |   1/7  |  |   3/10  |  |   2/8    |       |
|  +--------+  +--------+  +---------+  +----------+       |
|                                                          |
|  [View Collection →]           [Lifetime: 15,234 →]      |
+----------------------------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/RewardProgress.tsx` | Add title, tap-to-cycle, category labels, tappable dots, footer section |
| `src/components/dashboard/ActivityMetrics.tsx` | Remove NFT footer section (NFTs Earned + Lifetime Minted) |
| `src/components/ZenSolarDashboard.tsx` | Pass `lifetimeMinted` prop to RewardProgress |
| `src/lib/nftMilestones.ts` | Add `getMilestoneForCategory()` helper function |
| `src/components/demo/DemoDashboard.tsx` | Same changes as ZenSolarDashboard for consistency |

---

## Animation Polish

- **Category dots**: Smooth scale animation on tap (`whileTap: { scale: 0.95 }`)
- **Hero image cycle**: Fade transition between categories using `AnimatePresence`
- **Active dot**: Pulse glow effect on the selected category
- **Progress bar**: Animate width change when switching categories
