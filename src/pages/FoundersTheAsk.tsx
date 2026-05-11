import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, Banknote, Network, Handshake, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";

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
          <Banknote className="h-3 w-3" /> Pre-Meeting · Q2
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-tight">
          The Ask <span className="italic text-primary">— from Lyndon</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          One sentence. Locked since v8.1. Not negotiable, not capital, not a pitch deck conversation.
        </p>
      </section>

      {/* The Ask — Highlight */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
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

      {/* Why a board seat (not a check) */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <h2 className="text-xl font-bold mb-4 text-foreground">Why a board seat — not a check</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ValueCard
            icon={Network}
            title="The Network"
            body="SolarCity + Tesla utility relationships, OEM contacts, partnership rails. Capital can't replicate decades of operator credibility."
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

      {/* What we offer */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <h2 className="text-xl font-bold mb-4 text-foreground">What he gets</h2>
        <ul className="space-y-3">
          <Bullet>Early board influence on a category-defining protocol — verified energy economics, multi-vertical, on-chain.</Bullet>
          <Bullet>Equity terms TBD — designed to align long-horizon, not just first-meeting.</Bullet>
          <Bullet>Direct co-shape of the OEM partnership roadmap (Tesla / SolarEdge / Enphase / Wallbox + future).</Bullet>
          <Bullet>Founding-board credit on the protocol that turns clean energy into currency.</Bullet>
        </ul>
      </section>

      {/* What we're NOT asking for */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <X className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">What we're NOT asking from Lyndon</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Not capital. The $5M seed is a separate lead-investor conversation.</li>
            <li>• Not an introduction-only relationship. We want him at the table, not on a deck slide.</li>
            <li>• Not a co-founder role. Joseph + Michael own day-to-day execution.</li>
            <li>• Not exclusivity — he can sit on whatever boards he wants.</li>
          </ul>
        </div>
      </section>

      {/* Cross-link to seed ask */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-12">
        <Link
          to="/founders/seed-ask"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card hover:border-amber-400/40 hover:bg-card/80 p-5 transition-colors"
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">Separate conversation</p>
            <p className="text-sm md:text-base font-semibold text-foreground">$5M Seed Round — Lead Investor One-Pager</p>
            <p className="text-xs text-muted-foreground mt-1">Capital-side ask is here. Kept deliberately separate from the Lyndon board-seat conversation.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-400" />
        </Link>
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
