

# Dashboard UI/UX Improvements Plan

## Issues Identified

### 1. Dashboard Component Order is Wrong
Looking at `ActivityMetrics.tsx`, the order is currently:
1. **Rewards Summary** (lines 148-224)
2. **Pending Rewards** (lines 226-399)  
3. **Energy Command Center** (lines 401-463)

This is inverted from what we want. The Energy Command Center should be the HERO section.

### 2. Collapsible Token Price Card
The `TokenPriceCard` component needs to support a collapsed state showing just the live price and total holdings in a compact single row.

### 3. Merge Pending Rewards into Energy Command Center
Currently there are three separate sections. We'll consolidate to:
- "Tap to mint" on each energy category card
- Change "Total Activity Units" to "Total Available Tokens"
- Remove the separate "Pending Rewards" card

### 4. Add Dashboard Link to Logo in TopNav
The ZenSolar logo in `TopNav.tsx` needs to be clickable and navigate to `/` (dashboard).

### 5. Remove LiveBetaIndicator from Admin Sidebar Section
In `AppSidebar.tsx` line 251, `<LiveBetaIndicator collapsed={collapsed} />` is shown next to the "Admin" label. This should be removed since the toggle at the top of the sidebar is sufficient.

### 6. Add Google Sign-In
Integrate Google OAuth into the Auth page using Lovable Cloud's managed authentication.

---

## Technical Implementation

### File: `src/components/dashboard/TokenPriceCard.tsx`

**Changes:**
- Add `isCollapsed` state (default: true to save space)
- Add ChevronDown/ChevronUp toggle button
- When collapsed: Show single row with "$0.23 | $287.50 (1,250 tokens)"
- When expanded: Show current full layout

```
Collapsed State:
+------------------------------------------+
| $ZSOLAR  |  $0.23  |  $287.50 (1,250) ▼  |
+------------------------------------------+

Expanded State (current layout):
+------------------------------------------+
| $ZSOLAR Token                    Live ▲  |
| Token Price         Your Holdings        |
| $0.23               $287.50              |
| (Click to edit)     1,250 tokens         |
+------------------------------------------+
```

### File: `src/components/dashboard/ActivityMetrics.tsx`

**Changes:**
1. **Remove "Rewards Summary" section** (lines 148-224) - This duplicates info and clutters the dashboard
2. **Rename "Pending Rewards" to "Energy Command Center"** and make it THE hero section
3. **Remove the current "Energy Command Center" section** (lines 401-463) - Merge its content into the new hero
4. **Add provider logos** to the hero section header
5. **Change "Total Activity Units" to "Total Available Tokens"**
6. **Keep "Tap to mint"** functionality on each category card (already implemented)
7. **Move "Lifetime Minted" link to the hero section** (compact, at bottom)

**New Structure:**
```
+------------------------------------------+
| ⚡ ENERGY COMMAND CENTER     [Tesla][📡] |
| Connected: Tesla, Enphase        🔄 2m   |
+------------------------------------------+
|  ☀️ 1,234 kWh    🚗 567 mi              |
|  Solar (tap)     EV Miles (tap)         |
+------------------------------------------+
|  🔋 89 kWh       ⚡ 234 kWh              |
|  Battery (tap)   Charging (tap)         |
+------------------------------------------+
| 💰 Total Available Tokens: 2,124 $ZSOLAR |
| ≈ $212.40 USD @ $0.10/token             |
| [MINT ALL]                              |
+------------------------------------------+
| NFTs: 12/42  |  Lifetime: 15,234 tokens |
+------------------------------------------+
```

### File: `src/components/layout/TopNav.tsx`

**Changes:**
- Wrap the logo `<img>` in a `<Link to="/">` component
- Add cursor pointer and hover effects

```tsx
<Link to="/" className="hover:opacity-80 transition-opacity">
  <img 
    src={zenLogo} 
    alt="ZenSolar" 
    className="h-7 w-auto object-contain dark:animate-logo-glow"
  />
</Link>
```

### File: `src/components/layout/AppSidebar.tsx`

**Changes:**
- Remove `<LiveBetaIndicator collapsed={collapsed} />` from line 251
- The Admin section label will just show "Admin" without the indicator badge

Before:
```tsx
<SidebarGroupLabel className="flex items-center gap-2">
  Admin
  <LiveBetaIndicator collapsed={collapsed} />
</SidebarGroupLabel>
```

After:
```tsx
<SidebarGroupLabel>Admin</SidebarGroupLabel>
```

### File: `src/pages/Auth.tsx`

**Changes:**
- Add Google Sign-In button using Lovable Cloud's managed OAuth
- Import lovable module: `import { lovable } from "@/integrations/lovable/index"`
- Add Google button below the email/password forms (both login and signup tabs)
- Add divider "or continue with"

**UI Addition (after each form, before "Try Demo Mode"):**

```tsx
{/* Social Login Divider */}
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-white/10" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-[#0a1628] px-2 text-slate-500">or continue with</span>
  </div>
</div>

{/* Google Sign In Button */}
<Button
  type="button"
  variant="outline"
  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
  onClick={handleGoogleSignIn}
  disabled={isLoading}
>
  <GoogleIcon className="mr-2 h-4 w-4" />
  Continue with Google
</Button>
```

**Handler:**
```tsx
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (error) {
    toast.error("Failed to sign in with Google");
    setIsLoading(false);
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/TokenPriceCard.tsx` | Add collapsible functionality with compact collapsed view |
| `src/components/dashboard/ActivityMetrics.tsx` | Complete restructure - merge sections into single "Energy Command Center" hero |
| `src/components/layout/TopNav.tsx` | Wrap logo in Link to "/" |
| `src/components/layout/AppSidebar.tsx` | Remove LiveBetaIndicator from Admin label |
| `src/pages/Auth.tsx` | Add Google Sign-In button and handler |

---

## Summary of User-Facing Changes

1. **Token Price Card** - Now collapsible, showing compact "$0.23 | $287.50" when collapsed
2. **Dashboard Order** - Energy Command Center is now THE hero section immediately below token price
3. **Merged UI** - No more separate "Rewards Summary" and "Pending Rewards" cards - everything unified
4. **Tap to Mint** - Each energy category card is tappable to mint that category
5. **Total Available Tokens** - Replaces "Total Activity Units" label
6. **Logo Navigation** - Tap the ZenSolar logo in header to return to dashboard
7. **Cleaner Admin Menu** - No more "Mainnet Mode" badge next to Admin label
8. **Google Sign-In** - New social login option on registration/login page

