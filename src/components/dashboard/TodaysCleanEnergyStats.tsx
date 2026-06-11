import { Sun, BatteryCharging, Plug, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodaysCleanEnergyStatsProps {
  solarKwh: number;
  batteryKwh: number;
  chargingKwh: number;
  evMiles: number;
  fsdMiles?: number;
}

/**
 * Today's Clean Energy Stats — 2x2 grid that sits between the Tap-to-Mint
 * hero and the Live Energy Monitoring card. Each tile shows today's delta and
 * the $ZSOLAR earned (1 kWh / 1 mi = 1 $ZSOLAR per UI SSOT).
 */
export function TodaysCleanEnergyStats({
  solarKwh,
  batteryKwh,
  chargingKwh,
  evMiles,
  fsdMiles = 0,
}: TodaysCleanEnergyStatsProps) {
  return (
    <section
      aria-label="Today's clean energy stats"
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 sm:p-5"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-foreground">
          Today's Clean Energy Stats
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          1:1 mint
        </span>
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <StatTile
          icon={<Sun className="h-4 w-4 text-solar" />}
          label="Solar Produced"
          value={solarKwh}
          unit="kWh"
          earned={solarKwh}
        />
        <StatTile
          icon={<BatteryCharging className="h-4 w-4 text-energy" />}
          label="Battery Exported"
          value={batteryKwh}
          unit="kWh"
          earned={batteryKwh}
        />
        <StatTile
          icon={<Plug className="h-4 w-4 text-primary" />}
          label="EV Charging"
          value={chargingKwh}
          unit="kWh"
          earned={chargingKwh}
        />
        <StatTile
          icon={<Car className="h-4 w-4 text-accent" />}
          label="EV Mileage"
          value={evMiles}
          unit="mi"
          earned={evMiles}
          chip={fsdMiles > 0 ? `incl. ${fsdMiles.toLocaleString()} FSD mi` : undefined}
        />
      </div>
    </section>
  );
}

function StatTile({
  icon,
  label,
  value,
  unit,
  earned,
  chip,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  earned: number;
  chip?: string;
}) {
  const hasEarned = earned > 0;
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
          {Math.round(value).toLocaleString()}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">{unit}</span>
      </div>
      {chip && (
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">
          {chip}
        </span>
      )}
      <span
        className={cn(
          'text-[10px] font-semibold tabular-nums',
          hasEarned ? 'text-primary' : 'text-muted-foreground/60',
        )}
      >
        {hasEarned ? `+${Math.round(earned).toLocaleString()} $ZSOLAR earned today` : 'No mint yet today'}
      </span>
    </div>
  );
}
