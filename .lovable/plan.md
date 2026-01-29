
# Dashboard Enhancements: Button Relocation, Tesla Logo, User View Toggle, and Mobile Fixes

## Overview

This plan addresses multiple UI improvements requested:
1. Move "MINT ZENSOLAR NFTs" button below the NFT card
2. Add "REFRESH DASHBOARD" button below it  
3. Fix the NFT card title to "ZenSolar NFTs"
4. Replace the Tesla logo with a proper inline SVG "T" icon
5. Add "Live User View" toggle for admins in the sidebar
6. Fix mobile token price card cutoff and collapsed view content

---

## Changes Summary

### 1. Move "MINT ZENSOLAR NFTs" Button Below NFT Card

**Current location**: Inside `RewardActions.tsx` (lines 800-814)

**New location**: Below the `RewardProgress` component in `ZenSolarDashboard.tsx`

The button navigates to `/nft-collection` and shows the number of eligible NFTs.

**File**: `src/components/ZenSolarDashboard.tsx`

Add after RewardProgress component:

```tsx
{/* NFT Mint Button - Below NFT Card */}
<AnimatedItem className="space-y-3">
  <Button
    onClick={() => navigate('/nft-collection')}
    disabled={dataLoading}
    className="w-full bg-primary hover:bg-primary/90"
    size="lg"
  >
    <Images className="mr-2 h-4 w-4" />
    MINT ZENSOLAR NFTs
    {/* Badge with eligible count passed from RewardActions eligibility state */}
  </Button>
  
  <Button
    onClick={refreshDashboard}
    disabled={dataLoading}
    variant="outline"
    className="w-full"
    size="lg"
  >
    {dataLoading ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <RefreshCw className="mr-2 h-4 w-4" />
    )}
    REFRESH DASHBOARD
  </Button>
</AnimatedItem>
```

**Note**: Since eligibility data is currently in `RewardActions`, we need to either:
- Lift the eligibility state up to ZenSolarDashboard (preferred)
- Or create a simpler version that navigates to collection without showing count

For simplicity, we'll use a streamlined version that links to the collection page.

---

### 2. Remove Duplicate Buttons from RewardActions

**File**: `src/components/dashboard/RewardActions.tsx`

**Remove** (lines 800-878):
- The "MINT ZENSOLAR NFTS" button 
- The "MINT MILESTONE NFTS" button
- The "MINT COMBO NFTS" button  
- The "REFRESH DASHBOARD" button
- Status messages

Keep only the MINT $ZSOLAR TOKENS button and dialogs, since those are triggered via ref from the dashboard.

---

### 3. Fix NFT Card Title to "ZenSolar NFTs"

**File**: `src/components/dashboard/RewardProgress.tsx` (line 232)

**Current**:
```tsx
<h3 className="text-base font-semibold text-foreground">zensolar NFTs</h3>
```

**Change to**:
```tsx
<h3 className="text-base font-semibold text-foreground">ZenSolar NFTs</h3>
```

---

### 4. Replace Tesla Logo with Inline SVG "T" Icon

The current Tesla logo PNG is not rendering well. Replace with an inline SVG of the Tesla "T" icon.

**File**: `src/components/dashboard/ActivityMetrics.tsx`

**Add a TeslaIcon component** at the top:

```tsx
// Tesla "T" icon as inline SVG for crisp rendering
function TeslaIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="currentColor"
    >
      <path d="M50 5C30.5 5 12.5 10.5 5 17.5L50 95L95 17.5C87.5 10.5 69.5 5 50 5ZM50 12C60 12 70 14 77.5 17.5L50 75L22.5 17.5C30 14 40 12 50 12Z" />
    </svg>
  );
}
```

**Replace the logo rendering** (lines 117-141):

