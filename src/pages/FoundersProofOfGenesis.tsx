import { useEffect, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Home,
  Sparkles,
  Sun,
  Cpu,
  ShieldCheck,
  Bitcoin,
  Lock,
  Loader2,
  Download,
  FileSignature,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultBiometricGate } from "@/components/founders/VaultBiometricGate";
import { NdaSignatureStep } from "@/components/demo/NdaSignatureStep";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import zenLogo from "@/assets/zen-logo-horizontal-transparent.png";

export default function FoundersProofOfGenesis() {
  const { user, isLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsFounder(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set((data ?? []).map((r) => r.role));
      setIsFounder(set.has("founder") || set.has("admin"));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading || isFounder === null) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isFounder) return <Navigate to="/" replace />;

  return (
    <VaultBiometricGate userId={user.id}>
      <NdaGate userEmail={user.email ?? ""}>
        <Content />
      </NdaGate>
    </VaultBiometricGate>
  );
}

// ─── NDA gate ────────────────────────────────────────────────────
function NdaGate({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<"loading" | "needs-sign" | "signed">(
    "loading"
  );

  const check = async () => {
    if (!userEmail) {
      setStatus("needs-sign");
      return;
    }
    const { data, error } = await supabase.rpc("check_nda_signed", {
      _email: userEmail,
    });
    if (error) {
      setStatus("needs-sign");
      return;
    }
    setStatus(data === true ? "signed" : "needs-sign");
  };

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  if (status === "loading") {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "needs-sign") {
    return (
      <div className="min-h-[100svh] bg-background text-foreground pb-safe">
        <header className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl">
          <div className="px-safe">
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <Link
                to="/founders"
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" /> Vault
              </Link>
              <span className="text-[10px] uppercase tracking-widest text-amber-400">
                NDA Required
              </span>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-border"
              >
                <Home className="h-3 w-3" /> Home
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 py-10 space-y-6">
          <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-transparent p-5 text-center">
            <FileSignature className="h-6 w-6 text-amber-400 mx-auto mb-2" />
            <h1 className="font-serif text-2xl tracking-tight">
              Confidentiality Required
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The Proof of Genesis™ brief contains patent-pending material.
              Please sign the NDA below to view and download the one-pager.
            </p>
          </div>

          <NdaSignatureStep
            accessCodeUsed="founder-vault"
            onSigned={() => {
              toast.success("NDA accepted. Unlocking brief…");
              setStatus("signed");
            }}
          />
        </main>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Brief content ───────────────────────────────────────────────
function Content() {
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `zensolar-proof-of-genesis-${new Date()
          .toISOString()
          .split("T")[0]}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#0a0a0a",
        },
        jsPDF: {
          unit: "mm" as const,
          format: "a4" as const,
          orientation: "portrait" as const,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(printRef.current).save();
      toast.success("Proof of Genesis™ brief downloaded");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      <SEO
        title="Proof of Genesis™ — The Cryptographic Primitive That Eclipses Bitcoin"
        description="Proof of Genesis™ — Δ + Origin. The patent-pending ZenSolar primitive that mints $ZSOLAR from verified clean-energy receipts. NDA-shareable founders brief."
        url="https://zensolar.com/founders/proof-of-genesis"
        type="article"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl">
        <div className="px-safe">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Link
              to="/founders"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" /> Vault
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <img src={zenLogo} alt="ZenSolar" className="h-5 w-auto opacity-80 shrink-0" />
              <span className="text-[10px] uppercase tracking-widest text-amber-400 border-l border-border/40 pl-2 truncate">
                Proof of Genesis™
              </span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-border"
            >
              <Home className="h-3 w-3" /> Home
            </Link>
          </div>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="max-w-3xl mx-auto px-4 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            <ol className="flex items-center gap-1.5">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/founders" className="hover:text-foreground">Founders</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-amber-400">Proof of Genesis™</li>
            </ol>
          </nav>
        </div>
      </header>


      {/* Sticky Download bar */}
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            NDA on file · brief unlocked
          </p>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={exporting}
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      <main
        ref={printRef}
        className="max-w-3xl mx-auto px-5 md:px-6 py-10 md:py-16 space-y-12 md:space-y-16 bg-background"
      >
        {/* Hero — one-screen narrative */}
        <section>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] uppercase tracking-[0.28em] text-amber-400 mb-4"
          >
            The Genesis Primitive · Investor & Partner Brief
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-tight"
          >
            Proof of <span className="italic text-primary">Genesis</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-[16px] md:text-[18px] leading-[1.7] text-muted-foreground max-w-2xl"
          >
            Bitcoin proved digital scarcity by burning energy to prove waste.
            $ZSOLAR proves digital scarcity by minting value <em>because</em>{" "}
            clean energy was produced or consumed productively. We call that
            primitive <strong className="text-foreground">Proof of Genesis™</strong> —
            the cryptographic union of <em>Proof of Delta</em> (a verified
            change in energy state) and <em>Proof of Origin</em> (a verified
            physical device and clean source).
          </motion.p>

          {/* Three-column primitive */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Pillar
              icon={<Sun className="h-4 w-4" />}
              tag="Proof of Delta"
              title="Verified change in state"
              body="Δ kWh produced, exported, charged, or consumed — signed by the device itself."
            />
            <Pillar
              icon={<Cpu className="h-4 w-4" />}
              tag="Proof of Origin"
              title="Verified physical source"
              body="OEM-attested hardware identity (Tesla, Enphase, SolarEdge, Wallbox, SpaceX rectifiers)."
            />
            <Pillar
              icon={<Sparkles className="h-4 w-4" />}
              tag="Proof of Genesis™"
              title="Mint receipt, on-chain"
              body="Δ + Origin → a single notarized receipt that can mint, settle, or redeem $ZSOLAR."
            />
          </div>
        </section>

        {/* Diagram 1 — Genesis equation */}
        <section className="space-y-4">
          <SectionHead
            eyebrow="Diagram 01"
            title="The Genesis Equation"
            sub="How two independent proofs combine into one mintable receipt."
          />
          <div className="rounded-2xl border border-border/60 bg-card/30 p-4 md:p-6 overflow-x-auto">
            <GenesisEquationSVG />
          </div>
        </section>

        {/* Diagram 2 — Eclipse comparison */}
        <section className="space-y-4">
          <SectionHead
            eyebrow="Diagram 02"
            title="PoW vs Proof of Genesis™"
            sub="Why the same scarcity narrative compounds, but with a real-world floor."
          />
          <div className="rounded-2xl border border-border/60 bg-card/30 p-4 md:p-6 overflow-x-auto">
            <EclipseSVG />
          </div>
        </section>

        {/* Side-by-side comparison table */}
        <section className="space-y-4">
          <SectionHead
            eyebrow="Diagram 03"
            title="Bitcoin vs ZenSolar — Side by Side"
            sub="Every property that made Bitcoin a $2T network is preserved. Every property that capped its addressable market is structurally inverted."
          />
          <BTCvsZSOLARTable />
          <div className="space-y-4 pt-2">
            <p className="text-[15px] leading-[1.7] text-muted-foreground">
              The math is not aspirational — it is what the primitive plus the
              addressable market produces when run forward honestly.
              <strong className="text-foreground">
                {" "}
                Take Bitcoin&apos;s ~$2T cap. Apply Proof of Genesis™ to the
                $10T+ clean-energy economy. Stack five scarcity vectors on top
                of one. Add patent gating, founder accountability, ESG access,
                and protocol revenue. The math for{" "}
                <span className="text-primary">
                  5–10× Bitcoin in 5–10 years
                </span>{" "}
                is mathematically defensible.
              </strong>{" "}
              The only variable that can hold us back is execution — and
              execution is the variable we control.
            </p>
            <p className="text-[15px] leading-[1.7] text-muted-foreground">
              Disciplined fundraising accelerates this curve. A properly
              sequenced raise — patent-gated seed, OEM-anchored Series A,
              utility-scale Series B — front-loads the moat before the public
              cascade lands. Capital deployed against an already-locked
              primitive does not buy speculation; it buys the operating
              runway to outpace Bitcoin&apos;s narrative window.
            </p>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400 mb-1.5">
                Rock-solid by construction
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                Patent-protected across 8 categories.
                Founder-locked for life via the Family Legacy Pact.
                Revenue-backed from day one (subscriptions + 7% transfer tax + redemption fees).
                Launch-priced at $0.10 via LP-tranched rounds — never a 1T dump.
                Execution is the only variable.
              </p>
            </div>
          </div>
        </section>

        {/* Why partners care */}
        <section>
          <SectionHead
            eyebrow="For Partners"
            title="Why this matters to OEMs"
            sub="Proof of Genesis™ is Switzerland for energy proof — a neutral receipt every device can plug into."
          />
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Bullet
              icon={<ShieldCheck className="h-4 w-4 text-primary" />}
              title="OEM-friendly"
              body="Tesla, Enphase, SolarEdge, Wallbox, SpaceX — every device becomes a minting surface without abandoning their own brand."
            />
            <Bullet
              icon={<ShieldCheck className="h-4 w-4 text-primary" />}
              title="Patent-gated"
              body="8-category application; covers any device that produces, stores, moves, or consumes energy with a measurable signature."
            />
            <Bullet
              icon={<ShieldCheck className="h-4 w-4 text-primary" />}
              title="ESG-aligned by design"
              body="Trillions of mandate-locked capital can hold $ZSOLAR. Bitcoin is forbidden to most of that capital."
            />
            <Bullet
              icon={<ShieldCheck className="h-4 w-4 text-primary" />}
              title="Real-world settlement"
              body="Carbon credits, utility hedging, OEM resale value — all settle against the same notarized receipt."
            />
          </ul>
        </section>

        {/* Footer link to deep chapter */}
        <section className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-transparent p-6 md:p-8 text-center">
          <Bitcoin className="h-6 w-6 text-amber-400 mx-auto mb-3" />
          <p className="font-serif text-2xl md:text-3xl italic leading-snug">
            "Bitcoin is digital gold.
            <br />
            Proof of Genesis™ is{" "}
            <span className="text-primary not-italic">digital photosynthesis</span>."
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
            Chapter Eleven — Why $ZSOLAR Eclipses Bitcoin
          </p>
          <Link
            to="/founder-pack#eclipse"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            Read the full chapter
          </Link>
        </section>

        <div className="text-center inline-flex w-full justify-center items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Lock className="h-3 w-3 text-amber-400" />
          NDA-shareable · Founders Brief · Proof of Genesis™
        </div>
      </main>
    </div>
  );
}

// ─── Primitives ──────────────────────────────────────────────────
function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400 mb-2">
        {eyebrow}
      </p>
      <h2 className="font-serif text-2xl md:text-3xl tracking-tight leading-tight">
        {title}
      </h2>
      {sub && (
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{sub}</p>
      )}
    </div>
  );
}

function Pillar({
  icon,
  tag,
  title,
  body,
}: {
  icon: React.ReactNode;
  tag: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-2">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{tag}</span>
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Bullet({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-xl border border-border/40 bg-card/30 p-4 flex gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
          {body}
        </p>
      </div>
    </li>
  );
}

// ─── Side-by-side comparison table ──────────────────────────────
function BTCvsZSOLARTable() {
  const rows: Array<[string, string, string]> = [
    ["Primitive", "Proof of Work — burn electricity to prove waste", "Proof of Genesis™ — mint receipts from verified clean energy"],
    ["Hard cap", "21,000,000 BTC", "1,000,000,000,000 $ZSOLAR (1T)"],
    ["Halving cadence", "Every ~4 years (block-based)", "Programmable — protocol-governed"],
    ["Scarcity vectors", "1 (hard cap)", "5 (cap + halving + 3 burns)"],
    ["Backing", "Math + electricity destroyed", "Verified hardware + clean kWh delivered"],
    ["Energy footprint", "Consumes ~150 TWh/yr", "Mints from energy produced or used productively"],
    ["ESG capital access", "Forbidden by most mandates", "Native fit — trillions structurally unlocked"],
    ["Patent moat", "None", "8 categories, patent-pending"],
    ["Founder accountability", "Anonymous, gone", "Two named founders, pact-locked for life"],
    ["Protocol revenue", "$0", "Subscriptions + 7% transfer tax + redemption fees"],
    ["Launch mechanics", "Mined into existence over 100+ yrs", "LP-tranched at $0.10 — engineered floor per round"],
    ["Real-world settlement", "Speculative", "Carbon credits, OEM resale, utility hedging"],
    ["Market cap (today)", "~$2T", "Path to $10T+ (5–10× BTC in 5–10 yrs)"],
  ];

  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:grid grid-cols-[160px_1fr_1fr] text-[10px] uppercase tracking-widest bg-card/60 border-b border-border/60">
        <div className="p-3 text-muted-foreground">Property</div>
        <div className="p-3 text-muted-foreground border-l border-border/40">
          Bitcoin · Proof of Work
        </div>
        <div className="p-3 text-amber-400 border-l border-border/40 bg-primary/[0.04]">
          $ZSOLAR · Proof of Genesis™
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {rows.map(([label, btc, zsolar]) => (
          <div
            key={label}
            className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr]"
          >
            <div className="p-3 text-[11px] uppercase tracking-widest text-muted-foreground bg-card/30 md:bg-transparent">
              {label}
            </div>
            <div className="p-3 text-sm text-foreground/85 md:border-l border-border/40">
              <span className="md:hidden text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                BTC · PoW
              </span>
              {btc}
            </div>
            <div className="p-3 text-sm text-foreground md:border-l border-border/40 bg-primary/[0.03]">
              <span className="md:hidden text-[10px] uppercase tracking-widest text-amber-400 block mb-1">
                $ZSOLAR · PoG
              </span>
              {zsolar}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Diagram 01: Δ + Origin = Genesis ───────────────────────────
function GenesisEquationSVG() {
  return (
    <svg
      viewBox="0 0 720 240"
      className="w-full h-auto"
      role="img"
      aria-label="Proof of Delta plus Proof of Origin equals Proof of Genesis™"
    >
      {/* Left node — Delta */}
      <g>
        <rect x="20" y="60" rx="14" ry="14" width="180" height="120"
          fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeOpacity="0.5" />
        <text x="110" y="90" textAnchor="middle"
          fill="hsl(var(--primary))" fontSize="10" letterSpacing="2">
          PROOF OF DELTA
        </text>
        <text x="110" y="125" textAnchor="middle"
          fill="hsl(var(--foreground))" fontSize="22" fontFamily="serif">
          Δ kWh
        </text>
        <text x="110" y="155" textAnchor="middle"
          fill="hsl(var(--muted-foreground))" fontSize="10">
          state change · device-signed
        </text>
      </g>

      {/* Plus */}
      <text x="230" y="130" textAnchor="middle"
        fill="hsl(var(--muted-foreground))" fontSize="32" fontFamily="serif">
        +
      </text>

      {/* Middle node — Origin */}
      <g>
        <rect x="260" y="60" rx="14" ry="14" width="180" height="120"
          fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeOpacity="0.5" />
        <text x="350" y="90" textAnchor="middle"
          fill="hsl(var(--primary))" fontSize="10" letterSpacing="2">
          PROOF OF ORIGIN
        </text>
        <text x="350" y="125" textAnchor="middle"
          fill="hsl(var(--foreground))" fontSize="22" fontFamily="serif">
          OEM ID
        </text>
        <text x="350" y="155" textAnchor="middle"
          fill="hsl(var(--muted-foreground))" fontSize="10">
          physical · clean source
        </text>
      </g>

      {/* Equals */}
      <text x="470" y="130" textAnchor="middle"
        fill="hsl(var(--muted-foreground))" fontSize="32" fontFamily="serif">
        =
      </text>

      {/* Right node — Genesis */}
      <g>
        <rect x="500" y="40" rx="16" ry="16" width="200" height="160"
          fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary))" />
        <text x="600" y="78" textAnchor="middle"
          fill="hsl(var(--primary))" fontSize="10" letterSpacing="2">
          PROOF OF GENESIS™
        </text>
        <text x="600" y="120" textAnchor="middle"
          fill="hsl(var(--foreground))" fontSize="26" fontFamily="serif"
          fontStyle="italic">
          1 receipt
        </text>
        <text x="600" y="148" textAnchor="middle"
          fill="hsl(var(--foreground))" fontSize="14" fontFamily="serif">
          → mint $ZSOLAR
        </text>
        <text x="600" y="174" textAnchor="middle"
          fill="hsl(var(--muted-foreground))" fontSize="10">
          on-chain · patent-gated
        </text>
      </g>
    </svg>
  );
}

// ─── Diagram 02: PoW vs PoG comparison ──────────────────────────
function EclipseSVG() {
  return (
    <svg
      viewBox="0 0 720 280"
      className="w-full h-auto"
      role="img"
      aria-label="Proof of Work versus Proof of Genesis™ comparison"
    >
      {/* PoW column */}
      <g>
        <rect x="20" y="20" rx="14" ry="14" width="320" height="240"
          fill="hsl(var(--card))" stroke="hsl(var(--border))" />
        <text x="180" y="50" textAnchor="middle"
          fill="hsl(var(--muted-foreground))" fontSize="10" letterSpacing="2">
          BITCOIN — PROOF OF WORK
        </text>
        <text x="180" y="92" textAnchor="middle"
          fill="hsl(var(--foreground))" fontSize="34" fontFamily="serif">
          ~$2T
        </text>
        <text x="180" y="115" textAnchor="middle"
          fill="hsl(var(--muted-foreground))" fontSize="10">
          market cap · 1 scarcity vector
        </text>

        <line x1="50" y1="140" x2="310" y2="140"
          stroke="hsl(var(--border))" strokeOpacity="0.6" />

        <ComparisonRow y={160} label="Backing" value="Energy spent (waste)" />
        <ComparisonRow y={184} label="ESG capital" value="Forbidden" />
        <ComparisonRow y={208} label="Real-world floor" value="None" />
        <ComparisonRow y={232} label="Founder accountability" value="Anonymous" />
      </g>

      {/* PoG column */}
      <g>
        <rect x="380" y="20" rx="14" ry="14" width="320" height="240"
          fill="hsl(var(--primary) / 0.06)" stroke="hsl(var(--primary))" />
        <text x="540" y="50" textAnchor="middle"
          fill="hsl(var(--primary))" fontSize="10" letterSpacing="2">
          $ZSOLAR — PROOF OF GENESIS™
        </text>
        <text x="540" y="92" textAnchor="middle"
          fill="hsl(var(--foreground))" fontSize="34" fontFamily="serif">
          $10T+
        </text>
        <text x="540" y="115" textAnchor="middle"
          fill="hsl(var(--muted-foreground))" fontSize="10">
          path · 5 stacked scarcity vectors
        </text>

        <line x1="410" y1="140" x2="670" y2="140"
          stroke="hsl(var(--primary))" strokeOpacity="0.4" />

        <ComparisonRow y={160} label="Backing" value="Verified clean energy" right />
        <ComparisonRow y={184} label="ESG capital" value="Native fit" right />
        <ComparisonRow y={208} label="Real-world floor" value="Subs + redemption + tax" right />
        <ComparisonRow y={232} label="Founder accountability" value="Pact-locked for life" right />
      </g>
    </svg>
  );
}

function ComparisonRow({
  y,
  label,
  value,
  right = false,
}: {
  y: number;
  label: string;
  value: string;
  right?: boolean;
}) {
  const xLabel = right ? 410 : 50;
  const xValue = right ? 670 : 310;
  return (
    <g>
      <text x={xLabel} y={y}
        fill="hsl(var(--muted-foreground))" fontSize="10" letterSpacing="1">
        {label.toUpperCase()}
      </text>
      <text x={xValue} y={y} textAnchor="end"
        fill="hsl(var(--foreground))" fontSize="11">
        {value}
      </text>
    </g>
  );
}
