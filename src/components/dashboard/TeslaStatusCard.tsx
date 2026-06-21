/**
 * TeslaStatusCard — calm, always-on compact status card.
 *
 * Renders whenever a Tesla vehicle is linked to the user, regardless of an
 * active charging session. Shows SOC ring, range, and a quiet status pill.
 * Mounted directly below the main live energy card.
 *
 * Phase 2 of Tesla Charging Experience v2. Strictly L1 (silent) styling — no
 * audio, no pulsing, no celebratory colours.
 */
import { Car, Plug, BatteryCharging, ZapOff } from 'lucide-react';
import { useTeslaVehicleStatus, type ChargingState } from '@/hooks/useTeslaVehicleStatus';

function statusLabel(state: ChargingState, fastBrand: string | null): {
  text: string;
  tone: 'muted' | 'accent' | 'warn';
  Icon: typeof Car;
} {
  if (state === 'Charging') {
    if (fastBrand === 'Tesla') {
      return { text: 'Supercharging', tone: 'accent', Icon: BatteryCharging };
    }
    return { text: 'Charging', tone: 'accent', Icon: BatteryCharging };
  }
  if (state === 'Complete') return { text: 'Charge complete', tone: 'muted', Icon: Plug };
  if (state === 'Stopped') return { text: 'Paused', tone: 'muted', Icon: Plug };
  if (state === 'NoPower') return { text: 'No power', tone: 'warn', Icon: ZapOff };
  if (state === 'Disconnected') return { text: 'Unplugged', tone: 'muted', Icon: Car };
  return { text: 'Idle', tone: 'muted', Icon: Car };
}

function SocRing({ pct }: { pct: number }) {
  const safe = Math.max(0, Math.min(100, pct));
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - safe / 100);
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="hsl(var(--muted) / 0.4)"
        strokeWidth="3"
      />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dashoffset 600ms ease' }}
      />
      <text
        x="24"
        y="27"
        textAnchor="middle"
        fontSize="11"
        fontWeight={600}
        fill="hsl(var(--foreground))"
      >
        {Math.round(safe)}
      </text>
    </svg>
  );
}

export function TeslaStatusCard() {
  const { data: tesla } = useTeslaVehicleStatus();
  if (!tesla) return null;

  const { text, tone, Icon } = statusLabel(tesla.charging_state, tesla.fast_charger_brand);
  const toneClass =
    tone === 'accent'
      ? 'text-primary'
      : tone === 'warn'
      ? 'text-amber-400/90'
      : 'text-muted-foreground';

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 px-3 py-2.5 backdrop-blur-sm"
      aria-label="Tesla vehicle status"
    >
      <SocRing pct={tesla.battery_level ?? 0} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {tesla.display_name ?? 'Tesla'}
          </span>
          {tesla.range_mi != null && (
            <span className="text-[11px] text-muted-foreground">
              {Math.round(tesla.range_mi)} mi range
            </span>
          )}
        </div>
        <div className={`mt-0.5 inline-flex items-center gap-1.5 text-[11px] ${toneClass}`}>
          <Icon className="h-3 w-3" />
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
}
