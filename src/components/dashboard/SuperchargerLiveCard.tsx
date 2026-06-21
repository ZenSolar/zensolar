/**
 * SuperchargerLiveCard — calm, understated live card for an active Tesla
 * Supercharger session. Phase 2 of Tesla Charging Experience v2.
 *
 * Design rules (locked):
 *   - L1 silent by default — no toast, no audio, no pulsing.
 *   - Muted header: "Supercharging • live".
 *   - Soft orange glow only on the kW number + a subtle cable glow.
 *   - Thin SOC ring, quiet "+X.X $ZSOLAR" line (1:1 to user).
 *   - Italic muted line: "↳ Strengthening LP for all holders".
 *   - Small secondary buttons: [View details] [Open in PoG].
 *
 * Renders nothing unless the active session is a Supercharger or third-party
 * DC fast-charge. Third-party is rendered without the orange accent.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, BatteryCharging } from 'lucide-react';
import { useActiveChargingSessionV2 } from '@/hooks/useActiveChargingSessionV2';
import { useSuperchargerSite } from '@/hooks/useSuperchargerSite';
import { useTeslaVehicleStatus } from '@/hooks/useTeslaVehicleStatus';
import { SuperchargerDetailSheet } from './SuperchargerDetailSheet';

function ThinSocRing({ pct, accent }: { pct: number; accent: boolean }) {
  const safe = Math.max(0, Math.min(100, pct));
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - safe / 100);
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
      <circle cx="21" cy="21" r={r} fill="none" stroke="hsl(var(--muted) / 0.35)" strokeWidth="2" />
      <circle
        cx="21"
        cy="21"
        r={r}
        fill="none"
        stroke={accent ? 'hsl(28 95% 60%)' : 'hsl(var(--primary))'}
        strokeWidth="2"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 21 21)"
        style={{ transition: 'stroke-dashoffset 700ms ease' }}
      />
      <text
        x="21"
        y="24"
        textAnchor="middle"
        fontSize="10"
        fontWeight={500}
        fill="hsl(var(--foreground) / 0.85)"
      >
        {Math.round(safe)}%
      </text>
    </svg>
  );
}

export function SuperchargerLiveCard() {
  const { data: session } = useActiveChargingSessionV2();
  const { data: tesla } = useTeslaVehicleStatus();
  const siteId =
    session && (session.source === 'supercharger' || session.source === 'third_party_dc')
      ? session.site_id
      : null;
  const { data: site } = useSuperchargerSite(siteId);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!session) return null;
  if (session.source !== 'supercharger' && session.source !== 'third_party_dc') return null;

  const isTesla = session.source === 'supercharger';

  const kw = session.charger_power_kw ?? 0;
  const kwh = session.kwh_so_far;
  const soc = tesla?.battery_level ?? 0;

  // Hide entirely when the session isn't actually drawing power (0 kW / idle).
  // Avoids showing a "live" card for a car that isn't charging.
  if (kw <= 0.1) return null;

  const accentColor = isTesla ? 'hsl(28 95% 60%)' : 'hsl(var(--primary))';

  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm"
        aria-label={isTesla ? 'Supercharger session live' : 'DC fast charging live'}
      >
        {/* Subtle cable glow — only when Tesla. */}
        {isTesla && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 top-1/2 h-px w-24 -translate-y-1/2 opacity-60"
            style={{
              background:
                'linear-gradient(90deg, transparent, hsl(28 95% 60% / 0.55), transparent)',
              filter: 'blur(1px)',
            }}
          />
        )}

        {/* Header: small, muted */}
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: accentColor }}
          />
          {isTesla ? 'Supercharging' : 'DC fast charging'}
          <span className="text-muted-foreground/60">• live</span>
        </div>

        <div className="flex items-center gap-4">
          <ThinSocRing pct={soc} accent={isTesla} />

          <div className="min-w-0 flex-1">
            {/* Site name */}
            <div className="truncate text-[13px] font-medium text-foreground">
              {site?.name ?? (isTesla ? 'Tesla Supercharger' : 'DC fast charger')}
              {site?.city && (
                <span className="ml-1.5 text-muted-foreground/70 font-normal">
                  · {site.city}
                </span>
              )}
            </div>

            {/* kW with soft accent glow */}
            <div className="mt-0.5 flex items-baseline gap-2 tabular-nums">
              <span
                className="text-2xl font-semibold leading-none"
                style={
                  isTesla
                    ? {
                        color: accentColor,
                        textShadow: '0 0 14px hsl(28 95% 60% / 0.35)',
                      }
                    : { color: 'hsl(var(--foreground))' }
                }
              >
                {kw > 0 ? kw.toFixed(0) : '—'}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                kW
              </span>
              <span className="ml-auto text-[12px] text-muted-foreground tabular-nums">
                +{kwh.toFixed(1)} kWh
              </span>
            </div>

            {/* Mint line — quiet, 1:1 */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-foreground/85">
              <BatteryCharging className="h-3 w-3 text-muted-foreground" />
              <span className="tabular-nums">+{kwh.toFixed(1)} $ZSOLAR</span>
              <span className="text-muted-foreground/70">minting</span>
            </div>

            {/* LP line — italic, muted */}
            <div className="mt-0.5 text-[11px] italic text-muted-foreground/80">
              ↳ Strengthening LP for all holders
            </div>
          </div>
        </div>

        {/* Secondary buttons — small, low-emphasis */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
          >
            View details
          </button>
          <Link
            to="/proof-of-genesis"
            className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
          >
            <Zap className="h-3 w-3" /> Open in PoG
          </Link>
        </div>
      </div>

      <SuperchargerDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        session={session}
        site={site ?? null}
      />
    </>
  );
}
