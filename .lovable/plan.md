
# Dashboard Enhancements: NFT Card Polish + Layout Reorganization

## Overview

This plan addresses multiple improvements to enhance the NFT Milestone card and reorganize the dashboard layout for better user experience.

---

## Changes Summary

### 1. Verify Tap-to-Cycle and Category Selection ✓

The current `RewardProgress.tsx` already implements:
- `selectedCategory` state (line 152)
- `handleCycleCategory()` on hero image (line 189-194)
- `handleSelectCategory()` on category dots (line 197-199)
- Category dots with `onClick` handlers (lines 339, 348, 357, 366)

**Status**: Already implemented and working.

---

### 2. Add Smooth Cross-Fade Animation Between NFT Images

Already partially implemented with `AnimatePresence` and `motion.img` (lines 256-268).

**Enhance by**:
- Adding `scale` animation alongside opacity
- Smoothing the transition duration

**File**: `src/components/dashboard/RewardProgress.tsx` (Lines 258-267)

```tsx
// Current
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.3 }}

// New - add scale for smoother feel
initial={{ opacity: 0, scale: 1.02 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.98 }}
transition={{ duration: 0.35, ease: "easeOut" }}
```

---

### 3. Add Haptic Feedback When Tapping Category Dots

Import and use the `useHaptics` hook in RewardProgress.tsx.

**File**: `src/components/dashboard/RewardProgress.tsx`

**Changes**:
1. Import haptics hook
2. Call `lightTap()` on category dot clicks and hero image taps

```tsx
import { useHaptics } from '@/hooks/useHaptics';

// Inside component
const { lightTap } = useHaptics();

// In handleCycleCategory
const handleCycleCategory = () => {
  lightTap(); // Add haptic feedback
  const currentCat = selectedCategory || displayMilestone?.category || 'solar';
  // ... rest unchanged
};

// In handleSelectCategory  
const handleSelectCategory = (category: CategoryType) => {
  lightTap(); // Add haptic feedback
  setSelectedCategory(category);
};
```

---

### 4. Rename "ZenSolar NFTs" to "zensolar NFTs" (Lowercase 's')

Change text in RewardProgress.tsx header.

**File**: `src/components/dashboard/RewardProgress.tsx` (Line 227)

```tsx
// Current
<h3 className="text-base font-semibold text-foreground">ZenSolar NFTs</h3>

// New
<h3 className="text-base font-semibold text-foreground">zensolar NFTs</h3>
```

---

### 5. Remove "Owned X NFTs" Text from Dashboard

Remove from both `RewardActions.tsx` and `DemoRewardActions.tsx`.

**File 1**: `src/components/dashboard/RewardActions.tsx` (Lines 861-867)
**Action**: Delete this block entirely
```tsx
{/* Owned NFTs count */}
{eligibility && (
  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
    <Award className="h-4 w-4" />
    <span>Owned: {eligibility.ownedNFTs.length} NFTs</span>
  </div>
)}
```

**File 2**: `src/components/demo/DemoRewardActions.tsx` (Lines 327-332)
**Action**: Delete this block entirely
```tsx
{walletAddress && (
  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
    <Award className="h-4 w-4" />
    <span>Owned: {ownedNFTCount} NFTs</span>
  </div>
)}
```

---

### 6. Move "Mint ZenSolar NFTs" Button Below NFT Card

The "MINT ZENSOLAR NFTS" button currently lives in `RewardActions.tsx`. Move it to a new section below `RewardProgress` in the dashboard.

**Approach**: Create a new component or integrate into `RewardProgress.tsx` footer.

**File**: `src/components/dashboard/RewardProgress.tsx`

Add a new "Mint NFTs" row in the footer grid (after "View Collection" and "Lifetime Minted"):

```tsx
{/* Add new row for Mint NFTs CTA */}
{eligibility?.totalEligible > 0 && (
  <Button
    onClick={() => navigate('/nft-collection')}
    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
    size="lg"
  >
    <Images className="mr-2 h-4 w-4" />
    MINT zensolar NFTs
    <Badge variant="secondary" className="ml-2 bg-white/20">
      {eligibility.totalEligible} available
    </Badge>
  </Button>
)}
```

But since we don't have eligibility data in RewardProgress, a simpler approach is to **remove the button from RewardActions** and add a visual CTA in the NFT card footer that links to the collection page.

**Actually, looking at the screenshot reference**: The button should move from RewardActions to below the NFT card. We'll add this as a third row in the RewardProgress footer.

---

### 7. Move "Lifetime Minted" to Energy Command Center

Move the "Lifetime Minted" indicator from the NFT card footer to the bottom of the Energy Command Center (ActivityMetrics).

**File 1**: `src/components/dashboard/ActivityMetrics.tsx`
**Add** a new "Lifetime Minted" section at the bottom of the card, after the "Total Available Tokens" section.

