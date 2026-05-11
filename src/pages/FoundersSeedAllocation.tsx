import { useEffect, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, Printer, RotateCcw, Pencil, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";
import zenLogo from "@/assets/zen-logo-horizontal-transparent.png";

/**
 * Editable in-app twin of ZenSolar_Seed_OnePager_OptionB_v2_FINAL.pdf
 * Every text region is contentEditable; edits persist to localStorage per
 * founder-device. "Reset" wipes back to canonical defaults. "Print" triggers
 * the browser's Save-as-PDF.
 */

const STORAGE_KEY = "founders.seed-allocation.v2";

// ── Canonical default copy (mirrors v2 FINAL PDF) ─────
const DEFAULTS = {
  eyebrow: "FOR LYNDON RIVE  ·  $5M SEED  ·  24-MONTH RUNWAY",
  titleA: "One check. Default-alive.",
  titleB: "Subscriptions fund every LP round after.",
  sub: "$0.25 launch · 2 LP tranches pre-funded by seed · Round 3 onward funded entirely by subscription revenue. By month 18, ZenSolar is the rare crypto-energy company that doesn’t need another raise to keep its market deep.",

  // Allocation rows — [bucket, amount, pct, what]
  alloc: [
    ["Team & Ops (24 mo)", "$3.17M", "63%", "Joseph $250K Y1 / $275K Y2  ·  Michael + 2 eng + growth lead Y1  ·  +data/ML, support, designer Y2  ·  tools & contractors"],
    ["LP Reserve (2 tranches)", "$700K", "14%", "OG launch tranche $200K USDC  ·  Round 2 tranche $500K USDC  ·  seeds Uniswap v3 LP at $0.25 → $0.50"],
    ["User Acquisition", "$430K", "9%", "Targeted paid + creator-led referrals + Proof of Genesis viral loop  →  25K paying subs by month 18"],
    ["Legal / Audits / Patents", "$300K", "6%", "Smart contract audit, securities counsel, TM Stack patent prosecution (Tracks 1–3)"],
    ["Contingency", "$400K", "8%", "Buffer for audit overruns, launch comms, OEM partnership pilots, FX"],
  ] as string[][],
  allocTotal: ["TOTAL", "$5.00M", "100%", "24 months to default-alive — no UA cliff, no liquidity cliff, no salary cliff."],

  lpIntro: "Launch at $0.25 / $ZSOLAR in two tiers. Seed pre-funds the first two LP injections. By the time Round 3 fires, subscription revenue is already auto-injecting more USDC than Round 3 requires. The flywheel turns itself.",
  lp: [
    ["OG · Day 0", "Mainnet launch", "$200K", "800K", "Seed", "$0.25"],
    ["Round 2", "25K paying subs  OR  $0.50 sustained", "$500K", "1.0M", "Seed", "$0.50"],
    ["Round 3", "50K subs  OR  $1.00 sustained  (~mo 18)", "$1.0M+", "1.0M", "Subscription auto-inject", "$1.00+"],
    ["Round 4+", "Programmatic, every halving tier", "$2M+", "Tier-set", "Self-funded", "Tier-priced"],
  ] as string[][],

  whyOptionB: [
    "Cleanest pitch. $5M, not $6.5M — same headline Lyndon already knows.",
    "24-month runway, zero revenue assumed. $208K/mo burn fully loaded.",
    "Founder pay locked. Joseph $250K Y1 / $275K Y2; full team scales in Y2.",
    "Round 3 LP comes from subs. By month 18, $9.99/mo × 50K subs = $6M ARR with 50% auto-injecting to LP.",
    "UA trimmed to $430K. Proof of Genesis receipts do the viral work — every mint is a referral artifact.",
  ],
  selfFunding: "At 25K paying subs (Round 2 trigger): ARR = $3.0M  ·  LP auto-inject = $1.5M/yr.\n\nAt 50K paying subs (Round 3 trigger): ARR = $6.0M  ·  LP auto-inject = $3.0M/yr.\n\nBy month 18 the seed is spent — and subscription revenue is funding all future liquidity. Series A becomes a strategic option, not a survival event.",

  milestones: [
    ["0–3", "Mainnet launch  ·  OG LP tranche live  ·  audit complete", "Token is real, tradeable, audited"],
    ["3–9", "First 5K paying subs  ·  OEM pilot signed (Tesla / SolarEdge / Enphase)", "Distribution proof — not just product"],
    ["9–15", "25K subs  →  Round 2 LP tranche fires", "Seed LP fully deployed; sub revenue compounding"],
    ["15–18", "50K subs  →  Round 3 LP funded by subscriptions", "Self-funded liquidity proven  ·  default-alive"],
    ["18–24", "100K+ subs  ·  multi-OEM live  ·  Series A optional", "Raise on metrics — never on runway pressure"],
  ] as string[][],

  hero: "“$5M. One check. Twenty-four months of runway. Two LP tranches pre-funded. By month eighteen, our subscribers — not our investors — are funding every dollar of liquidity that follows. You write one check, ever.”",
};

type State = typeof DEFAULTS;

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {/* noop */}
  return DEFAULTS;
}

