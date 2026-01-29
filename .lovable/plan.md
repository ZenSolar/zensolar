

# Energy Command Center - Clean Single-Column Redesign

## The Goal

Transform the current 2-column grid layout into the cleaner full-width single-column design shown in your screenshot, while keeping all the merged functionality (tap-to-mint, Total Available Tokens, etc.).

---

## Key Design Changes

### Current Layout (2-column grid)
```
+------------------------------------------+
| ⚡ Energy Command Center    [Tesla] MINT |
+------------------------------------------+
| [Solar]      [EV Miles]                  |
| 1,234 kWh    567 mi                      |
+------------------------------------------+
| [Battery]    [Charging]                  |
| 89 kWh       234 kWh                     |
+------------------------------------------+
```

### Target Layout (Single-column, screenshot style)
```
+------------------------------------------+
| ⚡ Energy Command Center    [Tesla] MINT |
| Last updated 2:45 PM                     |
+------------------------------------------+
| [☀️]  Tesla Solar Roof Energy Produced   |
|       3,854 kWh                      [→] |
+------------------------------------------+
| [🚗]  Model Y Long Range Miles Driven    |
|       7,360 mi                       [→] |
+------------------------------------------+
| [🔋]  Powerwall 2 Energy Discharged      |
|       965 kWh                        [→] |
+------------------------------------------+
| [⚡]  Tesla Supercharger                  |
|       268 kWh                        [→] |
+------------------------------------------+
| [⚡]  Wall Connector Home Charging        |
|       1,238 kWh                      [→] |
+------------------------------------------+
| [💰]  Total Available Tokens             |
|       2,124 $ZSOLAR · ≈$212.40       [→] |
+------------------------------------------+
| NFTs: 12/42  |  Lifetime: 15,234 tokens  |
+------------------------------------------+
```

---

## Technical Changes

### 1. Card Layout - Full Width Single Column

**Before:**
```tsx
<div className="grid grid-cols-2 gap-2">
  <ActivityField ... />
  <ActivityField ... />
</div>
```

**After:**
```tsx
<div className="space-y-2">
  <ActivityField ... />
  <ActivityField ... />
</div>
```

### 2. ActivityField Component - New Design

Replace the current compact layout with a clean horizontal card:

```tsx
function ActivityField({
  icon: Icon,
  label,        // Device-specific: "Tesla Solar Roof Energy Produced"
  value,
  unit,
  color,
  active,
  onTap,
}: ActivityFieldProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      onClick={onTap}
      whileTap={onTap ? { scale: 0.98 } : undefined}
      className={cn(
        "p-3 rounded-xl border transition-all flex items-center gap-3",
        active && onTap 
          ? "cursor-pointer border-border/50 bg-card hover:bg-muted/30" 
          : "border-border/50 bg-muted/30"
      )}
    >
      {/* Large rounded icon square */}
      <div className={cn("p-3 rounded-xl", styles.solidBg)}>
        <Icon className={cn("h-5 w-5", styles.iconColor)} />
      </div>
      
      {/* Label + Value */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold text-foreground">
          {value.toLocaleString()}
          <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
      
      {/* Tap indicator */}
      {active && onTap && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </motion.div>
  );
}
```

### 3. Color Styles - Solid Backgrounds (Like Screenshot)

```tsx
const colorStyles = {
  amber: { 
    solidBg: 'bg-amber-500',        // Solid background
    iconColor: 'text-white',         // White icon
  },
  blue: { 
    solidBg: 'bg-blue-500', 
    iconColor: 'text-white',
  },
  emerald: { 
    solidBg: 'bg-emerald-500', 
    iconColor: 'text-white',
  },
  purple: { 
    solidBg: 'bg-purple-500', 
    iconColor: 'text-white',
  },
  olive: { 
    solidBg: 'bg-yellow-600',        // For charging (matches screenshot)
    iconColor: 'text-white',
  },
  teal: { 
    solidBg: 'bg-teal-500',          // For CO2 offset
    iconColor: 'text-white',
  },
};
```

### 4. Device-Specific Labels

Pass `deviceLabels` through to ActivityMetrics and use them for dynamic labels:

```tsx
// In ZenSolarDashboard.tsx - pass deviceLabels
<ActivityMetrics
  data={activityData}
  deviceLabels={activityData.deviceLabels}  // Already available
  ...
/>

// In ActivityMetrics - use device labels for field labels
const solarLabel = deviceLabels?.solar 
  ? `${deviceLabels.solar} Energy Produced` 
  : 'Solar Energy Produced';

const evLabel = deviceLabels?.vehicle 
  ? `${deviceLabels.vehicle} Miles Driven` 
  : 'EV Miles Driven';

const batteryLabel = deviceLabels?.powerwall 
  ? `${deviceLabels.powerwall} Energy Discharged` 
  : 'Battery Discharged';

// For charging - show separate fields if we have both supercharger and home
const superchargerLabel = 'Tesla Supercharger';
const homeChargerLabel = deviceLabels?.wallConnector 
  ? `${deviceLabels.wallConnector} Home Charging` 
  : 'Home Charging';
```

