import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { Copy, Check, Database, Zap, BatteryFull, Car, Plug, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

type Status = 'available' | 'partial' | 'missing' | 'planned';

interface DataPoint {
  label: string;
  status: Status;
  notes: string;
}

interface ProviderSection {
  name: string;
  icon: React.ReactNode;
  description: string;
  dataPoints: {
    solar: DataPoint[];
    battery: DataPoint[];
    evCharging: DataPoint[];
    evMiles: DataPoint[];
  };
}

const statusIcon = (s: Status) => {
  switch (s) {
    case 'available': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'partial': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'missing': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'planned': return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

const statusLabel = (s: Status) => {
  switch (s) {
    case 'available': return 'Available';
    case 'partial': return 'Partial';
    case 'missing': return 'Not Implemented';
    case 'planned': return 'Planned';
  }
};

const providers: ProviderSection[] = [
  {
    name: 'Tesla',
    icon: <Zap className="h-5 w-5" />,
    description: 'Primary provider. Covers solar (Powerwall sites), battery (Powerwall), EV miles (vehicles), and EV charging (Supercharger billing + Wall Connector telemetry).',
    dataPoints: {
      solar: [
        { label: 'Lifetime total (solar_energy_exported)', status: 'available', notes: 'From /energy_sites/{id}/calendar_history?kind=energy. Stored in connected_devices.lifetime_totals.solar_wh.' },
        { label: 'Daily granular (energy_production rows)', status: 'available', notes: 'Written to energy_production.production_wh as cumulative pending. useEnergyLog computes day-over-day deltas.' },
        { label: 'Pending since last mint', status: 'available', notes: 'lifetime - baseline. Baseline resets on mint via reset-baselines edge function.' },
      ],
      battery: [
        { label: 'Lifetime total (battery_energy_exported)', status: 'available', notes: 'From /energy_sites/{id}/calendar_history?kind=energy. Stored in connected_devices.lifetime_totals.battery_discharge_wh.' },
        { label: 'Daily granular rows in energy_production', status: 'available', notes: 'tesla-data writes cumulative battery_energy_exported to energy_production with data_type=battery_discharge. useEnergyLog computes day-over-day deltas.' },
        { label: 'Pending since last mint', status: 'available', notes: 'Computed in tesla-data response as pending_battery_discharge_wh.' },
      ],
      evCharging: [
        { label: 'Supercharger kWh (DC charging)', status: 'available', notes: 'From /dx/charging/history (paginated). Sums chargeEnergyAdded or fee-based kWh. Stored in connected_devices.lifetime_totals.charging_kwh.' },
        { label: 'Wall Connector kWh (AC charging)', status: 'partial', notes: 'From /energy_sites/{id}/telemetry_history?kind=charge. Only available if user has a Tesla energy site with Wall Connector. Stored as wall_connector_wh in lifetime_totals.' },
        { label: 'Daily granular rows in energy_production', status: 'available', notes: 'tesla-data writes cumulative EV charging Wh to energy_production with data_type=ev_charging. useEnergyLog computes day-over-day deltas. Includes Supercharger + Wall Connector.' },
        { label: 'Per-session detail', status: 'available', notes: 'Per-session data (location, kWh, fees) stored in charging_sessions table. Exposed on EV Charging tab via expandable "View session details" section.' },
      ],
      evMiles: [
        { label: 'Lifetime odometer', status: 'available', notes: 'From /vehicles/{vin}/vehicle_data (vehicle_state.odometer). Handles asleep vehicles with wake + fallback.' },
        { label: 'Daily granular rows in energy_production', status: 'available', notes: 'tesla-data writes cumulative odometer to energy_production with data_type=ev_miles on each sync. useEnergyLog computes day-over-day deltas for daily miles.' },
        { label: 'Pending since last mint', status: 'available', notes: 'odometer - baseline_odometer. Stored per vehicle.' },
      ],
    },
  },
  {
    name: 'Enphase',
    icon: <Zap className="h-5 w-5" />,
    description: 'Solar-only currently. Uses API v4 /systems/{id}/summary for lifetime + today energy. Has battery telemetry endpoints available but not implemented.',
    dataPoints: {
      solar: [
        { label: 'Lifetime total (energy_lifetime)', status: 'available', notes: 'From /systems/{id}/summary. Stored in connected_devices.lifetime_totals.solar_wh.' },
        { label: 'Daily granular (energy_production rows)', status: 'available', notes: 'energy_today written to energy_production.production_wh each hour. Resets daily (running total). useEnergyLog takes MAX per day.' },
        { label: 'Historical backfill', status: 'available', notes: 'enphase-historical edge function backfills up to 1 year of daily data on first visit to Energy Log.' },
      ],
      battery: [
        { label: 'Battery telemetry', status: 'missing', notes: 'Enphase API v4 has /systems/{id}/telemetry/battery endpoint. Not implemented. Would provide charge/discharge power over time.' },
        { label: 'IQ Battery detection', status: 'missing', notes: 'enphase-devices does not detect battery devices. Would need to check system inventory or /systems/{id}/devices for battery type.' },
      ],
      evCharging: [
        { label: 'N/A', status: 'missing', notes: 'Enphase does not have native EV charger integration. Some users may have third-party chargers on the same circuit but Enphase API does not expose this.' },
      ],
      evMiles: [
        { label: 'N/A', status: 'missing', notes: 'Enphase has no vehicle integration.' },
      ],
    },
  },
  {
    name: 'SolarEdge',
    icon: <Zap className="h-5 w-5" />,
    description: 'Solar-only currently. Uses /site/{id}/overview for lifetime energy. Has battery storage and EV charger endpoints available but not implemented.',
    dataPoints: {
      solar: [
        { label: 'Lifetime total (lifeTimeData.energy)', status: 'available', notes: 'From /site/{id}/overview. Stored in connected_devices.lifetime_totals.solar_wh.' },
        { label: 'Daily granular (energy_production rows)', status: 'available', notes: 'todayEnergy (lastDayData.energy) written to energy_production.production_wh each hour.' },
      ],
      battery: [
        { label: 'Storage data', status: 'missing', notes: 'SolarEdge API has /site/{id}/storageData endpoint for battery charge/discharge history. Not implemented.' },
        { label: 'Current power flow', status: 'partial', notes: '/site/{id}/currentPowerFlow is fetched and includes real-time battery status (charge/discharge power) but not persisted for historical use.' },
      ],
      evCharging: [
        { label: 'EV charger data', status: 'missing', notes: 'SolarEdge has /site/{id}/evCharger endpoints for compatible EV chargers. Not implemented.' },
      ],
      evMiles: [
        { label: 'N/A', status: 'missing', notes: 'SolarEdge has no vehicle integration.' },
      ],
    },
  },
  {
    name: 'Wallbox',
    icon: <Plug className="h-5 w-5" />,
    description: 'EV charging only. Uses /v4/sessions/stats for session-level data and /chargers/status for cumulative energy.',
    dataPoints: {
      solar: [
        { label: 'N/A', status: 'missing', notes: 'Wallbox is a charger-only provider.' },
      ],
      battery: [
        { label: 'N/A', status: 'missing', notes: 'Wallbox is a charger-only provider.' },
      ],
      evCharging: [
        { label: 'Lifetime total (session sum)', status: 'available', notes: 'From /v4/sessions/stats summing all session energies. Stored in connected_devices.lifetime_totals.charging_kwh.' },
        { label: 'Daily granular rows in energy_production', status: 'available', notes: 'wallbox-data writes daily actual Wh from session aggregates to energy_production with data_type=ev_charging. useEnergyLog uses MAX per day (non-cumulative, like Enphase).' },
        { label: 'Per-session detail', status: 'available', notes: 'Per-session data (kWh, location, cost, duration) stored in charging_sessions table. Exposed on EV Charging tab.' },
      ],
      evMiles: [
        { label: 'N/A', status: 'missing', notes: 'Wallbox does not track miles. Added range is reported but unreliable.' },
      ],
    },
  },
];

const schemaSection = `
## Database Schema: energy_production

| Column | Type | Usage |
|--------|------|-------|
| production_wh | numeric | Solar production (Wh). Enphase: daily running total. Tesla: cumulative pending since mint. |
| consumption_wh | numeric | Intended for consumption/charging but currently always 0 for Tesla/Enphase. Wallbox writes cumulative lifetime here. |
| device_id | text | Links to connected_devices.device_id. Use device_type from connected_devices to determine data category. |
| provider | text | 'tesla', 'enphase', 'solaredge', 'wallbox' |
| recorded_at | timestamptz | Hourly timestamps for granular tracking |

### Key Gaps
1. **No battery export column** — battery data is only in connected_devices.lifetime_totals
2. **No EV charging daily data** — charging kWh only stored as lifetime snapshots
3. **No EV miles daily data** — odometer only stored as lifetime snapshot per sync
4. **consumption_wh semantics are inconsistent** — Wallbox writes cumulative lifetime, others write 0

## Differentiation Strategy
Use \`connected_devices.device_type\` (normalized via deviceTypeNormalizer.ts) to determine what kind of data a device_id represents:
- solar / solar_system → Solar production
- powerwall / battery → Battery discharge
- vehicle → EV miles + EV charging (Supercharger)
- wall_connector / home_charger → EV charging (home)

## Energy Log Calculation (useEnergyLog.ts)
Currently only handles solar:
- **Enphase/SolarEdge**: MAX(production_wh) per device per day = daily production
- **Tesla**: Day-over-day delta of MAX(production_wh) per device = daily production (cumulative counter)
- Provider priority: If Enphase/SolarEdge exists, Tesla solar data is skipped (avoids double-counting Powerwall solar)

## Recent Changes
- **data_type column** added to energy_production (solar, battery_discharge, ev_charging). Unique constraint updated.
- **tesla-data** now writes battery_discharge + ev_charging rows on each sync.
- **tesla-historical** backfill edge function: fetches calendar_history (solar+battery) + charging sessions, seeds energy_production on first Energy Log visit.
- **useEnergyLog** filters by data_type per active tab, computing day-over-day deltas for Tesla cumulative data.
- **tesla-data** now writes ev_miles (odometer) rows on each sync. useEnergyLog computes daily miles via day-over-day deltas.
- **enphase-data, solaredge-data, wallbox-data** updated for data_type column compatibility.
- **charging_sessions table** added for per-session EV charging detail (location, kWh, fees). Written by tesla-data, tesla-historical, and wallbox-data.
- **wallbox-data** now writes proper daily granular rows (one per day with actual daily Wh) instead of a single cumulative row. Also writes per-session records.
- **ChargingSessionList component** added to EV Charging tab with expandable session detail view.

## Remaining Next Steps
1. Build SolarEdge/Enphase battery support when users request it
`;

export default function EnergyDataArchitecture() {
  const [copied, setCopied] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>('Tesla');

  const copyAll = () => {
    let text = '# Energy Data Architecture — Living Document\n\n';
    text += `Last updated: ${new Date().toLocaleDateString()}\n\n`;

    for (const provider of providers) {
      text += `## ${provider.name}\n${provider.description}\n\n`;
      for (const [category, points] of Object.entries(provider.dataPoints)) {
        text += `### ${category}\n`;
        for (const point of points) {
          text += `- [${statusLabel(point.status)}] **${point.label}**: ${point.notes}\n`;
        }
        text += '\n';
      }
    }

    text += schemaSection;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied full architecture doc');
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    { key: 'solar', label: 'Solar', icon: <Zap className="h-3.5 w-3.5" /> },
    { key: 'battery', label: 'Battery', icon: <BatteryFull className="h-3.5 w-3.5" /> },
    { key: 'evCharging', label: 'EV Charging', icon: <Plug className="h-3.5 w-3.5" /> },
    { key: 'evMiles', label: 'EV Miles', icon: <Car className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <AnimatedContainer className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-6 space-y-4">
      <AnimatedItem className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Energy Data Architecture</h1>
        </div>
        <Button variant="outline" size="sm" onClick={copyAll}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? 'Copied' : 'Copy All'}
        </Button>
      </AnimatedItem>

      <AnimatedItem>
        <p className="text-sm text-muted-foreground">
          Living document tracking data availability across providers for the Energy Log. Auto-maintained by Lovable — updated with every data pipeline change.
        </p>
      </AnimatedItem>

      {/* Legend */}
      <AnimatedItem>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1">{statusIcon('available')} Available</span>
          <span className="flex items-center gap-1">{statusIcon('partial')} Partial</span>
          <span className="flex items-center gap-1">{statusIcon('missing')} Not Implemented</span>
          <span className="flex items-center gap-1">{statusIcon('planned')} Planned</span>
        </div>
      </AnimatedItem>

      {/* Provider Cards */}
      {providers.map((provider) => (
        <AnimatedItem key={provider.name}>
          <Card className="bg-card border-border/50">
            <CardHeader
              className="cursor-pointer pb-2"
              onClick={() => setExpandedProvider(expandedProvider === provider.name ? null : provider.name)}
            >
              <CardTitle className="flex items-center gap-2 text-base">
                {provider.icon}
                {provider.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{provider.description}</p>
            </CardHeader>
            {expandedProvider === provider.name && (
              <CardContent className="pt-0 space-y-3">
                {categories.map(({ key, label, icon }) => {
                  const points = provider.dataPoints[key];
                  if (points.length === 1 && points[0].label === 'N/A') {
                    return (
                      <div key={key} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {icon} {label}: N/A
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {icon} {label}
                      </div>
                      {points.map((point, i) => (
                        <div key={i} className="flex items-start gap-2 pl-5 text-xs">
                          {statusIcon(point.status)}
                          <div>
                            <span className="font-medium text-foreground">{point.label}</span>
                            <p className="text-muted-foreground mt-0.5">{point.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        </AnimatedItem>
      ))}

      {/* Schema Section */}
      <AnimatedItem>
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5" />
              Schema & Computation Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm prose-invert max-w-none">
            <pre className="text-xs bg-muted/30 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
              {schemaSection.trim()}
            </pre>
          </CardContent>
        </Card>
      </AnimatedItem>
    </AnimatedContainer>
  );
}
