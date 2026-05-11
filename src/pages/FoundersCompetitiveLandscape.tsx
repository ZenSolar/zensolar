import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Lock, Shield, Fingerprint, Hexagon, TrendingUp, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";
import { competitors } from "@/data/competitors";

export default function FoundersCompetitiveLandscape() {
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
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary mb-3 inline-flex items-center gap-2">
          <Shield className="h-3 w-3" /> Pre-Meeting · Q1
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-tight">
          Why we're not <span className="italic text-primary">SolarCoin</span>
          <br />(or anyone else)
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Every energy-to-crypto attempt has fallen short on one of three things: verification, supply discipline, or moat. We did all three.
        </p>
      </section>

      {/* Three Reasons */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <h2 className="text-xl font-bold mb-4 text-foreground">The three reasons we're different</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ReasonCard
            icon={Fingerprint}
            label="Verification"
            them="Honor-system uploads or no verification at all."
            us="SEGI™ pulls device APIs (Tesla, Enphase, Wallbox) and signs every kWh into Proof-of-Delta™ before any token exists. Patent-pending."
          />
          <ReasonCard
            icon={Hexagon}
            label="Supply"
            them="Pre-minted pools (SolarCoin: 98B). Tokens existed before any energy was produced."
            us="Mint-on-Proof™ — tokens only come into existence when verified energy flows. 1T hard cap, 20% burn-per-mint, founders pact-locked."
          />
          <ReasonCard
            icon={TrendingUp}
            label="Moat"
            them="Single-vertical, single-chain, no IP. Most are hackathon projects or dormant."
            us="Live OEM rails (4 providers). POL flywheel. SEGI™ patent + 5 trademarks. Multi-vertical: solar + battery + EV + charging."
          />
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <h2 className="text-xl font-bold mb-4 text-foreground">Side-by-side</h2>
        <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[720px]">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {["Project", "Focus", "Chain", "Token Model", "Stage", "IP", "Threat"].map((h) => (
                  <th key={h} className="text-left font-semibold px-3 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50 bg-primary/5">
                <td className="px-3 py-2.5 font-semibold text-primary">ZenSolar</td>
                <td className="px-3 py-2.5 text-muted-foreground">Solar + Battery + EV + Charging</td>
                <td className="px-3 py-2.5 text-muted-foreground">Base L2</td>
                <td className="px-3 py-2.5 text-muted-foreground">Mint-on-Proof™ (1T cap)</td>
                <td className="px-3 py-2.5 text-muted-foreground">Live beta · real mints</td>
                <td className="px-3 py-2.5 text-muted-foreground">Patent + 5 TMs filed</td>
                <td className="px-3 py-2.5"><ThreatBadge level="us" /></td>
              </tr>
              {competitors.map((c) => (
                <tr key={c.name} className="border-t border-border/50">
                  <td className="px-3 py-2.5 font-semibold text-foreground">{c.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.focus.join(", ")}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.blockchain}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.tokenModel}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.stage}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{c.patentStatus}</td>
                  <td className="px-3 py-2.5"><ThreatBadge level={c.threatLevel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-competitor deep dive */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <h2 className="text-xl font-bold mb-4 text-foreground">Per-competitor wedge</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {competitors.map((c) => (
            <div key={c.name} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <a href={c.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{c.focus.join(" · ")}</p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                <span className="font-semibold text-foreground">What they do: </span>
                {c.keyDifferentiator}
              </p>
              {c.ourWedge && (
                <p className="text-xs text-foreground leading-relaxed border-l-2 border-primary pl-3">
                  <span className="font-semibold text-primary">Our wedge: </span>
                  {c.ourWedge}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Category validation */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-12">
        <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-widest text-primary mb-2">Category validation</p>
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
            GridPay launching March 2026 proves the category is real.
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ERCOT-only solo-founder hackathon project, no verification IP, no patents. Their existence validates the thesis — and our nationwide multi-vertical scope, patent-pending verification stack, and live OEM rails are the moat.
          </p>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-5 md:px-6 py-8 border-t border-border/40 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
        ZenSolar · Founders · Confidential
      </footer>
    </div>
  );
}

function ReasonCard({ icon: Icon, label, them, us }: { icon: React.ComponentType<{ className?: string }>; label: string; them: string; us: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">{label}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        <span className="font-semibold text-foreground/80">Them: </span>{them}
      </p>
      <p className="text-xs text-foreground leading-relaxed">
        <span className="font-semibold text-primary">Us: </span>{us}
      </p>
    </div>
  );
}

function ThreatBadge({ level }: { level: "low" | "medium" | "high" | "us" }) {
  if (level === "us") return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary"><CheckCircle2 className="h-3 w-3" /> Us</span>;
  if (level === "high") return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive"><AlertTriangle className="h-3 w-3" /> High</span>;
  if (level === "medium") return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500"><Shield className="h-3 w-3" /> Medium</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Low</span>;
}