```tsx
{/* Lifetime Minted - moved from NFT card */}
<Link 
  to="/mint-history" 
  className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all group"
>
  <div className="p-2.5 rounded-xl bg-muted">
    <Coins className="h-5 w-5 text-muted-foreground" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-muted-foreground">Lifetime Minted Tokens</p>
    <p className="text-xl font-bold text-foreground">
      {data.lifetimeMinted?.toLocaleString() || '0'}
      <span className="text-sm font-semibold text-muted-foreground ml-1.5">$ZSOLAR</span>
    </p>
  </div>
  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
</Link>
```

**File 2**: `src/components/dashboard/RewardProgress.tsx`
**Remove** the "Lifetime Minted" link from the footer grid, leaving only "View Collection".

---

### 8. Improve Tesla Logo in Energy Command Center

The current Tesla logo (`src/assets/logos/tesla-logo.png`) has a red background with white text - not ideal for dark mode UI.

**Solution**: Add proper styling with better contrast:

**File**: `src/components/dashboard/ActivityMetrics.tsx` (Lines 139-149)

Current styling:
```tsx
<div 
  key={provider}
  className="h-7 w-7 rounded-lg bg-muted/80 p-1.5 flex items-center justify-center border border-border/50"
>
  <img 
    src={providerLogos[provider]} 
    alt={provider}
    className="h-4 w-4 object-contain"
  />
</div>
```

**New approach**: Use a larger container with better padding and styling:

```tsx
<div 
  key={provider}
  className={cn(
    "h-8 w-8 rounded-lg p-1 flex items-center justify-center border border-border/50",
    provider === 'tesla' 
      ? "bg-[#E82127]" // Tesla red background to match the logo
      : "bg-muted/80"
  )}
  title={provider.charAt(0).toUpperCase() + provider.slice(1)}
>
  <img 
    src={providerLogos[provider]} 
    alt={provider}
    className={cn(
      "object-contain",
      provider === 'tesla' ? "h-5 w-5 brightness-0 invert" : "h-4 w-4"
    )}
  />
</div>
```

Alternatively, use just the Tesla "T" icon with inversion for better visibility, or source a proper dark-mode-friendly Tesla logo.

**Simplest Fix**: Increase size and add inversion filter to make the logo more visible:

```tsx
className="h-5 w-5 object-contain dark:brightness-0 dark:invert"
```

This inverts the colors in dark mode, making the Tesla logo white on the dark background.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/RewardProgress.tsx` | Add haptics, improve cross-fade animation, rename title to lowercase, update footer layout |
| `src/components/dashboard/ActivityMetrics.tsx` | Add Lifetime Minted section, improve Tesla logo styling |
| `src/components/dashboard/RewardActions.tsx` | Remove "Owned X NFTs" text, optionally remove "MINT ZENSOLAR NFTS" button (if moving) |
| `src/components/demo/DemoRewardActions.tsx` | Remove "Owned X NFTs" text for consistency |
| `src/components/ZenSolarDashboard.tsx` | Pass `lifetimeMinted` prop to ActivityMetrics if needed |
| `src/components/demo/DemoDashboard.tsx` | Same changes for demo consistency |

---

## Visual Layout After Changes

### Energy Command Center (Bottom)
```
+----------------------------------------------------------+
|  Energy Command Center                     [Tesla] [⊙]   |
|  Last updated 10:29 AM                                   |
|                                                          |
|  [Solar Energy Produced]       51,000 kWh    [MINT →]    |
|  [EV Miles Driven]             177 mi        [MINT →]    |
|  [Battery Discharged]          2,402 kWh     [MINT →]    |
|  [Tesla Supercharger]          55 kWh        [MINT →]    |
|                                                          |
|  +----------------------------------------------------+  |
|  | Total Available Tokens                              |  |
|  | 0 $ZSOLAR            ≈ $0.00 @ $0.10     [MINT →]  |  |
|  +----------------------------------------------------+  |
|                                                          |
|  +----------------------------------------------------+  |
|  | 🪙 Lifetime Minted Tokens                      →   |  |
|  |    265,174 $ZSOLAR                                 |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

### NFT Card (After Energy Command Center)
```
+----------------------------------------------------------+
|  zensolar NFTs                            [24 Earned]    |
+----------------------------------------------------------+
|                                                          |
|  [Hero NFT Image - Tap to Cycle]          [Tap to Browse]|
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
|  [View Collection →]                                     |
+----------------------------------------------------------+
```

---

## Technical Notes

1. **Haptics**: The `useHaptics` hook already exists and provides `lightTap()` for subtle feedback.

2. **Cross-fade**: Already using `AnimatePresence` with `mode="wait"` - just need to enhance the animation values.

3. **Tesla Logo**: The current image has a red background. Options:
   - Use CSS filter `invert` in dark mode
   - Source a transparent/outline version of the Tesla logo
   - Apply a white background container in dark mode

4. **Props Flow**: `lifetimeMinted` is already being passed to RewardProgress. We need to also pass it to ActivityMetrics.