```tsx
{/* Connected Provider Logos */}
{filteredProviders.length > 0 && (
  <div className="flex items-center gap-1.5">
    {filteredProviders.map((provider) => (
      <div 
        key={provider}
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          provider === 'tesla' 
            ? "bg-[#E82127] text-white" 
            : "bg-muted/80 border border-border/50"
        )}
        title={provider.charAt(0).toUpperCase() + provider.slice(1)}
      >
        {provider === 'tesla' ? (
          <TeslaIcon className="h-5 w-5" />
        ) : (
          <img 
            src={providerLogos[provider]} 
            alt={provider}
            className="h-4 w-4 object-contain"
          />
        )}
      </div>
    ))}
  </div>
)}
```

This renders a crisp white "T" on a Tesla red background.

---

### 5. Add "Live User View" Toggle to Admin Sidebar

Add a new toggle below "Live Beta Toggle" that allows admins to view the app as a non-admin user would see it.

**File 1**: `src/lib/userViewMode.ts` (NEW FILE)

```tsx
// User view mode management - allows admins to see the app as regular users
const USER_VIEW_KEY = 'zensolar_user_view_mode';

export function getUserViewMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(USER_VIEW_KEY) === 'true';
}

export function setUserViewMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_VIEW_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent('userViewModeChange', { detail: enabled }));
}
```

**File 2**: `src/components/layout/UserViewToggle.tsx` (NEW FILE)

