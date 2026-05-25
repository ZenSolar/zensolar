import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Leaf, TreePine, Sun, BatteryCharging, Zap, Home, ChevronRight, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ActivityData,
  CO2Breakdown,
  calculateCO2Breakdown,
  EPA_CO2_LBS_PER_KWH,
  CO2_LBS_PER_GAS_MILE,
  EV_KWH_PER_MILE,
} from '@/types/dashboard';

interface CO2OffsetCardProps {
  /** Full activity data — used to compute per-activity CO₂ breakdown. */
  activityData?: ActivityData;
  /** Legacy: lifetime CO2 offset in pounds. Used as fallback when activityData is absent. */
  co2Pounds?: number;
  isLoading?: boolean;
  className?: string;
}

const LBS_PER_TON = 2000;
const LBS_PER_TREE_YEAR = 48;

type CategoryKey = 'solar' | 'battery' | 'supercharger' | 'home_charger';

interface CategoryMeta {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  icon: typeof Sun;
  accentClass: string;
  iconBgClass: string;
  iconTextClass: string;
  barBgClass: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'solar',
    label: 'Solar',
    shortLabel: 'Solar',
    icon: Sun,
    accentClass: 'border-l-amber-400/70',
    iconBgClass: 'bg-amber-400/15',
    iconTextClass: 'text-amber-400',
    barBgClass: 'bg-amber-400',
  },
  {
    key: 'battery',
    label: 'Battery',
    shortLabel: 'Battery',
    icon: BatteryCharging,
    accentClass: 'border-l-primary/70',
    iconBgClass: 'bg-primary/15',
    iconTextClass: 'text-primary',
    barBgClass: 'bg-primary',
  },
  {
    key: 'supercharger',
    label: 'Tesla Supercharging',
    shortLabel: 'Supercharger',
    icon: Zap,
    accentClass: 'border-l-destructive/70',
    iconBgClass: 'bg-destructive/15',
    iconTextClass: 'text-destructive',
    barBgClass: 'bg-destructive',
  },
  {
    key: 'home_charger',
    label: 'Home Charging',
    shortLabel: 'Home Charger',
    icon: Home,
    accentClass: 'border-l-eco/70',
    iconBgClass: 'bg-eco/15',
    iconTextClass: 'text-eco',
    barBgClass: 'bg-eco',
  },
];

