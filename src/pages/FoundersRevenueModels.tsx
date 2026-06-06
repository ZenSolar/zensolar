import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { SimplePinGate } from "@/components/founders/SimplePinGate";
import { ProjectionChart } from "@/components/founders/revenue-models/ProjectionChart";
import {
  DEFAULT_ASSUMPTIONS,
  buildProjection,
  fmtUsd,
  type ProjectionAssumptions,
} from "@/lib/revenueModelProjection";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  Zap,
} from "lucide-react";

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
        <span className="text-sm font-mono text-foreground">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      {hint && <div className="text-[10px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

function FlywheelCallout({
  label,
  color,
  month,
}: {
  label: string;
  color: "primary" | "amber";
  month: number | null;
}) {
  const labelClass =
    color === "primary" ? "text-primary" : "text-amber-300";
  return (
    <div className="space-y-1">
      <div className={`text-xs uppercase tracking-wider font-semibold ${labelClass}`}>
        {label}
      </div>
      {month ? (
        <>
          <div className="text-2xl font-semibold tracking-tight">Month {month}</div>
          <div className="text-[11px] text-muted-foreground">
            LP injection first covers monthly burn
          </div>
        </>
      ) : (
        <>
          <div className="text-2xl font-semibold tracking-tight text-muted-foreground">
            Not yet
          </div>
          <div className="text-[11px] text-muted-foreground">
            Doesn't self-sustain inside 24 months at current assumptions
          </div>
        </>
      )}
    </div>
  );
}

function FoundersRevenueModelsInner() {
  const [a, setA] = useState<ProjectionAssumptions>(DEFAULT_ASSUMPTIONS);
  const [tableOpen, setTableOpen] = useState(false);
  const projection = useMemo(() => buildProjection(a), [a]);
  const {
    rows,
    a_flywheelMonth,
    b_flywheelMonth,
    a_runwayOutMonth,
    b_runwayOutMonth,
  } = projection;
  const final = rows[rows.length - 1];

  return (
    <>
      <Helmet>
        <title>Revenue Model Comparison — Founders</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div
        className="min-h-[100svh] bg-background text-foreground"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)",
        }}
      >
        <div className="mx-auto max-w-4xl px-4 space-y-6">
          {/* Header */}
          <header className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary/80">
              Internal • Founders Only • PIN Gated
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Revenue Model Comparison
            </h1>
            <p className="text-sm text-muted-foreground">
              Joseph &amp; Michael — current 50/50 split vs. proposed 100%-to-LP model.
              Adjust the assumptions below; charts and tables update live.
            </p>
          </header>

          {/* Flywheel headline callouts — pinned high so it's the first thing visible */}
          <section className="rounded-xl border border-border/60 bg-card/50 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">
                Flywheel self-sustaining month
              </h2>
              <span className="text-[10px] text-muted-foreground">
                (first month LP injection ≥ burn)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FlywheelCallout
                label="Model A · 50/50"
                color="primary"
                month={a_flywheelMonth}
              />
              <FlywheelCallout
                label="Model B · 100% LP"
                color="amber"
                month={b_flywheelMonth}
              />
            </div>
          </section>

          {/* Editable assumptions */}
          <section className="rounded-xl border border-border/60 bg-card/50 p-4 md:p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Key Assumptions</h2>
              <button
                onClick={() => setA(DEFAULT_ASSUMPTIONS)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Reset defaults
              </button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Slider
                label="Starting cash (post-seed)"
                value={a.startingCash}
                min={4_500_000}
                max={6_500_000}
                step={100_000}
                format={fmtUsd}
                onChange={(v) => setA({ ...a, startingCash: v })}
                hint="Cash on hand at month 0."
              />
              <Slider
                label="Monthly operating burn"
                value={a.monthlyBurn}
                min={50_000}
                max={300_000}
                step={5_000}
                format={fmtUsd}
                onChange={(v) => setA({ ...a, monthlyBurn: v })}
                hint="Fixed monthly company expenses."
              />
              <Slider
                label="Data revenue start (Model B)"
                value={a.dataRevenueStartMonth}
                min={1}
                max={18}
                step={1}
                format={(n) => `Month ${n}`}
                onChange={(v) => setA({ ...a, dataRevenueStartMonth: v })}
                hint="When utility data sales begin contributing."
              />
              <Slider
                label="Data revenue by month 24 (Model B)"
                value={a.dataRevenueTargetM24}
                min={0}
                max={1_000_000}
                step={25_000}
                format={fmtUsd}
                onChange={(v) => setA({ ...a, dataRevenueTargetM24: v })}
                hint="Target monthly data revenue at end of year 2."
              />
              <Slider
                label="Starting users (month 1)"
                value={a.startingUsers}
                min={100}
                max={5_000}
                step={100}
                format={(n) => n.toLocaleString()}
                onChange={(v) => setA({ ...a, startingUsers: v })}
              />
              <Slider
                label="Users at month 24"
                value={a.endingUsers}
                min={5_000}
                max={250_000}
                step={5_000}
                format={(n) => n.toLocaleString()}
                onChange={(v) => setA({ ...a, endingUsers: v })}
              />
            </div>
          </section>

          {/* Side-by-side model cards */}
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-primary/30 bg-card/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
                  Model A
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Current
                </span>
              </div>
              <h3 className="text-lg font-semibold">50/50 Subscription Split</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>50% of every subscription dollar → Liquidity Pool</li>
                <li>50% → ZenSolar treasury / operations</li>
                <li>Company is self-funding from subs alone</li>
              </ul>
              <div className="pt-2 border-t border-border/40 text-xs space-y-1.5">
                <div>
                  <div className="font-semibold text-foreground/90">Pros</div>
                  <p className="text-muted-foreground">
                    Predictable runway. No dependency on a second revenue line.
                    Flywheel and ops grow together.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-foreground/90">Cons</div>
                  <p className="text-muted-foreground">
                    LP grows at half-speed vs. Model B. Token floor and perceived
                    velocity build more slowly.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-amber-400/40 bg-card/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
                  Model B
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Proposed
                </span>
              </div>
              <h3 className="text-lg font-semibold">100% Subscriptions → LP</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>100% of subscription revenue → Liquidity Pool</li>
                <li>Company funded primarily by data sales to utilities</li>
                <li>Subs become a pure flywheel input, not a revenue line</li>
              </ul>
              <div className="pt-2 border-t border-border/40 text-xs space-y-1.5">
                <div>
                  <div className="font-semibold text-foreground/90">Pros</div>
                  <p className="text-muted-foreground">
                    LP grows ~2× faster. Stronger narrative: "every dollar you spend
                    funds the floor under your token."
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-foreground/90">Cons</div>
                  <p className="text-muted-foreground">
                    Runway depends on the data-revenue ramp. Until utilities pay,
                    ZenSolar burns seed cash with no offsetting income.
                  </p>
                </div>
              </div>
            </article>
          </section>

          {/* Cash position callout */}
          <section className="rounded-xl border border-border/60 bg-card/40 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-300 mt-0.5 shrink-0" />
            <div className="space-y-1 w-full">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Cash position at month 24
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-primary font-semibold">Model A:</span>{" "}
                  <span className="font-mono">{fmtUsd(final.a_cash)}</span>
                  {a_runwayOutMonth && (
                    <div className="text-[11px] text-destructive">
                      Runway out M{a_runwayOutMonth}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-amber-300 font-semibold">Model B:</span>{" "}
                  <span className="font-mono">{fmtUsd(final.b_cash)}</span>
                  {b_runwayOutMonth && (
                    <div className="text-[11px] text-destructive">
                      Runway out M{b_runwayOutMonth}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="grid gap-4 md:grid-cols-2">
            <ProjectionChart
              rows={rows}
              series="lp"
              title="Cumulative LP balance"
              subtitle="24-month projection — subscription-funded only"
            />
            <ProjectionChart
              rows={rows}
              series="cash"
              title="Company cash position"
              subtitle="Starting cash + revenue − burn"
            />
          </section>

          {/* Month-by-month table */}
          <section className="rounded-xl border border-border/60 bg-card/40">
            <button
              onClick={() => setTableOpen((v) => !v)}
              className="w-full flex items-center justify-between p-4"
            >
              <span className="text-sm font-semibold">Month-by-month detail</span>
              {tableOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {tableOpen && (
              <div className="overflow-x-auto border-t border-border/40">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border/40">
                      <th className="text-left p-2.5">Mo</th>
                      <th className="text-right p-2.5">Users</th>
                      <th className="text-right p-2.5">Subs $</th>
                      <th className="text-right p-2.5 text-primary">A · LP</th>
                      <th className="text-right p-2.5 text-primary">A · Cash</th>
                      <th className="text-right p-2.5 text-amber-300">B · LP</th>
                      <th className="text-right p-2.5 text-amber-300">B · Data</th>
                      <th className="text-right p-2.5 text-amber-300">B · Cash</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {rows.map((r) => (
                      <tr key={r.month} className="border-b border-border/20">
                        <td className="p-2 text-muted-foreground">M{r.month}</td>
                        <td className="p-2 text-right">{r.users.toLocaleString()}</td>
                        <td className="p-2 text-right">{fmtUsd(r.subRevenue)}</td>
                        <td className="p-2 text-right">{fmtUsd(r.a_cumulativeLp)}</td>
                        <td className="p-2 text-right">{fmtUsd(r.a_cash)}</td>
                        <td className="p-2 text-right">{fmtUsd(r.b_cumulativeLp)}</td>
                        <td className="p-2 text-right">{fmtUsd(r.b_dataRevenue)}</td>
                        <td className="p-2 text-right">{fmtUsd(r.b_cash)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Takeaways */}
          <section className="rounded-xl border border-border/60 bg-card/40 p-4 md:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Plain-language takeaways</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li>
                <span className="text-foreground font-medium">Flywheel speed:</span>{" "}
                Model B builds the LP roughly 2× faster — every subscription dollar
                lands in the pool instead of half going to ops. At current assumptions
                LP at month 24 is{" "}
                <span className="text-foreground font-mono">
                  {fmtUsd(final.b_cumulativeLp)}
                </span>{" "}
                (B) vs.{" "}
                <span className="text-foreground font-mono">
                  {fmtUsd(final.a_cumulativeLp)}
                </span>{" "}
                (A).
              </li>
              <li>
                <span className="text-foreground font-medium">Runway risk:</span>{" "}
                Model B only works if data revenue actually ramps. Until the first
                utility deal lands, ZenSolar burns seed cash with no offset. Push the
                "data revenue start" slider out a few months to stress-test.
              </li>
              <li>
                <span className="text-foreground font-medium">Hybrid option (not
                shown):</span>{" "}
                A 75/25 or 80/20 split between LP and ops could capture most of Model
                B's flywheel kick while keeping a safety margin. Worth modeling next
                if neither extreme feels right.
              </li>
              <li>
                <span className="text-foreground font-medium">Decision frame:</span>{" "}
                How confident are we in landing utility data contracts inside 12
                months? High confidence → Model B. Low confidence → Model A or hybrid.
              </li>
            </ul>
          </section>

          <footer className="text-[10px] text-muted-foreground/70 text-center pt-4">
            Internal planning doc. Not a public commitment. Numbers are illustrative
            and depend on the assumptions above.
          </footer>
        </div>
      </div>
    </>
  );
}

export default function FoundersRevenueModels() {
  return (
    <SimplePinGate
      code="0423"
      storageKey="revenue-models"
      title="Revenue Model Comparison"
      subtitle="Joseph & Michael · enter 4-digit code"
    >
      <FoundersRevenueModelsInner />
    </SimplePinGate>
  );
}
