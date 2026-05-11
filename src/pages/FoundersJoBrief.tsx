import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, Loader2, Lock, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";

const PDF_PATH = "/founder-docs/jo-fertier-prebrief-v1.pdf";

const COMPETITORS = [
  { name: "ZenSolar", verification: "SEGI™ + Proof-of-Delta™ (API, cryptographic)", supply: "Mint-on-Proof™ · 1T cap · 20% burn", liquidity: "POL flywheel ($200K seed → tranches)", ip: "Patent-pending · 5 TMs filed", status: "Live beta (beta.zen.solar)", us: true },
  { name: "SolarCoin", verification: "Self-report (upload screenshot)", supply: "98B pre-minted pool", liquidity: "Negligible (no real LP)", ip: "None", status: "Dormant (since 2014)" },
  { name: "GridPay", verification: "ERCOT meter only (no IP disclosed)", supply: "Not disclosed", liquidity: "Arbitrum hackathon project", ip: "None known", status: "TX-only · Mar 2026" },
  { name: "Power Ledger", verification: "Hardware-dependent", supply: "Pre-minted POWR", liquidity: "Listed but thin", ip: "None known", status: "Australia P2P" },
  { name: "C+Charge", verification: "Carbon-credit claim only", supply: "ICO pre-mint", liquidity: "Low volume", ip: "None", status: "EV charging" },
];

export default function FoundersJoBrief() {
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

      <section className="max-w-5xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary mb-3">Pre-Meeting Brief · v1</p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.0] tracking-tight">
          Jo Fertier <span className="italic text-primary">— Lyndon Rive</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Direct answers to your three questions before the calendar invite. Forward-friendly, scannable in 90 seconds.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-6">
        <div className="flex flex-wrap gap-3">
          <a href={PDF_PATH} download="ZenSolar_Jo_Fertier_Prebrief_v1.pdf"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90">
            <Download className="h-4 w-4" /> Download PDF
          </a>
          <a href={PDF_PATH} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-5 py-2.5 text-sm font-medium hover:bg-card">
            <ExternalLink className="h-4 w-4" /> Open in new tab
          </a>
        </div>
      </section>

      {/* Q1 — Competitive */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <SectionHeader num="Q1" title="Competitive landscape — why we're not SolarCoin" />
        <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {["Project", "Verification", "Supply", "Liquidity", "IP", "Status"].map((h) => (
                  <th key={h} className="text-left font-semibold px-3 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((row) => (
                <tr key={row.name} className={`border-t border-border/50 ${row.us ? "bg-primary/5" : ""}`}>
                  <td className={`px-3 py-2.5 font-semibold ${row.us ? "text-primary" : "text-foreground"}`}>{row.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.verification}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.supply}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.liquidity}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.ip}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-5 space-y-3">
          <Reason label="Verification."
            body="SolarCoin = honor-system uploads. ZenSolar = SEGI™ pulls device APIs (Tesla, Enphase, Wallbox) and signs every kWh into Proof-of-Delta™ before any token exists." />
          <Reason label="Supply."
            body="SolarCoin distributes from a 98B pre-minted pool. ZenSolar tokens only come into existence when verified energy flows — 1T hard cap, 20% burn-per-mint, founders pact-locked." />
          <Reason label="Moat."
            body="SolarCoin: dead since 2014, no patents, no LP. ZenSolar: live OEM rails, POL flywheel, patent-pending SEGI™, 5 trademarks filed, multi-vertical (solar + battery + EV + charging)." />
        </ul>
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">GridPay (Mar 2026):</span> ERCOT-only solo-founder hackathon project, no verification IP. Confirms the category is real — validates our nationwide multi-vertical moat.
        </p>
      </section>

      {/* Q2 — Ask */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-10">
        <SectionHeader num="Q2" title="The Ask from Lyndon" />
        <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 md:p-6">
          <p className="text-lg md:text-xl font-bold text-foreground leading-snug">
            Board seat — co-shape the tokenized energy economy from day one.
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Not a check. Lyndon's operator credibility + the SolarCity/Tesla network unlock utility partnerships and OEM rails faster than any capital can.
          </p>
        </div>
      </section>

      {/* Q3 — Traction */}
      <section className="max-w-5xl mx-auto px-5 md:px-6 pb-12">
        <SectionHeader num="Q3" title="Going live to see traction — what's real today" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ProofCard eyebrow="LIVE PRODUCT" headline="beta.zen.solar"
            body="Fully functional: embedded Coinbase Wallet, Tap-to-Mint™, $ZSOLAR on Base L2. No install — open the URL, mint a token." />
          <ProofCard eyebrow="OEM RAILS LIVE" headline="4 providers · 4 real users"
            body="Tesla ✓ · Enphase ✓ · Wallbox ✓ · SolarEdge (code-ready). Production data flowing for Joseph, Tschida, Pessah, Golson." />
          <ProofCard eyebrow="IP FILED" headline="Patent + 5 trademarks"
            body="SEGI™ provisional (Q1 2025). Mint-on-Proof™, Proof-of-Delta™, Proof-of-Origin™, Proof-of-Genesis™, Tap-to-Mint™. Device Watermark Registry on-chain spec." />
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-5 md:px-6 py-8 border-t border-border/40 flex flex-wrap gap-2 justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><FileText className="h-3 w-3" /> ZenSolar · Confidential · Eyes-only: Jo Fertier</span>
        <a href="https://beta.zen.solar" className="hover:text-primary">beta.zen.solar</a>
      </footer>
    </div>
  );
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="text-xs font-bold text-primary tracking-widest">{num}</span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

function Reason({ label, body }: { label: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="text-primary mt-0.5">▸</span>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">{label}</span> {body}
      </p>
    </li>
  );
}

function ProofCard({ eyebrow, headline, body }: { eyebrow: string; headline: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
      <p className="mt-2 text-base font-semibold text-foreground leading-snug">{headline}</p>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