function formatTons(lbs: number): string {
  const tons = lbs / LBS_PER_TON;
  if (tons >= 100) return tons.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (tons >= 1) return tons.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return tons.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function lbsOf(breakdown: CO2Breakdown, key: CategoryKey): number {
  if (key === 'solar') return breakdown.solarLbs;
  if (key === 'battery') return breakdown.batteryLbs;
  if (key === 'supercharger') return breakdown.evSuperchargerLbs;
  return breakdown.evHomeChargerLbs;
}

const EMPTY_BREAKDOWN = (totalLbs: number): CO2Breakdown => ({
  solarLbs: totalLbs,
  batteryLbs: 0,
  evLbs: 0,
  evSuperchargerLbs: 0,
  evHomeChargerLbs: 0,
  totalLbs,
  inputs: {
    solarKwh: 0,
    batteryKwh: 0,
    evMiles: 0,
    evKwhUsed: 0,
    evGasBaselineLbs: 0,
    evElectricityEmissionsLbs: 0,
    superchargerKwh: 0,
    homeChargerKwh: 0,
  },
});

export function CO2OffsetCard({ activityData, co2Pounds, isLoading, className }: CO2OffsetCardProps) {
  const [openCategory, setOpenCategory] = useState<CategoryKey | null>(null);

  if (isLoading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-l-2 border-l-primary/60 bg-gradient-to-br from-eco/10 to-primary/5',
          className,
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
          <div className="h-9 w-40 rounded bg-muted/50 animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const breakdown: CO2Breakdown = activityData
    ? calculateCO2Breakdown(activityData)
    : EMPTY_BREAKDOWN(co2Pounds ?? 0);

  const totalLbs = breakdown.totalLbs;
  const treeYears = Math.max(0, Math.round(totalLbs / LBS_PER_TREE_YEAR));

  const activeCategory = openCategory ? CATEGORIES.find((c) => c.key === openCategory) : null;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden border-l-2 border-l-primary bg-gradient-to-br from-eco/10 via-primary/5 to-transparent transition-colors hover:border-l-primary/80',
          className,
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco/20 text-eco shrink-0">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Lifetime CO₂ Offset
              </p>
              <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-foreground">
                {formatTons(totalLbs)}
                <span className="ml-1.5 text-base font-semibold text-muted-foreground">tons</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {totalLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs avoided
                </span>
                <span className="inline-flex items-center gap-1">
                  <TreePine className="h-3 w-3 text-eco" />
                  ≈ {treeYears.toLocaleString()} tree-years
                </span>
              </div>
            </div>
          </div>

          {/* 2x2 grid — drillable */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => {
              const lbs = lbsOf(breakdown, cat.key);
              const pct = totalLbs > 0 ? Math.round((lbs / totalLbs) * 100) : 0;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setOpenCategory(cat.key)}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border border-border/60 border-l-2 bg-card/40 p-2.5 text-left transition-all hover:bg-card/70 hover:border-border active:scale-[0.98]',
                    cat.accentClass,
                  )}
                  aria-label={`${cat.label} CO₂ offset breakdown`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-md',
                        cat.iconBgClass,
                        cat.iconTextClass,
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">
                    {cat.shortLabel}
                  </p>
                  <p className="mt-0.5 text-base font-bold leading-none tabular-nums text-foreground">
                    {formatTons(lbs)}
                    <span className="ml-1 text-[10px] font-medium text-muted-foreground">t</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {pct}% of total
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className={cn('h-full rounded-full', cat.barBgClass)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* EV miles summary — full width, biggest contributor */}
          {breakdown.inputs.evMiles > 0 && (
            <div className="mt-2 rounded-lg border border-border/60 border-l-2 border-l-eco/70 bg-gradient-to-r from-eco/10 via-card/40 to-card/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-eco/15 text-eco shrink-0">
                  <Car className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    EV Miles Driven (Lifetime)
                  </p>
                  <div className="mt-0.5 flex items-baseline gap-2 flex-wrap">
                    <p className="text-xl font-bold leading-none tabular-nums text-foreground">
                      {breakdown.inputs.evMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="ml-1 text-xs font-medium text-muted-foreground">mi</span>
                    </p>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      = {formatTons(breakdown.evLbs)} t CO₂ avoided
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={!!openCategory} onOpenChange={(o) => !o && setOpenCategory(null)}>
        <DrawerContent>
          {activeCategory && (
            <div className="mx-auto w-full max-w-md px-4 pb-6">
              <DrawerHeader className="px-0 pt-2 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      activeCategory.iconBgClass,
                      activeCategory.iconTextClass,
                    )}
                  >
                    <activeCategory.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle className="text-left text-lg">
                      {activeCategory.label} CO₂ Offset
                    </DrawerTitle>
                    <DrawerDescription className="text-left text-xs">
                      How this category contributes to your lifetime tons avoided
                    </DrawerDescription>
                  </div>
                </div>
              </DrawerHeader>

              <CategoryDetails category={activeCategory.key} breakdown={breakdown} />
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function CategoryDetails({ category, breakdown }: { category: CategoryKey; breakdown: CO2Breakdown }) {
  const lbs = lbsOf(breakdown, category);
  const treeYears = Math.max(0, Math.round(lbs / LBS_PER_TREE_YEAR));
  const pct = breakdown.totalLbs > 0 ? (lbs / breakdown.totalLbs) * 100 : 0;
  const { inputs } = breakdown;

  const isCharger = category === 'supercharger' || category === 'home_charger';
  const chargerKwh =
    category === 'supercharger' ? inputs.superchargerKwh : inputs.homeChargerKwh;
  const chargerLabel = category === 'supercharger' ? 'Supercharger' : 'Home charger';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Lifetime CO₂ avoided
        </p>
        <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-foreground">
          {formatTons(lbs)}
          <span className="ml-1.5 text-base font-semibold text-muted-foreground">tons</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs
          </span>
          <span className="inline-flex items-center gap-1">
            <TreePine className="h-3 w-3 text-eco" />
            ≈ {treeYears.toLocaleString()} tree-years
          </span>
          <span className="tabular-nums">{pct.toFixed(1)}% of lifetime total</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
          How it's calculated
        </p>
        {category === 'solar' && (
          <>
            <Row
              label="Solar energy produced"
              value={`${inputs.solarKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
            />
            <Row label="EPA grid factor" value={`${EPA_CO2_LBS_PER_KWH} lbs CO₂ / kWh`} />
            <Row
              label="= CO₂ displaced"
              value={`${lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Every kWh of solar you produce displaces a kWh of average US grid electricity
              (eGRID 2022, adjusted for ~5.1% transmission losses).
            </p>
          </>
        )}
        {category === 'battery' && (
          <>
            <Row
              label="Battery energy discharged"
              value={`${inputs.batteryKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
            />
            <Row label="EPA grid factor" value={`${EPA_CO2_LBS_PER_KWH} lbs CO₂ / kWh`} />
            <Row
              label="= CO₂ displaced"
              value={`${lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Stored energy you discharge into your home served load that would otherwise have
              come from the grid.
            </p>
          </>
        )}
        {isCharger && (
          <>
            <Row
              label={`${chargerLabel} energy delivered`}
              value={`${chargerKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
            />
            <Row
              label="Share of total EV charging"
              value={`${inputs.evKwhUsed > 0 ? Math.round((chargerKwh / inputs.evKwhUsed) * 100) : 0}%`}
            />
            <Row
              label="EV miles driven (lifetime)"
              value={`${inputs.evMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })} mi`}
            />
            <Row
              label="Gasoline baseline avoided"
              value={`${inputs.evGasBaselineLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs (${CO2_LBS_PER_GAS_MILE} lbs/mi)`}
            />
            <Row
              label="− Grid emissions from charging"
              value={`${inputs.evElectricityEmissionsLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <Row
              label={`= Net CO₂ avoided (allocated)`}
              value={`${lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              EV net offset = gasoline baseline (~404 g CO₂/mile) minus grid emissions from
              charging. Allocated to {chargerLabel.toLowerCase()} proportionally to its share
              of total kWh delivered ({EV_KWH_PER_MILE} kWh/mi assumed if no charger data).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
