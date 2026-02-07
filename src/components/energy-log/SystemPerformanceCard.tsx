import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Zap, ChevronRight, Clock, AlertTriangle, Battery } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnphaseInverters, type InverterData, type ArrayData } from '@/hooks/useEnphaseInverters';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

const HARDCODED_SYSTEM_SIZE_W = 7030; // 19 × 370W Silfab panels

interface SystemPerformanceCardProps {
  enabled: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function PanelCard({ inverter, intensity, isBest, isWorst }: {
  inverter: InverterData;
  intensity: number;
  isBest: boolean;
  isWorst: boolean;
}) {
  const kWh = (inverter.energy_wh / 1000).toFixed(0);
  const isReporting = inverter.status === 'normal';

  const hue = 207 + (45 - 207) * intensity;
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
      <p className="text-sm font-bold tabular-nums text-foreground leading-tight">
        {kWh}
        <span className="text-[10px] font-medium text-muted-foreground ml-0.5">kWh</span>
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
        {inverter.model}
      </p>
      {!isReporting && (
        <AlertTriangle className="absolute top-1.5 right-1.5 h-3 w-3 text-destructive" />
      )}
      {isBest && (
        <span className="absolute top-1 right-1 text-[9px]">⭐</span>
      )}
    </div>
  );
}

function ArraySection({ array, isExpanded, onToggle }: {
  array: ArrayData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const intensityMap = useMemo(() => {
    const energies = array.inverters.map(i => i.energy_wh);
    const min = Math.min(...energies);
    const max = Math.max(...energies);
    const range = max - min || 1;
    const map = new Map<string, number>();
    for (const i of array.inverters) {
      map.set(i.serial_number, (i.energy_wh - min) / range);
    }
    return map;
  }, [array.inverters]);

  const totalMwh = (array.total_energy_wh / 1_000_000).toFixed(1);
  const avgKwh = (array.avg_energy_wh / 1000).toFixed(0);

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      {/* Array header — tappable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {array.system_name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {array.panel_count} panels · {totalMwh} MWh · Avg {Number(avgKwh).toLocaleString()} kWh
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {array.last_report_date && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatRelativeTime(array.last_report_date)}
            </span>
          )}
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-90"
          )} />
        </div>
      </button>

      {/* Panel grid — expanded */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1">
          {/* Legend */}
          <div className="flex items-center gap-3 mb-2">
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

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {array.inverters.map(inv => (
              <PanelCard
                key={inv.serial_number}
                inverter={inv}
                intensity={intensityMap.get(inv.serial_number) || 0}
                isBest={inv.serial_number === array.best_serial}
                isWorst={inv.serial_number === array.worst_serial}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SystemPerformanceCard({ enabled }: SystemPerformanceCardProps) {
  const viewAsUserId = useViewAsUserId();
  const { data, isLoading, error } = useEnphaseInverters(enabled, viewAsUserId);
  const [isSystemExpanded, setIsSystemExpanded] = useState(false);
  const [expandedArrays, setExpandedArrays] = useState<Set<string>>(new Set());

  const toggleArray = (envoySerial: string) => {
    setExpandedArrays(prev => {
      const next = new Set(prev);
      if (next.has(envoySerial)) {
        next.delete(envoySerial);
      } else {
        next.add(envoySerial);
      }
      return next;
    });
  };

  if (!enabled) return null;

  if (isLoading) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading system data…</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.arrays?.length) return null;

  const systemSizeW = data.system.system_size_w > 0
    ? data.system.system_size_w
    : HARDCODED_SYSTEM_SIZE_W;
  const systemSizeKw = (systemSizeW / 1000).toFixed(2);
  const totalMwh = (data.system.total_energy_wh / 1_000_000).toFixed(1);

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      {/* System-level header — always visible, tappable */}
      <button
        onClick={() => setIsSystemExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
            <Battery className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">System Performance</p>
            <p className="text-xs text-muted-foreground">
              {systemSizeKw} kW · {totalMwh} MWh lifetime · {data.system.total_panels} panels
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data.system.last_report_date && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(data.system.last_report_date)}
            </span>
          )}
          <ChevronRight className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isSystemExpanded && "rotate-90"
          )} />
        </div>
      </button>

      {/* Array list — expanded */}
      {isSystemExpanded && (
        <CardContent className="px-3 pb-3 pt-0 space-y-1.5">
          {data.arrays.map(array => (
            <ArraySection
              key={array.envoy_serial}
              array={array}
              isExpanded={expandedArrays.has(array.envoy_serial)}
              onToggle={() => toggleArray(array.envoy_serial)}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
