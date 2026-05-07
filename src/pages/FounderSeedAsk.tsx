import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, Loader2, Lock, Banknote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";

const PDF_PATH = "/founder-docs/seed-ask-lyndon-v16.pdf";

export default function FounderSeedAsk() {
  const { user, isLoading } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const preview = isPreviewMode();

  if (!preview && (isLoading || !ready)) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!preview && !user) return <Navigate to="/auth" replace />;
  if (!preview && !isFounder) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" />
            Vault
          </Link>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400">
            <Lock className="h-3 w-3" />
            Founders Only
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-amber-400 mb-3">
          Round One · Seed Ask
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-tight">
          $5M Seed Round
          <br />
          <span className="italic text-primary">for Lyndon Rive</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          The standalone one-pager for the lead-investor conversation. Kept
          deliberately separate from the Founder Pack so it can be sent, printed,
          or shared without exposing the long-horizon vision document.
        </p>
      </section>

      {/* Runway stat strip */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <StatCard
            kpi="24 months"
            label="Runway @ $0 revenue"
            sub="Fully-loaded burn including founder salaries"
          />
          <StatCard
            kpi="$208,333"
            label="Monthly burn"
            sub="$5.0M ÷ 24 months"
          />
          <StatCard
            kpi="Q2–Q4 '27"
            label="Series A target"
            sub="$80–120M post · metrics-triggered"
          />
          <StatCard
            kpi="6–12 mo"
            label="Post-mainnet to A"
            sub="Triggered by metrics, not calendar"
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">The 24-month figure assumes zero revenue.</span>{" "}
          Subscription ARR ($9.99/mo), transfer-tax accruals, OEM licensing, and NFT
          mint fees extend runway materially. We treat this round as the{" "}
          <span className="text-primary font-medium">last raise required to reach default-alive</span>{" "}
          if growth tracks.
        </p>
      </section>

      {/* Actions */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-6">
        <div className="flex flex-wrap gap-3">
          <a
            href={PDF_PATH}
            download="ZenSolar_Seed_Ask_Lyndon_v16.pdf"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
          <a
            href={PDF_PATH}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-5 py-2.5 text-sm font-medium hover:bg-card"
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </a>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-400">
            <Banknote className="h-3.5 w-3.5" />
            v16 · Eyes-only: Joseph & Michael
          </div>
        </div>
      </section>

      {/* Embedded PDF */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-12">
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
          <object
            data={PDF_PATH}
            type="application/pdf"
            className="w-full h-[80vh] hidden md:block"
            aria-label="ZenSolar Seed Ask one-pager"
          >
            <iframe
              src={PDF_PATH}
              title="ZenSolar Seed Ask one-pager"
              className="w-full h-[80vh]"
            />
          </object>
          {/* Mobile fallback */}
          <div className="md:hidden p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              PDF preview is best viewed on desktop. Tap below to open.
            </p>
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Open Seed Ask PDF
            </a>
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-5 md:px-6 py-8 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          ZenSolar · Seed Round Ask · Confidential
        </p>
      </footer>
    </div>
  );
}

function StatCard({ kpi, label, sub }: { kpi: string; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-2xl md:text-3xl font-bold text-primary leading-none">{kpi}</p>
      <p className="mt-2 text-[11px] uppercase tracking-widest text-foreground font-medium">
        {label}
      </p>
      <p className="mt-1 text-xs text-muted-foreground leading-snug">{sub}</p>
    </div>
  );
}
