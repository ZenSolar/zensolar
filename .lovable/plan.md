
# Dashboard UI/UX Redesign Plan

## Problem Analysis

The current dashboard has several areas taking up prime real estate that could be better organized:

1. **ConnectWallet** - Full card at the top of dashboard
2. **ConnectAccounts** (Energy) - Another full card
3. **ConnectSocialAccounts** - Third account connection card
4. **GettingStartedGuide** - Large onboarding wizard (already hides after energy connected)
5. **HowItWorks** - Educational content (already hides after energy connected)

These setup/account management sections push the **most important content** (ActivityMetrics with live energy stats) far down the page.

---

## Proposed Information Architecture

### Dashboard Focus: "Energy Command Center"
The dashboard should answer: **"What's my energy doing right now, and what can I earn?"**

**New Dashboard Priority Order:**
1. Welcome header with logo
2. Token Price Card (current portfolio value)
3. **"Energy Command Center"** (renamed from "Current Activity") - THE HERO SECTION
4. Pending Rewards (what you can mint NOW)
5. Reward Actions (mint button)
6. NFT Milestones progress
7. (Admin tools if admin)

### Move to Profile/Settings:
- Wallet connection management
- Energy account connections
- Social account connections

### Sidebar Quick Access:
- Add compact connection status indicators to the Account section

---

## Detailed Changes

### 1. Rename "Current Activity" to "Energy Command Center"

Gamification-focused alternatives considered:
- **"Energy Command Center"** - Makes user feel in control, like a mission control
- **"Power Station"** - Your personal energy hub
- **"Energy Arena"** - Where the action happens
- **"Your Energy Matrix"** - Sci-fi vibes

**Recommendation: "Energy Command Center"** - It feels empowering and game-like while still being descriptive.

### 2. Add Provider Logos to Activity Metrics

Show which providers are feeding data into each metric category. This keeps users aware of their connected accounts without needing a separate section.

**Visual Design:**
```
+------------------------------------------+
|  ⚡ Energy Command Center                 |
|  [Tesla logo] [Enphase logo] Connected   |
+------------------------------------------+
|  ☀️ Solar: 1,234 kWh    [Enphase logo]   |
|  🚗 EV Miles: 567 mi    [Tesla logo]     |
|  🔋 Battery: 89 kWh     [Tesla logo]     |
|  ⚡ Charging: 234 kWh   [Tesla logo]     |
+------------------------------------------+
```

### 3. Move Connection Management Off Dashboard

**Option A: Move to Profile Page**
- Profile already displays connected accounts (read-only badges)
- Add edit/connect functionality to the existing cards
- Natural place for "account management"

**Option B: Move to Settings Page**
- Settings is for "configuration"
- Add new "Connected Accounts" section

**Recommendation: Move to Profile Page**
- Profile shows "who you are" (identity + accounts)
- Add "Manage" buttons to existing provider cards
- Profile becomes the hub for all account management

### 4. Streamlined Dashboard for Returning Users

For users with accounts already connected:

```
+------------------------------------------+
|           [ZenSolar Logo]                 |
|        Welcome, [FirstName]              |
|  Earn $ZSOLAR tokens from clean energy   |
+------------------------------------------+

+------------------------------------------+
|  💰 $ZSOLAR Token                        |
|  $0.23 price  |  $287.50 Your Holdings   |
|  1,250 tokens minted to wallet           |
+------------------------------------------+

+------------------------------------------+
|  ⚡ ENERGY COMMAND CENTER                 |
|  Connected: [Tesla] [Enphase]    🔄 2m   |
+------------------------------------------+
|  ☀️ 1,234 kWh  🚗 567 mi                 |
|  🔋 89 kWh     ⚡ 234 kWh                |
+------------------------------------------+

+------------------------------------------+
|  🎯 PENDING REWARDS                       |
|  2,124 $ZSOLAR ready to mint             |
|  [MINT ALL] button                       |
+------------------------------------------+

+------------------------------------------+
|  📈 NFT Milestones                       |
|  [Progress tabs...]                      |
+------------------------------------------+
```

### 5. New User Experience (No Accounts Connected)

Keep the GettingStartedGuide but make it more compact and action-focused:

```
+------------------------------------------+
|  🚀 Get Started                          |
|  Connect an energy account to begin      |
|  [Connect Tesla] [Connect Enphase] ...   |
+------------------------------------------+
```

After connection, this disappears and the full Command Center appears.

---

## Technical Implementation

### Files to Modify:

1. **`src/components/ZenSolarDashboard.tsx`**
   - Remove `ConnectWallet`, `ConnectAccounts`, `ConnectSocialAccounts` components from main render
   - Keep `GettingStartedGuide` for new users (already conditionally hidden)
   - Reorder remaining components for better priority

2. **`src/components/dashboard/ActivityMetrics.tsx`**
   - Rename "Current Activity" to "Energy Command Center"
   - Add `connectedProviders` prop to show provider logos
   - Add compact provider logo display in the header

3. **`src/pages/Profile.tsx`**
   - Convert read-only provider cards to actionable cards
   - Add "Connect"/"Disconnect" buttons to each provider
   - Add wallet connection/disconnection UI
   - Add social accounts management section

4. **`src/components/layout/AppSidebar.tsx`** (optional enhancement)
   - Add small connection status indicators next to Profile menu item
   - Show green dots or provider count

5. **Create new component: `src/components/dashboard/CompactSetupPrompt.tsx`**
   - Minimal prompt for users without connected accounts
   - "Connect an energy account to start earning" with quick action buttons

6. **Create: `src/components/profile/ManageEnergyAccounts.tsx`**
   - Extracted account management UI for Profile page
   - Reuses existing ConnectAccounts logic

7. **Create: `src/components/profile/ManageWallet.tsx`**
   - Extracted wallet management UI for Profile page
   - Reuses existing ConnectWallet logic

---

## Summary of Benefits

| Before | After |
|--------|-------|
| 3 account connection cards on dashboard | Energy stats front and center |
| "Current Activity" (boring name) | "Energy Command Center" (gamified) |
| No provider logos in activity view | Provider logos show data sources |
| Account management scattered | All account management on Profile |
| Setup takes prime dashboard space | Compact setup prompt for new users |

---

## Questions Resolved

- **Where to move connections?** Profile page (identity + accounts hub)
- **What title for activity area?** "Energy Command Center"
- **How to show connected providers?** Logos in the Energy Command Center header

