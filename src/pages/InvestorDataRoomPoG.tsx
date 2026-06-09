import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Radio, ShieldCheck, Zap, Wallet } from "lucide-react";
import { DeckCard, CardKicker } from "@/components/investor/pitch/v3/DeckCard";

function Kicker({ children }: { children: React.ReactNode }) {
  return <CardKicker className="text-secondary/80 mb-3">{children}</CardKicker>;
}

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

const comparison = {
  left: {
    sublabel: "Proof-of-Work",
    label: "Bitcoin",
    rows: [
      { stat: "~1,400,000 kWh", desc: "per coin" },
      { stat: "Energy intensive", desc: "centralized mining" },
      { stat: "No real-world tie", desc: "value detached from physical assets" },
    ],
  },
  right: {
    sublabel: "Proof-of-Genesis™ (PoG)",
    label: "$ZSOLAR",
    rows: [
      { stat: "1 kWh", desc: "of clean energy per $ZSOLAR" },
      { stat: "Energy efficient", desc: "distributed across real homes" },
      { stat: "Directly tied", desc: "to verified clean energy generation" },
    ],
  },
};

const steps = [
  {
    icon: Radio,
    title: "Real-time telemetry",
    desc: "Live device data from Tesla, Enphase, SolarEdge, and Wallbox.",
  },
  {
    icon: ShieldCheck,
    title: "Cryptographic verification",
    desc: "Validated by the Proof-of-Genesis™ protocol against physics + device watermarks.",
  },
  {
    icon: Zap,
    title: "Minting in 30–60s",
    desc: "Verified kWh converted to $ZSOLAR in a single settlement cycle.",
  },
  {
    icon: Wallet,
    title: "$ZSOLAR issued",
    desc: "Tokens delivered directly to the user's wallet on Base.",
  },
];

const stack = [
  {
    name: "Mint-on-Proof™",
    desc: "Tokens are only minted when verified clean-energy proof is submitted on-chain — never against unverifiable claims.",
  },
  {
    name: "Proof-of-Delta™",
    desc: "Compares interval-level device readings against expected physics to reject spoofed or replayed data.",
  },
  {
    name: "Proof-of-Origin™",
    desc: "Cryptographically binds each kWh to a specific verified device and owner, preventing double-counting.",
  },
];

