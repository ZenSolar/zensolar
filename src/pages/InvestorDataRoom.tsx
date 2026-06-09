import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Network, Clock } from "lucide-react";
import { DeckCard, CardKicker } from "@/components/investor/pitch/v3/DeckCard";
import { ProofOfGenesisArchitectureDiagram } from "@/components/admin/patent/ProofOfGenesisArchitectureDiagram";

function GlowDivider() {
  return (
    <div
      className="my-12 h-px w-full"
      style={{
        background:
          "linear-gradient(to right, hsl(var(--secondary) / 0.55), hsl(var(--secondary) / 0.15) 40%, transparent)",
        boxShadow: "0 0 12px hsl(var(--secondary) / 0.35)",
      }}
    />
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <CardKicker className="text-secondary/80 mb-3">{children}</CardKicker>;
}

function StatTile({
  value,
  label,
  emphasized,
}: {
  value: string;
  label: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        emphasized ? "border-secondary/40 bg-secondary/5" : "border-border/60 bg-card/30"
      }`}
    >
      <div className={`text-[26px] font-semibold leading-none ${emphasized ? "text-secondary" : "text-white"}`}>
        {value}
      </div>
      <div className="mt-2 text-[12px] uppercase tracking-[0.14em] text-white/45 font-mono">
        {label}
      </div>
    </div>
  );
}

function DataRoomContent() {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] text-white">
      <Helmet>
        <title>ZenSolar · Investor Data Room</title>
        <meta name="description" content="ZenSolar investor data room — Proof-of-Genesis™, VPP, aggregated data, use of funds, traction, and IP." />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://www.zensolar.com/investor/data-room" />
      </Helmet>

      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16">
        {/* Top nav */}
        <div className="flex items-center justify-between gap-4 mb-10 text-[12px] font-mono tracking-[0.18em] uppercase">
          <Link to="/investor/pitch" className="text-white/45 hover:text-white transition">
            ← Back to Pitch
          </Link>
          <Link to="/deck" className="text-white/45 hover:text-white transition">
            View Deck →
          </Link>
        </div>

        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Confidential — For verified investors only</p>
        <p className="mt-3 text-[14px] font-mono tracking-[0.28em] uppercase text-secondary/80 mb-4">
          Confidential · Investor Data Room
        </p>
        <h1 className="text-[48px] md:text-[56px] font-semibold leading-[1.05] tracking-tight">
          Investor Data Room
        </h1>
        <p className="mt-4 text-[18px] md:text-[20px] text-white/55 max-w-[900px] leading-relaxed">
          Deeper materials behind the seed deck — technology, revenue engines,
          raise milestones, traction, and IP.
        </p>
        <div
          className="mt-6 h-px w-full"
          style={{
            background:
              "linear-gradient(to right, hsl(var(--secondary) / 0.55), hsl(var(--secondary) / 0.15) 40%, transparent)",
            boxShadow: "0 0 12px hsl(var(--secondary) / 0.35)",
          }}
        />

        {/* Group 1 */}
        <div className="mt-12 space-y-6">
          {/* 1. PoG */}
          <DeckCard>
            <Kicker>01 · Technology</Kicker>
            <h2 className="text-[32px] font-semibold leading-tight">
              Proof-of-Genesis<span className="text-secondary">™</span> Deep Dive
            </h2>
            <p className="mt-3 text-[16px] text-white/65 leading-relaxed max-w-[900px]">
              The first real-time, multi-OEM verification protocol that mints
              currency directly from verified clean energy. PoG ingests telemetry
              from Tesla, Enphase, SolarEdge, and Wallbox, validates it against
              physics + device watermarks, and mints $ZSOLAR in 30–60 seconds.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className="px-3 py-1.5 rounded-md text-[13px] border border-sky-400/30 bg-sky-400/10 text-white/85 inline-flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-sky-400" /> Real-time
              </span>
              <span className="px-3 py-1.5 rounded-md text-[13px] border border-sky-400/30 bg-sky-400/10 text-white/85 inline-flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-sky-400" /> Multi-OEM (Tesla · Enphase · SolarEdge · Wallbox)
              </span>
              <span className="px-3 py-1.5 rounded-md text-[13px] border border-sky-400/30 bg-sky-400/10 text-white/85 inline-flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> 30–60s minting
              </span>
            </div>

            <div className="mt-8 rounded-xl border border-border/50 bg-black/30 p-2 sm:p-4 overflow-hidden">
              <ProofOfGenesisArchitectureDiagram />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                to="/proof-of-genesis/preview"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary/20 transition text-[14px] font-medium"
              >
                See live PoG receipt example <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/investor/data-room/pog"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/60 bg-card/30 text-white/85 hover:bg-card/50 transition text-[14px] font-medium"
              >
                Read full PoG deep dive <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[12px] font-mono tracking-[0.14em] uppercase text-white/35">
                Patent-pending · U.S. App. 19/634,402
              </p>
            </div>
          </DeckCard>

          {/* 2. VPP */}
          <DeckCard emphasized>
            <Kicker>02 · Virtual Power Plant</Kicker>
            <h2 className="text-[32px] font-semibold leading-tight">
              ZenSolar VPP — First Crypto-Rewarding Virtual Power Plant
            </h2>
            <p className="mt-3 text-[16px] text-white/70 leading-relaxed max-w-[900px]">
              The first VPP that issues crypto rewards directly via
              Proof-of-Genesis<span className="text-secondary">™</span>. When
              the grid calls, participating homes dispatch — and earn cash plus
              $ZSOLAR in the same settlement cycle.
            </p>

            <div className="mt-6">
              <p className="text-[12px] font-mono tracking-[0.18em] uppercase text-white/45 mb-3">
                Settlement Split
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatTile value="50%" label="LP (Liquidity)" emphasized />
                <StatTile value="30%" label="User Cash" />
                <StatTile value="15%" label="Ops" />
                <StatTile value="5%" label="Tokens" />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[12px] font-mono tracking-[0.18em] uppercase text-white/45 mb-3">
                Phase 2 Path
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[15px] text-white/80">
                <span className="px-3 py-1.5 rounded-md border border-border/60 bg-card/30">Leap</span>
                <ArrowRight className="w-4 h-4 text-white/30" />
                <span className="px-3 py-1.5 rounded-md border border-border/60 bg-card/30">CAISO</span>
                <ArrowRight className="w-4 h-4 text-white/30" />
                <span className="px-3 py-1.5 rounded-md border border-border/60 bg-card/30">
                  OEM partner-tier APIs
                </span>
              </div>
            </div>

            <p className="mt-6 text-[13px] text-white/45 italic leading-snug max-w-[900px]">
              U.S. VPP capacity is projected to grow from ~30 GW today to 80–160 GW
              by 2030 (DOE) — a structurally expanding settlement layer.
            </p>
          </DeckCard>

          {/* 3. Aggregated Data */}
          <DeckCard>
            <Kicker>03 · Aggregated Data</Kicker>
            <h2 className="text-[32px] font-semibold leading-tight">
              Aggregated Data Opportunity
            </h2>
            <p className="mt-3 text-[16px] text-white/65 leading-relaxed max-w-[900px]">
              A high-margin, anonymized multi-OEM data business that emerges
              naturally from PoG. Every verified kWh creates a clean,
              cross-OEM dataset that is uniquely difficult to replicate.
            </p>

            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-[12px] font-mono tracking-[0.18em] uppercase text-white/45 mb-3">
                  Target Buyers
                </p>
                <ul className="space-y-2 text-[15px] text-white/75">
                  <li>· Utilities &amp; load-serving entities</li>
                  <li>· ISOs / RTOs (CAISO, ERCOT, PJM)</li>
                  <li>· REC registries &amp; carbon markets</li>
                  <li>· Climate &amp; ESG platforms</li>
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <StatTile value="$2B+" label="U.S. Utility Analytics TAM" emphasized />
                <p className="text-[13px] text-white/45 italic leading-snug">
                  Margin and ARPU scale as the verified-device network grows —
                  data value compounds with coverage.
                </p>
              </div>
            </div>
          </DeckCard>
        </div>

        <GlowDivider />

        {/* Group 2 */}
        <div className="space-y-6">
          {/* 4. Use of Funds */}
          <DeckCard>
            <Kicker>04 · Use of Funds</Kicker>
            <h2 className="text-[32px] font-semibold leading-tight">
              $5M Seed — Use of Funds &amp; Milestones
            </h2>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile value="45%" label="Engineering / Product" emphasized />
              <StatTile value="30%" label="GTM / Beta Expansion" />
              <StatTile value="15%" label="Ops / Legal / IP" />
              <StatTile value="10%" label="Reserve" />
            </div>

            <div className="mt-8">
              <p className="text-[12px] font-mono tracking-[0.18em] uppercase text-white/45 mb-3">
                Key Milestones (18 months)
              </p>
              <ul className="space-y-2.5 text-[15px] text-white/75 leading-relaxed">
                <li>· Mainnet anchor switch + LP Round 1 ($200K USDC + 2M $ZSOLAR @ $0.10)</li>
                <li>· 10,000+ verified homes across Tesla, Enphase, SolarEdge, Wallbox</li>
                <li>· VPP Phase 2 live (Leap pilot → CAISO settlement)</li>
                <li>· Aggregated data product — first 3 utility / ISO contracts</li>
                <li>· Utility patent issuance + 2 continuations filed</li>
              </ul>
            </div>
          </DeckCard>

          {/* 5. Traction */}
          <DeckCard>
            <Kicker>05 · Traction</Kicker>
            <h2 className="text-[32px] font-semibold leading-tight">Traction &amp; Metrics</h2>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatTile value="40+" label="Active Beta Users" />
              <StatTile value="1.2M+ kWh" label="Verified to Date" emphasized />
              <StatTile value="18,000+" label="PoG Mints" />
            </div>

            <div className="mt-8 space-y-3">
              <blockquote className="border-l-2 border-secondary/50 pl-4 text-[15px] text-white/70 italic">
                "First time my solar production has felt like it's actually <em>mine</em>."{" "}
                <span className="not-italic text-white/40">— Beta user, Austin</span>
              </blockquote>
              <blockquote className="border-l-2 border-secondary/50 pl-4 text-[15px] text-white/70 italic">
                "Setup took 90 seconds. I was minting before my coffee finished."{" "}
                <span className="not-italic text-white/40">— Beta user, Bay Area</span>
              </blockquote>
            </div>
          </DeckCard>

          {/* 6. Legal & IP */}
          <DeckCard>
            <Kicker>06 · Legal &amp; IP</Kicker>
            <h2 className="text-[32px] font-semibold leading-tight">Legal &amp; IP Summary</h2>

            <div className="mt-6 space-y-4 text-[15px] text-white/70 leading-relaxed">
              <p>
                <span className="text-white/90 font-semibold">Patent status:</span>{" "}
                One utility application filed (U.S. App. 19/634,402) covering
                Mint-on-Proof™, Proof-of-Delta™, and Proof-of-Origin™. Two
                continuation tracks planned.
              </p>
              <p>
                <span className="text-white/90 font-semibold">Trademark portfolio:</span>{" "}
                Proof-of-Genesis™, Tap-to-Mint™, Mint-on-Proof™, Proof-of-Delta™,
                Proof-of-Origin™.
              </p>
              <p>
                <span className="text-white/90 font-semibold">Entity:</span> ZenSolar,
                LLC · Austin, TX.
              </p>
              <p>
                <span className="text-white/90 font-semibold">Founders:</span> Joseph
                Maushart + Michael Tschida.
              </p>
            </div>

            <p className="mt-6 text-[13px] font-mono tracking-[0.14em] uppercase text-white/40">
              Diligence requests:{" "}
              <a
                href="mailto:joe@zensolar.com?subject=ZenSolar%20Diligence%20Request"
                className="text-secondary hover:text-secondary/80"
              >
                joe@zensolar.com
              </a>
            </p>
          </DeckCard>
        </div>

        <footer className="mt-16 border-t border-border/40 py-6 text-center">
          <p className="text-[11px] text-white/40 font-mono tracking-[0.18em] uppercase">
            ZenSolar, LLC · Confidential under NDA
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function InvestorDataRoom() {
  useEffect(() => {
    document.title = "ZenSolar · Investor Data Room";
  }, []);
  return <DataRoomContent />;
}