### 5. Split Charging into Separate Fields (Like Screenshot)

The screenshot shows Tesla Supercharger and Wall Connector as separate rows. Update to show them separately when both have values:

```tsx
{/* Charging - show supercharger and home separately if data exists */}
{(current.superchargerKwh > 0) && (
  <ActivityField
    icon={Zap}
    label="Tesla Supercharger"
    value={current.superchargerKwh}
    unit="kWh"
    color="olive"
    active={current.superchargerKwh > 0}
    onTap={onMintCategory ? () => onMintCategory('supercharger') : undefined}
  />
)}
{(current.homeChargerKwh > 0) && (
  <ActivityField
    icon={Zap}
    label={homeChargerLabel}
    value={current.homeChargerKwh}
    unit="kWh"
    color="olive"
    active={current.homeChargerKwh > 0}
    onTap={onMintCategory ? () => onMintCategory('home_charger') : undefined}
  />
)}
{/* Fallback combined charging if neither has specific data */}
{current.superchargerKwh === 0 && current.homeChargerKwh === 0 && current.chargingKwh > 0 && (
  <ActivityField
    icon={Zap}
    label="EV Charging"
    value={current.chargingKwh}
    unit="kWh"
    color="purple"
    active={current.chargingKwh > 0}
    onTap={onMintCategory ? () => onMintCategory('charging') : undefined}
  />
)}
```

### 6. Total Available Tokens - Same Card Style

Make Total Available Tokens match the activity field design:

```tsx
<motion.div
  onClick={() => onMintCategory?.('all')}
  whileTap={{ scale: 0.98 }}
  className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3 cursor-pointer"
>
  <div className="p-3 rounded-xl bg-primary">
    <Coins className="h-5 w-5 text-primary-foreground" />
  </div>
  <div className="flex-1">
    <p className="text-sm text-muted-foreground">Total Available Tokens</p>
    <p className="text-xl font-bold text-foreground">
      {tokensToReceive.toLocaleString()}
      <span className="text-base font-normal text-muted-foreground ml-1">$ZSOLAR</span>
    </p>
    <p className="text-xs text-primary">≈ ${(tokensToReceive * tokenPrice).toFixed(2)}</p>
  </div>
  <ChevronRight className="h-5 w-5 text-muted-foreground" />
</motion.div>
```

---

## Props Updates

### CurrentActivity Type

Add separate supercharger and home charger values:

```tsx
type CurrentActivity = {
  solarKwh: number;
  evMiles: number;
  batteryKwh: number;
  chargingKwh: number;        // Combined total
  superchargerKwh?: number;   // Tesla Supercharger only
  homeChargerKwh?: number;    // Home Charger only
};
```

### ZenSolarDashboard.tsx

Update to pass the separate values:

```tsx
const currentActivity = {
  solarKwh: Math.max(0, Math.floor(activityData.pendingSolarKwh || 0)),
  evMiles: Math.max(0, Math.floor(activityData.pendingEvMiles || 0)),
  batteryKwh: Math.max(0, Math.floor(activityData.pendingBatteryKwh || 0)),
  chargingKwh: Math.max(0, Math.floor(activityData.pendingChargingKwh || 0)),
  superchargerKwh: Math.max(0, Math.floor(activityData.pendingSuperchargerKwh || 0)),
  homeChargerKwh: Math.max(0, Math.floor(activityData.pendingHomeChargerKwh || 0)),
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ActivityMetrics.tsx` | Complete redesign: single-column layout, solid color icon backgrounds, device-specific labels, separate charging fields |
| `src/components/ZenSolarDashboard.tsx` | Pass `superchargerKwh` and `homeChargerKwh` separately in `currentActivity` |
| `src/components/demo/DemoDashboard.tsx` | Same updates as ZenSolarDashboard for consistency |

---

## Visual Comparison

| Element | Current | New (Screenshot Style) |
|---------|---------|------------------------|
| Layout | 2-column grid | Single-column stack |
| Icons | Small, transparent bg | Large, solid colored square |
| Labels | Generic ("Solar Produced") | Device-specific ("Tesla Solar Roof Energy Produced") |
| Charging | Combined single field | Separate Supercharger + Home Charger rows |
| Card size | Compact, cramped | Full-width, breathable |
| Tap indicator | Subtle chevron | Clear right chevron |

This design is cleaner, more scannable, and shows users exactly which devices are generating their rewards. The Tesla-style minimal aesthetic with solid color icons and generous whitespace creates a premium feel.

