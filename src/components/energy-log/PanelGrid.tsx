import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnphaseInverters, type InverterData } from '@/hooks/useEnphaseInverters';

interface PanelGridProps {
  enabled: boolean;
}

function PanelCard({ inverter, intensity, isBest, isWorst }: {
  inverter: InverterData;
  intensity: number; // 0-1
  isBest: boolean;
  isWorst: boolean;
}) {
  const kWh = (inverter.energy_wh / 1000).toFixed(1);
  const isReporting = inverter.status === 'normal';

  // Heat-map: interpolate from cool blue to warm amber based on intensity
  const hue = 207 + (45 - 207) * intensity; // primary (207) → solar/accent (45)
  const sat = 70 + intensity * 23;
  const light = 54 - intensity * 10;
  const bgOpacity = 0.12 + intensity * 0.2;

  return (
    <div
      className={cn(
        "relative rounded-lg p-2.5 transition-all duration-300 border",
        !isReporting && "opacity-50",
        isBest && "ring-2 ring-amber-400/60",
        isWorst && "ring-2 ring-destructive/40",
      )}
      style={{
        borderColor: `hsl(${hue} ${sat}% ${light}% / 0.25)`,
        background: `linear-gradient(135deg, hsl(${hue} ${sat}% ${light}% / ${bgOpacity}), hsl(${hue} ${sat}% ${light + 15}% / ${bgOpacity * 0.5}))`,
      }}
    >
      {/* kWh value - prominent */}
      <p className="text-sm font-bold tabular-nums text-foreground leading-tight">
        {kWh}
        <span className="text-[10px] font-medium text-muted-foreground ml-0.5">kWh</span>
      </p>

      {/* Model */}
      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
        {inverter.model}
      </p>

      {/* Status indicator */}
      {!isReporting && (
        <AlertTriangle className="absolute top-1.5 right-1.5 h-3 w-3 text-destructive" />
      )}
      {isBest && (
        <span className="absolute top-1 right-1 text-[9px]">⭐</span>
      )}
    </div>
  );
}

export function PanelGrid({ enabled }: PanelGridProps) {
  const { data, isLoading, error } = useEnphaseInverters(enabled);

  const { inverters, intensityMap, bestSerial, worstSerial } = useMemo(() => {
    if (!data?.inverters?.length) return { inverters: [], intensityMap: new Map(), bestSerial: null, worstSerial: null };

    const inv = data.inverters;
    const energies = inv.map(i => i.energy_wh);
    const min = Math.min(...energies);
    const max = Math.max(...energies);
    const range = max - min || 1;

    const map = new Map<string, number>();
    for (const i of inv) {
      map.set(i.serial_number, (i.energy_wh - min) / range);
    }

    return {
      inverters: inv,
      intensityMap: map,
      bestSerial: data.summary.best_serial,
      worstSerial: data.summary.worst_serial,
    };
  }, [data]);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading panel data…</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.inverters?.length) {
    return null; // Silently hide if no inverter data available
  }

  const totalKwh = (data.summary.total_energy_wh / 1000).toFixed(1);
  const avgKwh = (data.summary.avg_energy_wh / 1000).toFixed(1);

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Panel Performance
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {data.summary.total_panels} panels
          </div>
        </div>
        {/* Summary stats */}
        <div className="flex gap-4 mt-2 text-xs">
          <div>
            <span className="text-muted-foreground">Total </span>
            <span className="font-semibold text-foreground">{Number(totalKwh).toLocaleString()} kWh</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg </span>
            <span className="font-semibold text-foreground">{avgKwh} kWh</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(207 70% 54% / 0.3)' }} />
            <span className="text-[10px] text-muted-foreground">Lower</span>
          </div>
          <div className="h-2 flex-1 rounded-full" style={{
            background: 'linear-gradient(90deg, hsl(207 70% 54% / 0.3), hsl(226 80% 45% / 0.4), hsl(45 93% 44% / 0.4))',
          }} />
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(45 93% 44% / 0.4)' }} />
            <span className="text-[10px] text-muted-foreground">Higher</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
          {inverters.map(inv => (
            <PanelCard
              key={inv.serial_number}
              inverter={inv}
              intensity={intensityMap.get(inv.serial_number) || 0}
              isBest={inv.serial_number === bestSerial}
              isWorst={inv.serial_number === worstSerial}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