export default function FoundersSeedAllocation() {
  const { user, isLoading } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const preview = isPreviewMode();

  const [state, setState] = useState<State>(loadState);
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {/* noop */}
  }, [state]);

  if (!preview && (isLoading || !ready)) {
    return <div className="flex min-h-[100svh] items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!preview && !user) return <Navigate to="/auth" replace />;
  if (!preview && !isFounder) return <Navigate to="/" replace />;

  const update = <K extends keyof State>(k: K, v: State[K]) => setState((s) => ({ ...s, [k]: v }));
  const updateRow = (k: "alloc" | "lp" | "milestones", i: number, j: number, v: string) =>
    setState((s) => {
      const next = s[k].map((r) => [...r]);
      next[i][j] = v;
      return { ...s, [k]: next };
    });
  const reset = () => { if (confirm("Reset all edits to canonical defaults?")) { setState(DEFAULTS); localStorage.removeItem(STORAGE_KEY); } };
  const doPrint = () => window.print();

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe print:bg-white">
      {/* Sticky toolbar (hidden when printing) */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/founders" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Vault
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-[11px] font-medium hover:bg-card"
              title={editing ? "Lock fields" : "Enable inline editing"}
            >
              {editing ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              {editing ? "View mode" : "Edit mode"}
            </button>
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3 py-1.5 text-[11px] font-medium hover:bg-card">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button onClick={doPrint} className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-medium hover:bg-primary/90">
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-amber-400">
              <Lock className="h-3 w-3" /> Founders
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-10 print:py-2 print:px-6">
        {/* Logo + eyebrow */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-primary pb-3 mb-6">
          <img src={zenLogo} alt="ZenSolar" className="h-10 md:h-11 w-auto" />
          <div className="text-right text-[10px] md:text-xs">
            <span className="font-bold text-primary tracking-widest">SEED ALLOCATION</span>
            <span className="text-muted-foreground"> · v2 Final · Option B · Founders Only</span>
          </div>
        </div>

        {/* Title block */}
        <p className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] text-primary mb-2">
          <Editable on={editing} value={state.eyebrow} onChange={(v) => update("eyebrow", v)} />
        </p>
        <h1 className="font-bold text-3xl md:text-5xl leading-[1.05] tracking-tight mb-3">
          <Editable on={editing} value={state.titleA} onChange={(v) => update("titleA", v)} />{" "}
          <span className="text-primary">
            <Editable on={editing} value={state.titleB} onChange={(v) => update("titleB", v)} />
          </span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 max-w-3xl">
          <Editable on={editing} value={state.sub} onChange={(v) => update("sub", v)} multiline />
        </p>

        {/* Allocation table */}
        <SectionTitle>The $5M Allocation</SectionTitle>
        <div className="overflow-x-auto rounded-xl border border-border mb-10">
          <table className="w-full text-sm">
            <thead className="bg-foreground text-background">
              <tr>
                <Th className="w-[22%]">Bucket</Th>
                <Th className="w-[10%]">Amount</Th>
                <Th className="w-[7%]">%</Th>
                <Th>What it buys</Th>
              </tr>
            </thead>
            <tbody>
              {state.alloc.map((row, i) => (
                <tr key={i} className={i % 2 ? "bg-muted/30" : ""}>
                  {row.map((cell, j) => (
                    <Td key={j} mono={j === 1 || j === 2} accent={j === 1 || j === 2}>
                      <Editable on={editing} value={cell} onChange={(v) => updateRow("alloc", i, j, v)} multiline={j === 3} />
                    </Td>
                  ))}
                </tr>
              ))}
              <tr className="bg-primary text-primary-foreground font-bold">
                {state.allocTotal.map((c, j) => (
                  <Td key={j} mono={j === 1 || j === 2}>
                    <Editable on={editing} value={c} onChange={(v) => setState((s) => { const next = [...s.allocTotal]; next[j] = v; return { ...s, allocTotal: next as any }; })} multiline={j === 3} />
                  </Td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* LP Tranche */}
        <SectionTitle>LP Tranche Strategy — Why Only Two in Seed</SectionTitle>
        <p className="text-sm text-foreground/90 leading-relaxed mb-3 max-w-3xl">
          <Editable on={editing} value={state.lpIntro} onChange={(v) => update("lpIntro", v)} multiline />
        </p>
        <div className="overflow-x-auto rounded-xl border border-border mb-10">
          <table className="w-full text-[13px]">
            <thead className="bg-foreground text-background">
              <tr>
                <Th>Round</Th><Th>Trigger</Th><Th>USDC In</Th><Th>$ZSOLAR In</Th><Th>Source</Th><Th>Implied Price</Th>
              </tr>
            </thead>
            <tbody>
              {state.lp.map((row, i) => (
                <tr key={i} className={i === 2 ? "bg-primary/10 font-semibold" : i % 2 ? "bg-muted/30" : ""}>
                  {row.map((c, j) => (
                    <Td key={j} accent={j === 5}>
                      <Editable on={editing} value={c} onChange={(v) => updateRow("lp", i, j, v)} />
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why Option B + Self-Funding */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="rounded-xl border-t-2 border-primary bg-primary/5 p-5">
            <h3 className="text-[11px] font-bold tracking-widest text-primary mb-3">THE SELF-FUNDING MOMENT</h3>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              <Editable on={editing} value={state.selfFunding} onChange={(v) => update("selfFunding", v)} multiline />
            </p>
          </div>
        </div>

        {/* Milestones */}
        <SectionTitle>24-Month Milestone Path</SectionTitle>
        <div className="overflow-x-auto rounded-xl border border-border mb-10">
          <table className="w-full text-sm">
            <thead className="bg-foreground text-background">
              <tr>
                <Th className="w-[10%]">Month</Th><Th className="w-[50%]">Milestone</Th><Th>Why it matters</Th>
              </tr>
            </thead>
            <tbody>
              {state.milestones.map((row, i) => (
                <tr key={i} className={i === 3 ? "bg-primary/10 font-semibold" : i % 2 ? "bg-muted/30" : ""}>
                  {row.map((c, j) => (
                    <Td key={j} accent={j === 0}>
                      <Editable on={editing} value={c} onChange={(v) => updateRow("milestones", i, j, v)} multiline={j !== 0} />
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hero quote */}
        <blockquote className="rounded-xl bg-foreground text-background px-7 py-6 border-l-4 border-r-4 border-primary text-center italic text-base md:text-xl leading-relaxed mb-6">
          <Editable on={editing} value={state.hero} onChange={(v) => update("hero", v)} multiline className="block" />
        </blockquote>

        <div className="border-t border-border/60 pt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          ZenSolar · Confidential · Founders Only · v2 Final · Option B selected · Companion to /founders/the-ask
        </div>
      </main>

      {/* Print-only tweaks */}
      <style>{`
        @media print {
          @page { size: Letter; margin: 0.5in; }
          html, body { background: white !important; }
          [contenteditable] { outline: none !important; background: transparent !important; }
        }
      `}</style>
    </div>
  );
}

// ── Editable inline cell ─────────────────────────────
function Editable({
  on, value, onChange, multiline = false, className = "",
}: { on: boolean; value: string; onChange: (v: string) => void; multiline?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Sync external value changes (e.g. Reset) without breaking caret while typing
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) ref.current.innerText = value;
  }, [value]);
  return (
    <span
      ref={ref}
      contentEditable={on}
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.innerText)}
      className={`${className} ${on ? "rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/40 hover:bg-primary/[0.04] px-0.5 -mx-0.5" : ""} ${multiline ? "whitespace-pre-wrap" : ""}`}
    >
      {value}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold tracking-[0.18em] text-primary uppercase mb-3 mt-2">{children}</h2>;
}
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2.5 ${className}`}>{children}</th>;
}
function Td({ children, mono = false, accent = false }: { children: React.ReactNode; mono?: boolean; accent?: boolean }) {
  return <td className={`align-middle px-3 py-2.5 ${mono ? "tabular-nums" : ""} ${accent ? "font-semibold text-primary" : ""}`}>{children}</td>;
}