export default function InvestorDataRoomPoG() {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] text-white">
      <Helmet>
        <title>ZenSolar · Proof-of-Genesis Deep Dive</title>
        <meta
          name="description"
          content="Proof-of-Genesis™ technology deep dive — the verification protocol that mints currency from verified clean energy."
        />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://www.zensolar.com/investor/data-room/pog" />
      </Helmet>

      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16">
        {/* Top nav */}
        <div className="flex items-center justify-between gap-4 mb-10 text-[12px] font-mono tracking-[0.18em] uppercase">
          <Link to="/investor/data-room" className="text-white/45 hover:text-white transition">
            ← Back to Data Room
          </Link>
          <Link to="/deck" className="text-white/45 hover:text-white transition">
            View Deck →
          </Link>
        </div>

        {/* Hero */}
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
          Confidential — For verified investors only
        </p>
        <p className="mt-3 text-[14px] font-mono tracking-[0.28em] uppercase text-secondary/80 mb-4">
          Proof-of-Genesis™
        </p>
        <h1 className="text-[44px] md:text-[56px] font-semibold leading-[1.05] tracking-tight max-w-[1100px]">
          The Verification Protocol That Turns Clean Energy Into Currency
        </h1>
        <p className="mt-5 text-[18px] md:text-[20px] text-white/60 max-w-[900px] leading-relaxed">
          Bitcoin-grade cryptographic integrity at ~0.001% of the energy cost.
        </p>
        <div
          className="mt-6 h-px w-full"
          style={{
            background:
              "linear-gradient(to right, hsl(var(--secondary) / 0.55), hsl(var(--secondary) / 0.15) 40%, transparent)",
            boxShadow: "0 0 12px hsl(var(--secondary) / 0.35)",
          }}
        />

        {/* Bitcoin vs PoG */}
        <div className="mt-10">
          <DeckCard emphasized className="!p-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-secondary/20">
              {/* Left — Bitcoin */}
              <div className="p-8 md:p-10 flex flex-col">
                <CardKicker className="text-white/40">{comparison.left.sublabel}</CardKicker>
                <p className="text-[36px] md:text-[44px] font-semibold text-white/55 mt-2 leading-none">
                  {comparison.left.label}
                </p>
                <div className="mt-8 space-y-6 flex-1">
                  {comparison.left.rows.map((r) => (
                    <div key={r.stat}>
                      <p className="text-[22px] md:text-[26px] font-semibold text-white/55 leading-tight">
                        {r.stat}
                      </p>
                      <p className="text-[14px] text-white/40 mt-1">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — PoG */}
              <div
                className="p-8 md:p-10 flex flex-col relative"
                style={{
                  background:
                    "radial-gradient(ellipse at right, hsl(45 96% 56% / 0.08), transparent 60%)",
                }}
              >
                <CardKicker className="text-amber-400/80">{comparison.right.sublabel}</CardKicker>
                <p className="text-[36px] md:text-[44px] font-semibold text-white mt-2 leading-none">
                  {comparison.right.label}
                </p>
                <div className="mt-8 space-y-6 flex-1">
                  {comparison.right.rows.map((r) => (
                    <div key={r.stat}>
                      <p className="text-[22px] md:text-[26px] font-semibold text-amber-400 leading-tight">
                        {r.stat}
                      </p>
                      <p className="text-[14px] text-white/65 mt-1">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DeckCard>
        </div>

        <GlowDivider />

        {/* How It Works */}
        <DeckCard>
          <Kicker>02 · How It Works</Kicker>
          <h2 className="text-[28px] md:text-[32px] font-semibold leading-tight">
            From verified kWh to wallet in under a minute
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-xl border border-border/60 bg-card/30 p-5 flex flex-col"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg border border-sky-400/30 bg-sky-400/10 flex items-center justify-center">
                    <s.icon className="w-4.5 h-4.5 text-sky-400" />
                  </div>
                  <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-white/40">
                    Step {i + 1}
                  </span>
                </div>
                <p className="mt-4 text-[16px] font-semibold text-white">{s.title}</p>
                <p className="mt-1.5 text-[13.5px] text-white/60 leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </DeckCard>

        {/* Tech Stack */}
        <div className="mt-6">
          <DeckCard>
            <Kicker>03 · Technology Stack</Kicker>
            <h2 className="text-[28px] md:text-[32px] font-semibold leading-tight">
              Three patent-pending layers
            </h2>
            <p className="mt-3 text-[15px] text-white/60 max-w-[900px] leading-relaxed">
              Each layer of PoG protects a different attack surface — together they make every
              minted token cryptographically defensible.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {stack.map((s) => (
                <div
                  key={s.name}
                  className="rounded-xl border border-secondary/30 bg-secondary/5 p-5"
                >
                  <p className="text-[17px] font-semibold text-white">{s.name}</p>
                  <p className="mt-2 text-[13.5px] text-white/65 leading-snug">{s.desc}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[12px] font-mono tracking-[0.14em] uppercase text-white/40">
              Architected across L1–L4: device telemetry → verification → settlement → on-chain anchor.
            </p>
          </DeckCard>
        </div>

        {/* Multi-OEM Moat */}
        <div className="mt-6">
          <DeckCard emphasized>
            <Kicker>04 · The Real Moat</Kicker>
            <h2 className="text-[28px] md:text-[32px] font-semibold leading-tight">
              The only protocol verifying multiple major OEMs in one unified system
            </h2>
            <p className="mt-3 text-[16px] text-white/70 max-w-[900px] leading-relaxed">
              PoG is currently the only verification protocol capable of ingesting and minting from
              Tesla, Enphase, SolarEdge, and Wallbox in a single unified system. Every additional
              OEM compounds the moat — and the dataset.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {["Tesla", "Enphase", "SolarEdge", "Wallbox"].map((oem) => (
                <span
                  key={oem}
                  className="px-3 py-1.5 rounded-md text-[13px] border border-sky-400/30 bg-sky-400/10 text-white/85"
                >
                  {oem}
                </span>
              ))}
            </div>

            <p className="mt-6 text-[14px] text-white/55 italic max-w-[900px] leading-snug">
              This unified verification layer is the foundation for both Token Economics and the
              high-margin Aggregated Data business.
            </p>
          </DeckCard>
        </div>

        {/* Live Proof */}
        <div className="mt-6">
          <DeckCard>
            <Kicker>05 · Live Proof</Kicker>
            <h2 className="text-[28px] md:text-[32px] font-semibold leading-tight">
              See it in production
            </h2>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                to="/proof-of-genesis/preview"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary/20 transition text-[15px] font-medium"
              >
                See a real Proof-of-Genesis™ receipt <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[13px] text-white/50 italic">
                Verified clean energy → minted $ZSOLAR in under 60 seconds.
              </p>
            </div>
          </DeckCard>
        </div>

        {/* Patent & IP */}
        <div className="mt-6">
          <DeckCard>
            <Kicker>06 · Patent &amp; IP</Kicker>
            <h2 className="text-[28px] md:text-[32px] font-semibold leading-tight">
              Patent-pending protocol
            </h2>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-md text-[12px] font-medium border border-secondary/30 bg-secondary/10 text-white/85">
                U.S. App. 19/634,402 · Patent-pending
              </span>
            </div>

            <p className="mt-5 text-[12px] font-mono tracking-[0.18em] uppercase text-white/45 mb-3">
              Protected Innovations
            </p>
            <div className="flex flex-wrap gap-2">
              {["Mint-on-Proof™", "Proof-of-Delta™", "Proof-of-Origin™"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 rounded-md text-[13px] border border-secondary/30 bg-secondary/10 text-white/85"
                >
                  {t}
                </span>
              ))}
            </div>
          </DeckCard>
        </div>

        {/* Why It Matters */}
        <div className="mt-6">
          <DeckCard>
            <Kicker>07 · Why It Matters</Kicker>
            <p className="text-[18px] md:text-[20px] text-white/80 leading-relaxed max-w-[1000px]">
              Proof-of-Genesis™ is the trust layer that makes every verified kWh, every tokenized
              action, and every data point credible. It is the foundation for Token Economics, the
              Aggregated Data business, and the ZenSolar VPP.
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
