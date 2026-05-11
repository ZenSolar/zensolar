import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Banknote,
  Network,
  Handshake,
  X,
  Download,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";

const PDF_PATH = "/founder-docs/seed-ask-lyndon-v8.1final.pdf";

export default function FoundersTheAsk() {
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
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/founders" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Vault
          </Link>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400">
            <Lock className="h-3 w-3" /> Founders Only
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-amber-400 mb-3 inline-flex items-center gap-2">
          <Banknote className="h-3 w-3" /> For Lyndon · Board Seat + $5M Seed
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-tight">
          The Ask <span className="italic text-primary">— from Lyndon</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Two parts, one conversation. A board seat to co-shape the protocol, and a $5M seed
          to ship the next 24 months. Built on the same thesis: verified energy becomes currency.
        </p>
      </section>

      {/* PART 1 — Board Seat Highlight */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Part 1 · The Seat</p>
        <div className="rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-4">What we're asking for</p>
          <p className="font-serif text-2xl md:text-4xl leading-[1.15] text-foreground italic">
            "Board seat — co-shape the tokenized energy economy from day one."
          </p>
          <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
            Verbatim · Locked v8.1 · Do not modify
          </p>
        </div>
      </section>

      {/* Why a board seat */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10 pt-6">
        <h2 className="text-xl font-bold mb-4 text-foreground">Why a board seat — alongside the check</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ValueCard
            icon={Network}
            title="The Network"
            body="SolarCity + Tesla utility relationships, OEM contacts, partnership rails. Capital alone can't replicate decades of operator credibility."
          />
          <ValueCard
            icon={Handshake}
            title="The Operator Shorthand"
            body="Lyndon has scaled energy hardware to millions of homes. We're building the software layer on top — his pattern-match accelerates every decision."
          />
          <ValueCard
            icon={Banknote}
            title="The Signal"
            body="A Rive board seat is the loudest possible signal to the energy + crypto worlds that this category is real and being built by serious operators."
          />
        </div>
      </section>

      {/* What he gets */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <h2 className="text-xl font-bold mb-4 text-foreground">What he gets</h2>
        <ul className="space-y-3">
          <Bullet>Early board influence on a category-defining protocol — verified energy economics, multi-vertical, on-chain.</Bullet>
          <Bullet>Equity terms TBD — designed to align long-horizon, not just first-meeting.</Bullet>
          <Bullet>Direct co-shape of the OEM partnership roadmap (Tesla / SolarEdge / Enphase / Wallbox + future).</Bullet>
          <Bullet>Founding-board credit on the protocol that turns clean energy into currency.</Bullet>
        </ul>
      </section>

      {/* Divider */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-2">
        <div className="border-t border-border/40" />
      </section>

      {/* PART 2 — $5M Seed */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pt-10 pb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Part 2 · The Check</p>
        <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-tight">
          $5M Seed Round
          <span className="italic text-primary"> — lead investor</span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl leading-relaxed">
          We're asking Lyndon to lead the seed. The board seat comes with the round —
          two halves of the same conversation, not separate asks.
        </p>
      </section>

      {/* Runway stat strip */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <StatCard kpi="24 months" label="Runway @ $0 revenue" sub="Fully-loaded burn including founder salaries" />
          <StatCard kpi="$208,333" label="Monthly burn" sub="$5.0M ÷ 24 months" />
          <StatCard kpi="Q2–Q4 '27" label="Series A target" sub="$80–120M post · metrics-triggered" />
          <StatCard kpi="6–12 mo" label="Post-mainnet to A" sub="Triggered by metrics, not calendar" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">The 24-month figure assumes zero revenue.</span>{" "}
          Subscription ARR ($9.99/mo), transfer-tax accruals, OEM licensing, and NFT mint fees extend
          runway materially. We treat this round as the{" "}
          <span className="text-primary font-medium">last raise required to reach default-alive</span>{" "}
          if growth tracks.
        </p>
      </section>

      {/* Actions */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-6">
        <div className="flex flex-wrap gap-3">
          <a
            href={PDF_PATH}
            download="ZenSolar_Seed_Ask_Lyndon_v8.1final.pdf"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            <Download className="h-4 w-4" /> Download Seed One-Pager (PDF)
          </a>
          <a
            href={PDF_PATH}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-5 py-2.5 text-sm font-medium hover:bg-card"
          >
            <ExternalLink className="h-4 w-4" /> Open in new tab
          </a>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-400">
            <Banknote className="h-3.5 w-3.5" /> v8.1 · Eyes-only: Joseph & Michael
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
            <iframe src={PDF_PATH} title="ZenSolar Seed Ask one-pager" className="w-full h-[80vh]" />
          </object>
          <div className="md:hidden p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              PDF preview is best on desktop. Tap below to open.
            </p>
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" /> Open Seed Ask PDF
            </a>
          </div>
        </div>
      </section>

      {/* What we're NOT asking for */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-12">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <X className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">What we're NOT asking for</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Not an introduction-only relationship. We want him at the table, not on a deck slide.</li>
            <li>• Not a co-founder role. Joseph + Michael own day-to-day execution.</li>
            <li>• Not exclusivity — he can sit on whatever boards he wants.</li>
            <li>• Not a follow-on commitment. Series A is its own metrics-triggered conversation.</li>
          </ul>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-5 md:px-6 py-8 border-t border-border/40 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
        ZenSolar · Founders · Confidential
      </footer>
    </div>
  );
}

function ValueCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
      <span className="text-primary mt-0.5">▸</span>
      <span>{children}</span>
    </li>
  );
}

function StatCard({ kpi, label, sub }: { kpi: string; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-2xl md:text-3xl font-bold text-primary leading-none">{kpi}</p>
      <p className="mt-2 text-[11px] uppercase tracking-widest text-foreground font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-snug">{sub}</p>
    </div>
  );
}
