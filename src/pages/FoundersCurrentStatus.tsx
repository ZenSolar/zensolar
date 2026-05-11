import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Lock, Activity, Zap, Shield, Cpu, Rocket, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";
import { useBetaMetrics } from "@/hooks/useBetaMetrics";
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_NFT_ADDRESS, ZSOLAR_CONTROLLER_ADDRESS } from "@/lib/wagmi";

export default function FoundersCurrentStatus() {
  const { user, isLoading } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const preview = isPreviewMode();
  const { metrics } = useBetaMetrics();

  if (!preview && (isLoading || !ready)) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!preview && !user) return <Navigate to="/auth" replace />;
  if (!preview && !isFounder) return <Navigate to="/" replace />;

  const baseScanToken = `https://basescan.org/token/${ZSOLAR_TOKEN_ADDRESS}`;
  const baseScanController = `https://basescan.org/address/${ZSOLAR_CONTROLLER_ADDRESS}`;

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
          <Activity className="h-3 w-3" /> Pre-Meeting · Q3
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-tight">
          We're not pitching a deck.
          <br /><span className="italic text-primary">We're shipping.</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Live on Base L2. Real users. Real on-chain mints. Real OEM data flowing today. This is the snapshot — verifiable, link-by-link.
        </p>
      </section>

      {/* Live Stats Strip */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            kpi={metrics.isLoading ? "…" : metrics.mintTransactionCount.toLocaleString()}
            label="Confirmed beta mints"
            sub="On-chain · Base L2"
          />
          <Stat
            kpi={metrics.isLoading ? "…" : `${Math.round(metrics.totalMinted).toLocaleString()}`}
            label="$ZSOLAR minted"
            sub="From verified energy"
          />
          <Stat
            kpi="4"
            label="OEMs live"
            sub="Tesla · Enphase · Wallbox · SolarEdge"
          />
          <Stat
            kpi="5"
            label="Trademarks filed"
            sub="+ SEGI™ provisional patent"
          />
        </div>
      </section>

      {/* Live on Base L2 */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <SectionHeader icon={Zap} title="Live on Base L2" />
        <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            $ZSOLAR is a real ERC-20 token deployed on Base L2 mainnet. Real on-chain mints triggered by real verified energy events. Not testnet. Not a roadmap promise.
          </p>
          <ContractRow label="$ZSOLAR Token" addr={ZSOLAR_TOKEN_ADDRESS} url={baseScanToken} />
          <ContractRow label="Mint Controller" addr={ZSOLAR_CONTROLLER_ADDRESS} url={baseScanController} />
          <ContractRow label="ZenSolar NFT (Achievements)" addr={ZSOLAR_NFT_ADDRESS} url={`https://basescan.org/address/${ZSOLAR_NFT_ADDRESS}`} />
        </div>
      </section>

      {/* Live Product */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <SectionHeader icon={Rocket} title="Live product — beta.zen.solar" />
        <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
          <ul className="space-y-2.5">
            <Check>Open the URL on any device — no app install, no extension.</Check>
            <Check>Embedded Coinbase Wallet auto-provisioned on signup. Zero crypto knowledge required.</Check>
            <Check>Tap-to-Mint™ working today — verified energy event → on-chain mint in seconds.</Check>
            <Check>Mobile-first PWA. Works offline. Push notifications.</Check>
          </ul>
          <a
            href="https://beta.zen.solar"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4" /> Open beta.zen.solar
          </a>
        </div>
      </section>

      {/* OEM Rails */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <SectionHeader icon={Cpu} title="OEM rails live" />
        <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Real production data flowing through real device APIs for real users — not mockups.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <OemRow name="Tesla" status="live" detail="Joseph, Tschida, Pessah, Golson — production data flowing" />
            <OemRow name="Enphase" status="live" detail="Joseph, Tschida, Pessah, Golson — solar production verified" />
            <OemRow name="Wallbox" status="live" detail="Tschida — home charging API confirmed" />
            <OemRow name="SolarEdge" status="ready" detail="Code-ready · awaiting first live user onboarding" />
          </div>
        </div>
      </section>

      {/* IP */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <SectionHeader icon={Shield} title="IP filed & defensible" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-[10px] uppercase tracking-widest text-primary mb-2">Patent</p>
            <p className="font-semibold text-foreground mb-2">SEGI™ — Software-Enabled Gateway Interface</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provisional patent filed Q1 2025. Hardware-agnostic 4-layer architecture for verified energy data → on-chain token issuance.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-[10px] uppercase tracking-widest text-primary mb-2">Trademarks (5 filed)</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Mint-on-Proof™</li>
              <li>• Proof-of-Delta™</li>
              <li>• Proof-of-Origin™</li>
              <li>• Proof-of-Genesis™</li>
              <li>• Tap-to-Mint™</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 md:col-span-2">
            <p className="text-[10px] uppercase tracking-widest text-primary mb-2">On-chain spec</p>
            <p className="font-semibold text-foreground mb-2">Device Watermark Registry</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anti-double-mint standard binding device manufacturer IDs (VIN, Site ID) to mint receipts on-chain. Prevents the same kWh from being tokenized on a competing platform.
            </p>
          </div>
        </div>
      </section>

      {/* What's next */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-12">
        <SectionHeader icon={Rocket} title="What's next (post-seed)" />
        <ul className="space-y-2.5">
          <Check>Mainnet token launch · $0.10 LP-seeded tranches ($200K USDC + 2M $ZSOLAR per round)</Check>
          <Check>Genesis Halving at 250K paying subscribers (Bitcoin-style scarcity event)</Check>
          <Check>Deason AI Phase 1 — Saturday Weekly Energy Report (utility optimizer)</Check>
          <Check>Series A trigger: metrics-based, Q2–Q4 '27 target, $80–120M post</Check>
        </ul>
      </section>

      <footer className="max-w-5xl mx-auto px-5 md:px-6 py-8 border-t border-border/40 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
        ZenSolar · Founders · Confidential
      </footer>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

function Stat({ kpi, label, sub }: { kpi: string; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-2xl md:text-3xl font-bold text-primary leading-none">{kpi}</p>
      <p className="mt-2 text-[11px] uppercase tracking-widest text-foreground font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-snug">{sub}</p>
    </div>
  );
}

function ContractRow({ label, addr, url }: { label: string; addr: string; url: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-t border-border/40 first:border-t-0 first:pt-0">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline break-all">
        {addr.slice(0, 10)}…{addr.slice(-8)}
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
    </div>
  );
}

function OemRow({ name, status, detail }: { name: string; status: "live" | "ready"; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/50 p-3">
      {status === "live" ? (
        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      ) : (
        <span className="h-4 w-4 rounded-full border border-amber-400/60 mt-0.5 flex-shrink-0" />
      )}
      <div>
        <p className="text-sm font-semibold text-foreground">
          {name} <span className={`text-[10px] uppercase tracking-widest ml-1 ${status === "live" ? "text-primary" : "text-amber-400"}`}>{status === "live" ? "Live" : "Ready"}</span>
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
