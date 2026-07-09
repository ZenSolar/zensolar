/**
 * ChargingHero — Tesla-app–grade vehicle status hero for ZenDrive.
 *
 * Renders:
 *   • Vehicle name + SOC% + charging bolt (top row, Tesla-style)
 *   • ETA line ("3h 12m to 82% limit") or idle fallback
 *   • Animated green cable → car hero image
 *   • Dense one-line data row: kW · mi/hr · A · V · SOC → limit
 *   • Charging source pill inside the hero (solar / Powerwall / grid / Supercharger)
 *
 * Presentation-only. No telemetry side effects. All values passed in.
 */
import { Zap, Sun, BatteryCharging, Home } from 'lucide-react';
import { VEHICLE_LABEL, VEHICLE_COLOR_LABEL, resolveVehicleAsset } from './EnergyFlowScene.scenes';
type ResolvedVehicleAsset = ReturnType<typeof resolveVehicleAsset>;
import type { TeslaFlow } from './LiveEnergyMonitoringCard';

function pick(obj: any, paths: string[]): any {
  if (!obj) return null;
  for (const p of paths) {
    const parts = p.split('.');
    let cur: any = obj;
    for (const k of parts) {
      if (cur == null) break;
      cur = /^\d+$/.test(k) ? cur[Number(k)] : cur[k];
    }
    if (cur != null && cur !== '') return cur;
  }
  return null;
}
const num = (v: any): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function ChargingHero({
  vehicleName,
  vehicleAsset,
  payload,
  tesla,
  sourceKw,
  solarKw,
  batteryKw,
}: {
  vehicleName: string;
  vehicleAsset: ResolvedVehicleAsset;
  payload: any;
  tesla: TeslaFlow | null;
  sourceKw: number;
  solarKw: number;
  batteryKw: number; // + charging / − discharging
}) {
  const cs = payload?.charge_state ?? payload?.response?.charge_state ?? payload;
  const soc = num(pick(payload, ['battery_level', 'usable_battery_level', 'response.charge_state.battery_level'])) ?? num(cs?.battery_level);
  const range = num(pick(payload, ['battery_range', 'ideal_battery_range', 'est_battery_range', 'response.charge_state.battery_range']));
  const chargeLimit = num(pick(payload, ['charge_limit_soc', 'response.charge_state.charge_limit_soc'])) ?? 80;
  const minutesToLimit = num(pick(payload, ['minutes_to_charge_limit', 'response.charge_state.minutes_to_charge_limit', 'time_to_full_charge']));
  const rawTtf = num(pick(payload, ['time_to_full_charge', 'response.charge_state.time_to_full_charge']));
  const timeMins = minutesToLimit ?? (rawTtf ? rawTtf * 60 : null);
  const amps = num(pick(payload, ['charger_actual_current', 'response.charge_state.charger_actual_current']));
  const pilot = num(pick(payload, ['charger_pilot_current', 'response.charge_state.charger_pilot_current']));
  const volts = num(pick(payload, ['charger_voltage', 'response.charge_state.charger_voltage']));

  const isCharging = !!tesla?.isCharging;
  const kW = tesla?.kW ?? 0;
  const miPerHr = Math.round(kW * 3.3);

  // Best-guess source narration for the pill (mirrors ChargingFromHomeLine)
  const sourceLabel = (() => {
    if (!tesla) return null;
    if (tesla.source === 'supercharger') return { text: 'Supercharging', icon: Zap };
    if (tesla.source === 'public') return { text: 'Fast charging', icon: Zap };
    if (tesla.source !== 'home') return null;
    if (solarKw > kW * 0.75) return { text: 'your solar', icon: Sun };
    if (batteryKw < -0.2 && Math.abs(batteryKw) >= kW * 0.5) return { text: 'your Powerwall', icon: BatteryCharging };
    if (solarKw > 0.3) return { text: 'solar + grid', icon: Sun };
    return { text: 'the grid', icon: Home };
  })();

  const etaText = (() => {
    if (!isCharging) return `Ready · ${soc !== null ? `${Math.round(soc)}% charged` : 'plug to charge'}`;
    if (timeMins && timeMins > 0) {
      const h = Math.floor(timeMins / 60);
      const m = Math.round(timeMins % 60);
      const dur = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return `${dur} to ${Math.round(chargeLimit)}% limit`;
    }
    return `Charging to ${Math.round(chargeLimit)}% limit`;
  })();

  const dataChips: string[] = [];
  if (isCharging && kW > 0) dataChips.push(`${kW.toFixed(1)} kW`);
  if (isCharging && miPerHr > 0) dataChips.push(`+${miPerHr} mi/hr`);
  if (isCharging && amps !== null) dataChips.push(`${Math.round(amps)}${pilot ? `/${Math.round(pilot)}` : ''} A`);
  if (isCharging && volts !== null) dataChips.push(`${Math.round(volts)} V`);
  if (soc !== null) dataChips.push(`${Math.round(soc)}% → ${Math.round(chargeLimit)}%`);

  const socPct = Math.max(0, Math.min(100, soc ?? 0));
  const limitPct = Math.max(socPct, Math.min(100, chargeLimit));

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-background/60 to-background/30 p-4 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]">
      {/* Row 1: name + SOC + bolt */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold text-foreground">{vehicleName}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{etaText}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[22px] font-bold tabular-nums ${
              isCharging ? 'text-emerald-300' : 'text-foreground'
            }`}
          >
            {soc !== null ? `${Math.round(soc)}%` : '—'}
          </span>
          {isCharging && (
            <Zap className="h-5 w-5 fill-emerald-300 text-emerald-300 drop-shadow-[0_0_8px_hsla(142,76%,50%,0.7)]" />
          )}
        </div>
      </div>

      {/* Row 2: car image + animated cable */}
      {vehicleAsset.src && (
        <div className="relative mt-2 flex items-center justify-center">
          {isCharging && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 400 160"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="zd-cable" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(142 76% 45%)" stopOpacity="0" />
                  <stop offset="60%" stopColor="hsl(142 76% 55%)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="hsl(142 76% 65%)" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d="M 20 140 Q 120 140 200 130"
                stroke="url(#zd-cable)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="6 8"
                className="zd-cable-flow"
              />
            </svg>
          )}
          <img
            src={vehicleAsset.src}
            alt={
              vehicleAsset.model
                ? `${VEHICLE_LABEL[vehicleAsset.model]}${vehicleAsset.color ? ` · ${VEHICLE_COLOR_LABEL[vehicleAsset.color]}` : ''}`
                : 'Your Tesla'
            }
            loading="lazy"
            className="relative z-10 h-40 w-auto object-contain drop-shadow-[0_20px_36px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}

      {/* Row 3: source pill inside hero */}
      {isCharging && sourceLabel && (
        <div className="mt-2 flex items-center justify-center gap-2 text-[12px] text-emerald-100/90">
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_hsla(142,76%,50%,0.7)]">
            <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          </span>
          <sourceLabel.icon className="h-3.5 w-3.5 text-emerald-300" />
          <span>
            Charging from <span className="font-semibold">{sourceLabel.text}</span>
          </span>
        </div>
      )}

      {/* Row 4: dense data row */}
      {dataChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12px] tabular-nums text-muted-foreground">
          {dataChips.map((chip, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground/40">·</span>}
              <span className={i === 0 && isCharging ? 'font-semibold text-foreground' : ''}>{chip}</span>
            </span>
          ))}
        </div>
      )}

      {/* Row 5: slim progress SOC → limit */}
      {soc !== null && (
        <div className="mt-3">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${
                isCharging
                  ? 'bg-emerald-400 shadow-[0_0_10px_hsla(142,76%,50%,0.6)]'
                  : 'bg-primary/70'
              }`}
              style={{ width: `${socPct}%` }}
            />
            <div
              className="absolute inset-y-0 rounded-full bg-emerald-400/25"
              style={{ left: `${socPct}%`, width: `${Math.max(0, limitPct - socPct)}%` }}
            />
            <div
              className="absolute inset-y-[-2px] w-px bg-foreground/40"
              style={{ left: `${limitPct}%` }}
              aria-hidden="true"
            />
          </div>
          {range !== null && (
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              <span>{Math.round(range)} mi range</span>
              <span>{Math.round(chargeLimit)}% limit</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes zd-cable-flow { to { stroke-dashoffset: -28; } }
        .zd-cable-flow { animation: zd-cable-flow 1.2s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .zd-cable-flow { animation: none; }
        }
      `}</style>
    </div>
  );
}