```tsx
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getUserViewMode, setUserViewMode } from "@/lib/userViewMode";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserViewToggleProps {
  collapsed?: boolean;
}

export function UserViewToggle({ collapsed = false }: UserViewToggleProps) {
  const [isUserView, setIsUserView] = useState(getUserViewMode());

  useEffect(() => {
    const handleModeChange = (event: CustomEvent<boolean>) => {
      setIsUserView(event.detail);
    };

    window.addEventListener('userViewModeChange', handleModeChange as EventListener);
    return () => {
      window.removeEventListener('userViewModeChange', handleModeChange as EventListener);
    };
  }, []);

  const handleToggle = (checked: boolean) => {
    setUserViewMode(checked);
    setIsUserView(checked);
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => handleToggle(!isUserView)}
            className={`flex items-center justify-center p-2 rounded-md transition-colors ${
              isUserView 
                ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {isUserView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{isUserView ? "User View ON" : "User View OFF"}</p>
          <p className="text-xs text-muted-foreground">See as regular user</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
      isUserView 
        ? "bg-blue-500/10 border border-blue-500/30" 
        : "bg-muted/50 border border-border"
    }`}>
      <div className="flex items-center gap-2">
        {isUserView ? (
          <Eye className="h-4 w-4 text-blue-500 flex-shrink-0" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <Label 
          htmlFor="user-view-toggle" 
          className={`text-xs font-medium cursor-pointer ${
            isUserView ? "text-blue-500" : "text-muted-foreground"
          }`}
        >
          {isUserView ? "User View ON" : "User View"}
        </Label>
      </div>
      <Switch
        id="user-view-toggle"
        checked={isUserView}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-blue-500"
      />
    </div>
  );
}
```

**File 3**: `src/components/layout/AppSidebar.tsx`

Add import and render after LiveBetaToggle:

```tsx
import { UserViewToggle } from "./UserViewToggle";

// In render, after LiveBetaToggle (line 187-189):
{isAdmin && (
  <div className="px-3 pb-2">
    <LiveBetaToggle collapsed={collapsed} />
    <div className="mt-2">
      <UserViewToggle collapsed={collapsed} />
    </div>
  </div>
)}
```

**File 4**: `src/hooks/useAdminCheck.ts`

Update to respect user view mode:

```tsx
import { getUserViewMode } from '@/lib/userViewMode';

// Inside the hook, modify the return:
// If user view mode is on, return isAdmin as false for UI purposes
const userViewMode = getUserViewMode();
return { isAdmin: userViewMode ? false : isAdmin };
```

Wait - this would affect the sidebar toggle visibility too. Better approach:

Return both `isAdmin` and `isAdminView`:
```tsx
return { 
  isAdmin,  // Always true for real admins (for sidebar toggles)
  isAdminView: userViewMode ? false : isAdmin  // False when user view is on (for content)
};
```

Then use `isAdminView` in dashboard components but `isAdmin` for sidebar toggles.

---

### 6. Fix Mobile Token Price Card Cutoff

**Issue**: On mobile, the dropdown chevron is cut off and the collapsed view shows too much content.

**File**: `src/components/dashboard/TokenPriceCard.tsx`

**Fix 1**: Remove lifetime minted from collapsed view (lines 82-93)

**Current collapsed view shows**:
- Token symbol + price
- Holdings value + token count
- Dropdown chevron

**New collapsed view should show**:
- Token symbol + price  
- Holdings value (USD only, no token count)
- Dropdown chevron (visible)

**Change the collapsed view button layout** (lines 70-96):

```tsx
<button
  onClick={() => setIsCollapsed(false)}
  className="w-full flex items-center justify-between gap-3 group"
>
  <div className="flex items-center gap-2.5 min-w-0">
    <div className="p-1.5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex-shrink-0">
      <Coins className="h-4 w-4 text-primary" />
    </div>
    <span className="font-bold text-foreground">$ZSOLAR</span>
    <span className="text-muted-foreground">|</span>
    <span className="font-bold text-foreground">${tokenPrice.toFixed(2)}</span>
  </div>
  <div className="flex items-center gap-2 flex-shrink-0">
    <motion.span 
      className="font-bold text-eco"
      animate={showPulse ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      ${totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </motion.span>
    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
  </div>
</button>
```

Key changes:
- Removed the token count `({tokensHeld.toLocaleString()})` from collapsed view
- Added `flex-shrink-0` to prevent chevron from being cut off
- Reduced gap from `gap-4` to `gap-3`
- Added `min-w-0` to left side to allow truncation if needed

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/RewardProgress.tsx` | Fix title to "ZenSolar NFTs" |
| `src/components/dashboard/ActivityMetrics.tsx` | Add TeslaIcon SVG component, replace PNG logo |
| `src/components/dashboard/RewardActions.tsx` | Remove NFT buttons and refresh button (keep token mint only) |
| `src/components/dashboard/TokenPriceCard.tsx` | Fix mobile collapsed view, remove token count, ensure chevron visible |
| `src/components/ZenSolarDashboard.tsx` | Add NFT mint button + refresh button below RewardProgress |
| `src/components/demo/DemoDashboard.tsx` | Same changes for demo consistency |
| `src/components/layout/AppSidebar.tsx` | Add UserViewToggle below LiveBetaToggle |
| `src/lib/userViewMode.ts` | NEW - User view mode state management |
| `src/components/layout/UserViewToggle.tsx` | NEW - Toggle component for admin sidebar |
| `src/hooks/useAdminCheck.ts` | Add `isAdminView` return value that respects user view mode |

---

## New Files

### `src/lib/userViewMode.ts`
State management for the "view as user" toggle, using localStorage and custom events for synchronization.

### `src/components/layout/UserViewToggle.tsx`
UI toggle component matching the style of LiveBetaToggle with collapsed/expanded variants.

---

## Visual Layout After Changes

### Dashboard Order:
1. Logo + Welcome Header
2. Token Price Card (collapsed by default)
3. Compact Setup Prompt (if no energy connected)
4. Energy Command Center (with proper Tesla "T" icon)
5. MINT $ZSOLAR TOKENS button (in RewardActions)
6. ZenSolar NFTs card
7. **MINT ZENSOLAR NFTs button** ← Moved here
8. **REFRESH DASHBOARD button** ← Moved here
9. Admin tools (if admin)

### Token Price Card Collapsed (Mobile Fixed):
```
+----------------------------------------------------------+
| 🪙 $ZSOLAR | $0.10                    $0.00       ⌄      |
+----------------------------------------------------------+
```
- Removed token count from collapsed view
- Chevron always visible with flex-shrink-0

### Tesla Logo (Fixed):
```
+-------------------+
|  [Tesla T Icon]   |  ← Crisp white "T" on red background
+-------------------+
```

### Admin Sidebar:
```
+------------------+
|  [ZenSolar Logo] |
+------------------+
|  Live Beta (10x) |  ← Toggle
|  User View       |  ← NEW Toggle
+------------------+
```
