import { Lock, TrendingUp, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EnergyReportFull, EnergyReportPreview } from "@/hooks/useEnergyReport";

interface Props {
  preview: EnergyReportPreview;
  full: EnergyReportFull | null;
  entitled: boolean;
  onUnlock?: () => void;
}

const usd = (n: number | undefined) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

/**
 * In-chat rendering of the Solar Concierge analysis. Top: free preview card
 * (always visible). Below: full report (rendered if entitled) or paywall.
 */
export function EnergyReportCard({ preview, full, entitled, onUnlock }: Props) {
  return (
    <div className="space-y-3">
      {/* PREVIEW — always free */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-amber-500/[0.02] p-4">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-amber-500">
          <Sparkles className="h-3.5 w-3.5" /> Your energy report
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">
            {usd(preview.headline_savings_usd_per_year)}
          </span>
          <span className="text-xs text-muted-foreground">est. annual savings opportunity</span>
        </div>
        <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{preview.executive_summary}</p>

        <div className="mt-3 grid gap-2">
          <div className="flex items-start gap-2 rounded-lg bg-background/40 px-3 py-2">
            <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            <div className="text-xs text-foreground/90">{preview.top_insight}</div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-background/40 px-3 py-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
            <div className="text-xs text-foreground/90">{preview.top_risk_flag}</div>
          </div>
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
          Confidence: {preview.confidence}
        </div>
      </div>

      {/* FULL REPORT or PAYWALL */}
      {entitled && full ? <FullReport full={full} /> : <Paywall onUnlock={onUnlock} />}
    </div>
  );
}

function Paywall({ onUnlock }: { onUnlock?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
      {/* Blurred teaser content */}
      <div className="pointer-events-none select-none p-4 opacity-40 blur-sm">
        <div className="text-sm font-semibold">ROI &amp; payback</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <Stat label="System cost" value="$32,400" />
          <Stat label="Simple payback" value="7.2 yrs" />
          <Stat label="Annual production" value="11,820 kWh" />
          <Stat label="25-yr net ROI" value="$48,910" />
        </div>
        <div className="mt-4 text-sm font-semibold">Rate plan optimization</div>
        <p className="mt-1 text-xs">Switching from E-TOU-C to EV2-A would save roughly $612/yr based on your usage shape.</p>
        <div className="mt-4 text-sm font-semibold">Action items</div>
        <ul className="mt-1 space-y-1 text-xs list-disc list-inside">
          <li>Shift dishwasher to 11pm — saves $14/mo</li>
          <li>Pre-cool home before 4pm — saves $28/mo</li>
          <li>Renegotiate loan APR with lender — saves $1,200/yr</li>
        </ul>
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-card via-card/95 to-card/60 p-5 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold">Unlock your full report</div>
          <div className="mt-1 text-xs text-muted-foreground">
            ROI &amp; payback, rate-plan switch, TOU shifting, contract risk flags, and 3–5 ranked action items — refreshed every month.
          </div>
        </div>
        <Button
          onClick={onUnlock}
          className="bg-amber-500 text-black hover:bg-amber-400"
          size="sm"
        >
          Unlock — $4.99 / month
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
        <div className="text-[10px] text-muted-foreground">7-day free trial · cancel anytime</div>
      </div>
    </div>
  );
}

function FullReport({ full }: { full: EnergyReportFull }) {
  return (
    <div className="space-y-3">
      {full.roi_payback && (
        <Section title="ROI & payback">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="System cost" value={usd(full.roi_payback.system_cost_usd)} />
            <Stat label="Simple payback" value={full.roi_payback.simple_payback_years ? `${full.roi_payback.simple_payback_years.toFixed(1)} yrs` : "—"} />
            <Stat label="Annual production" value={full.roi_payback.annual_production_kwh ? `${full.roi_payback.annual_production_kwh.toLocaleString()} kWh` : "—"} />
            <Stat label="25-yr net ROI" value={usd(full.roi_payback.net_roi_25yr_usd)} />
          </div>
          {full.roi_payback.notes && <p className="mt-2 text-xs text-muted-foreground">{full.roi_payback.notes}</p>}
        </Section>
      )}

      {full.rate_plan && (
        <Section title="Rate plan optimization">
          <div className="text-xs">
            <div><span className="text-muted-foreground">Current:</span> {full.rate_plan.current_plan ?? "—"}</div>
            <div><span className="text-muted-foreground">Recommended:</span> {full.rate_plan.recommended_plan ?? "—"}</div>
            <div className="mt-1 font-semibold text-emerald-500">{usd(full.rate_plan.projected_annual_savings_usd)} /yr potential</div>
            {full.rate_plan.reasoning && <p className="mt-1 text-muted-foreground">{full.rate_plan.reasoning}</p>}
          </div>
        </Section>
      )}

      {full.tou_shifting?.length ? (
        <Section title="Time-of-use shifting">
          <ul className="space-y-1.5 text-xs">
            {full.tou_shifting.map((t, i) => (
              <li key={i} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{t.load}</div>
                  <div className="text-muted-foreground">{t.recommended_window}</div>
                </div>
                {typeof t.estimated_monthly_savings_usd === "number" && (
                  <div className="text-emerald-500 tabular-nums">+{usd(t.estimated_monthly_savings_usd)}/mo</div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {full.contract_risk_flags?.length ? (
        <Section title="Contract risk flags">
          <ul className="space-y-1.5 text-xs">
            {full.contract_risk_flags.map((f, i) => (
              <li key={i} className="rounded-md bg-background/40 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{f.flag}</span>
                  <span className={`text-[10px] uppercase ${f.severity === "high" ? "text-rose-400" : f.severity === "medium" ? "text-amber-400" : "text-muted-foreground"}`}>
                    {f.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">{f.explanation}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Recommended actions">
        <ol className="space-y-2 text-xs">
          {full.action_items.map((a, i) => (
            <li key={i} className="rounded-md bg-background/40 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{i + 1}. {a.title}</span>
                <span className="text-emerald-500 tabular-nums">{usd(a.estimated_annual_impact_usd)}/yr</span>
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{a.difficulty}</div>
              <p className="mt-1 text-muted-foreground">{a.steps}</p>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
