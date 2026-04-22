import { Battery, Car, Thermometer, Zap, Sun, FileText, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BillReportAction {
  title: string;
  category: "battery" | "ev_charging" | "hvac" | "rate_plan" | "solar";
  setting_change: string;
  reasoning: string;
  monthly_savings_usd: number;
  kwh_shifted_per_month: number;
  zsolar_bonus_per_month: number;
  nft_unlock: string;
}

export interface BillReport {
  bill: {
    utility_name: string;
    rate_plan: string;
    billing_period?: string;
    total_kwh: number;
    total_cost_usd: number;
    peak_window?: string;
    peak_rate_usd_per_kwh?: number;
    off_peak_rate_usd_per_kwh?: number;
    nem_version?: string;
    confidence: "high" | "medium" | "low";
  };
  summary: string;
  actions: BillReportAction[];
  totals: {
    total_monthly_savings_usd: number;
    total_kwh_shifted: number;
    total_zsolar_bonus: number;
    annual_savings_usd: number;
  };
}

const CATEGORY_META: Record<BillReportAction["category"], { icon: typeof Battery; label: string; tint: string }> = {
  battery: { icon: Battery, label: "Battery", tint: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/30" },
  ev_charging: { icon: Car, label: "EV Charging", tint: "text-sky-500 bg-sky-500/10 ring-sky-500/30" },
  hvac: { icon: Thermometer, label: "HVAC", tint: "text-orange-500 bg-orange-500/10 ring-orange-500/30" },
  rate_plan: { icon: Zap, label: "Rate Plan", tint: "text-violet-500 bg-violet-500/10 ring-violet-500/30" },
  solar: { icon: Sun, label: "Solar", tint: "text-amber-500 bg-amber-500/10 ring-amber-500/30" },
};

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtKwh = (n: number) => `${Math.round(n).toLocaleString("en-US")} kWh`;
const fmtZsolar = (n: number) => `${Math.round(n).toLocaleString("en-US")} $ZSOLAR`;

export function BillSavingsReport({ report }: { report: BillReport }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <FileText className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Bill Savings Report</div>
            <div className="truncate text-xs text-muted-foreground">
              {report.bill.utility_name} · {report.bill.rate_plan}
              {report.bill.billing_period ? ` · ${report.bill.billing_period}` : ""}
            </div>
          </div>
          <ConfidenceBadge level={report.bill.confidence} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-px border-b border-border bg-border/40">
        <Stat label="Monthly $ saved" value={fmtUsd(report.totals.total_monthly_savings_usd)} accent />
        <Stat label="kWh shifted/mo" value={fmtKwh(report.totals.total_kwh_shifted)} />
        <Stat label="$ZSOLAR bonus/mo" value={fmtZsolar(report.totals.total_zsolar_bonus)} />
      </div>

      {/* Annual headline */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2 text-xs">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-muted-foreground">Projected annual savings:</span>
        <span className="ml-auto font-semibold text-emerald-500">
          {fmtUsd(report.totals.annual_savings_usd)}/yr
        </span>
      </div>

      {/* Actions */}
      <ol className="divide-y divide-border">
        {report.actions.map((a, i) => {
          const meta = CATEGORY_META[a.category] ?? CATEGORY_META.battery;
          const Icon = meta.icon;
          return (
            <li key={i} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {i + 1}
                  </div>
                  <div className={cn("mt-2 flex h-7 w-7 items-center justify-center rounded-full ring-1", meta.tint)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <h4 className="text-sm font-semibold leading-tight">{a.title}</h4>
                    <span className="text-sm font-semibold text-emerald-500">
                      +{fmtUsd(a.monthly_savings_usd)}/mo
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {meta.label}
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/90">{a.reasoning}</p>
                  <div className="mt-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
                    <span className="font-medium text-foreground">Do this: </span>
                    <span className="text-muted-foreground">{a.setting_change}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <Chip>{fmtKwh(a.kwh_shifted_per_month)} shifted</Chip>
                    {a.zsolar_bonus_per_month > 0 && (
                      <Chip className="bg-amber-500/10 text-amber-600 ring-amber-500/30">
                        +{fmtZsolar(a.zsolar_bonus_per_month)}
                      </Chip>
                    )}
                    {a.nft_unlock && (
                      <Chip className="bg-violet-500/10 text-violet-600 ring-violet-500/30">
                        <Award className="mr-1 inline h-3 w-3" />
                        {a.nft_unlock}
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
        Estimates based on the bill you uploaded · Not financial advice
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-sm font-semibold", accent && "text-emerald-500")}>{value}</div>
    </div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 ring-1 ring-border",
        "bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const cls =
    level === "high"
      ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30"
      : level === "medium"
        ? "bg-amber-500/10 text-amber-600 ring-amber-500/30"
        : "bg-muted text-muted-foreground ring-border";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ring-1", cls)}>
      {level} confidence
    </span>
  );
}
