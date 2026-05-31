import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Sparkles,
  PlugZap,
  ShieldCheck,
  Coins,
  Zap,
  Flame,
  Droplet,
  Lock,
  Layers,
  Fingerprint,
  TrendingUp,
  Rocket,
  Users,
  HelpCircle,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { PitchDeckShell } from "@/components/investor/pitch/PitchDeckShell";
import { SlideLayout, SlideHeader, SlideFooter } from "@/components/investor/pitch/SlideLayout";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";

/**
 * Companion classic pitch deck for /founders/seed-pitch-greg.
 * 12 slides, on-brand (ZenSolar dark + emerald primary), built on the
 * existing PitchDeckShell at 1920x1080 with full-screen and grid modes.
 */

const PRIMARY = "hsl(158,84%,52%)"; // ZenSolar emerald
const PRIMARY_SOFT = "hsl(158,84%,52% / 0.10)";

function Brand() {
  return (
    <div className="absolute top-8 left-16 z-20 flex items-center gap-3">
      <img
        src={zenLogo}
        alt="ZenSolar"
        className="h-12 w-auto drop-shadow-[0_0_24px_hsl(158_84%_52%_/_0.35)]"
      />
    </div>
  );
}

function Kicker({ children, color = PRIMARY }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[15px] font-mono tracking-[0.28em] uppercase mb-6"
      style={{ color }}
    >
      {children}
    </p>
  );
}

function Title({ children, size = "text-[88px]" }: { children: React.ReactNode; size?: string }) {
  return (
    <h2 className={`font-serif ${size} leading-[1.02] tracking-tight text-white`}>
      {children}
    </h2>
  );
}

function GlassCard({
  children,
  className = "",
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-md ${className}`}
      style={{
        background: accent ? "hsl(158,84%,52% / 0.08)" : "hsl(220,20%,12% / 0.7)",
        border: accent ? "1px solid hsl(158,84%,52% / 0.35)" : "1px solid hsl(220,15%,28%)",
        boxShadow: accent ? "0 0 40px hsl(158,84%,52% / 0.12)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SLIDES                                                             */
/* ------------------------------------------------------------------ */

// 01 — COVER
const SlideCover = () => (
  <SlideLayout variant="gradient">
    <Brand />
    {/* Ambient glow */}
    <div
      className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full blur-[140px]"
      style={{ background: "hsl(158,84%,52% / 0.18)" }}
    />
    <div
      className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[160px]"
      style={{ background: "hsl(207,90%,54% / 0.10)" }}
    />

    <div className="absolute inset-0 px-32 flex flex-col justify-center">
      <Kicker>Seed Narrative Review · v3.0 Draft</Kicker>
      <h1 className="font-serif text-[140px] leading-[0.95] tracking-tight text-white mb-10">
        Currency,<br />
        <span style={{ color: PRIMARY }}>minted from clean energy.</span>
      </h1>
      <p className="text-[34px] text-white/70 max-w-[1400px] leading-snug">
        1 kWh = 1 $ZSOLAR · Hybrid stake-to-unlock throttle
      </p>
      <div className="mt-16 flex items-center gap-6 text-[18px] text-white/40 font-mono tracking-widest uppercase">
        <span>ZenSolar</span>
        <span className="w-px h-4 bg-white/20" />
        <span>For Greg Falesnik · MZ Group</span>
        <span className="w-px h-4 bg-white/20" />
        <span>Confidential</span>
      </div>
    </div>
  </SlideLayout>
);

// 02 — NOTE TO GREG
const SlideNote = () => (
  <SlideLayout variant="dark">
    <SlideHeader label="A Note to Greg" number={2} />
    <Brand />
    <div className="absolute inset-0 px-32 flex flex-col justify-center">
      <Kicker>
        <Sparkles className="inline h-4 w-4 mr-2 -mt-1" /> A Note to Greg
      </Kicker>
      <GlassCard accent className="p-16 max-w-[1500px]">
        <p className="text-[42px] leading-[1.35] text-white/95 font-light">
          Greg — this is a working draft of our seed narrative and capital plan.
          We'd love your candid feedback on the{" "}
          <span className="font-semibold" style={{ color: PRIMARY }}>
            story, positioning, tokenomics clarity, sell-pressure mechanics, and
            overall investor appeal.
          </span>{" "}
          No formal ask at this stage — purely looking for your perspective
          before we finalize.
        </p>
      </GlassCard>
    </div>
    <SlideFooter />
  </SlideLayout>
);

// 03 — CATALYST
const SlideCatalyst = () => (
  <SlideLayout variant="dark">
    <SlideHeader label="The Catalyst" number={3} />
    <Brand />
    <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col">
      <Kicker color="hsl(0,72%,60%)">Why Now</Kicker>
      <Title>
        $40B in clean-energy incentives —<br />
        <span className="text-red-400">repealed.</span>
      </Title>

      <div className="grid grid-cols-3 gap-8 mt-20">
        {[
          { stat: "30%", label: "Solar ITC eliminated" },
          { stat: "$7,500", label: "EV tax credit gone" },
          { stat: "50M+", label: "Households lose the reason to go green" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-10">
            <div className="font-mono text-[80px] text-white leading-none mb-4">
              {s.stat}
            </div>
            <div className="text-[22px] text-white/60">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard accent className="p-10 mt-12">
        <p className="text-[32px] text-white leading-snug">
          ZenSolar replaces a one-time government check with a{" "}
          <span style={{ color: PRIMARY }} className="font-semibold">
            permanent, market-backed reward per kWh.
          </span>
        </p>
      </GlassCard>
    </div>
    <SlideFooter />
  </SlideLayout>
);

// 04 — OPPORTUNITY
const SlideOpportunity = () => (
  <SlideLayout variant="dark">
    <SlideHeader label="The Opportunity" number={4} />
    <Brand />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full blur-[160px] pointer-events-none"
      style={{ background: "hsl(158,84%,52% / 0.10)" }}
    />
    <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col justify-center">
      <Kicker>The Opportunity</Kicker>
      <Title>
        The next <span style={{ color: PRIMARY }}>$10T</span> shift.
      </Title>
      <p className="text-[36px] text-white/70 mt-10 max-w-[1500px] leading-snug">
        Solar, EVs, and batteries scale faster than the grid can settle.
        Yet a kilowatt-hour still has{" "}
        <span className="text-white font-medium">no native asset.</span>
      </p>

      <div className="grid grid-cols-3 gap-6 mt-16">
        {[
          { icon: Zap, label: "$10T+ market" },
          { icon: Layers, label: "No native unit of account" },
          { icon: Rocket, label: "Rails before the rails exist" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-5 px-8 py-7 rounded-2xl"
            style={{ background: "hsl(220,20%,14%)", border: "1px solid hsl(220,15%,28%)" }}
          >
            <div className="p-4 rounded-xl" style={{ background: PRIMARY_SOFT }}>
              <Icon className="h-9 w-9" style={{ color: PRIMARY }} />
            </div>
            <span className="text-[26px] text-white/85">{label}</span>
          </div>
        ))}
      </div>
    </div>
    <SlideFooter />
  </SlideLayout>
);

// 05 — PRODUCT
const SlideProduct = () => (
  <SlideLayout variant="dark">
    <SlideHeader label="The Product" number={5} />
    <Brand />
    <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col">
      <Kicker>The Product · Live Today</Kicker>
      <Title>One tap. Sunlight to $ZSOLAR.</Title>

      <div className="grid grid-cols-3 gap-8 mt-16 flex-1">
        {[
          {
            icon: PlugZap,
            step: "01",
            title: "Connect",
            body: "Tesla, Enphase, SolarEdge, Wallbox — OAuth in under 30 seconds.",
            tag: "OEM APIs live",
          },
          {
            icon: ShieldCheck,
            step: "02",
            title: "Verify",
            body: "Proof-of-Genesis™ signs every kWh and writes a cryptographic proof to Base L2.",
            tag: "Patent-pending",
          },
          {
            icon: Coins,
            step: "03",
            title: "Tap-to-Mint™",
            body: "One tap mints 1 $ZSOLAR per verified kWh into the embedded Coinbase Wallet.",
            tag: "Live on Base",
          },
        ].map((s) => (
          <GlassCard key={s.step} className="p-10 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="p-4 rounded-xl" style={{ background: PRIMARY_SOFT }}>
                <s.icon className="h-10 w-10" style={{ color: PRIMARY }} />
              </div>
              <span className="font-mono text-[20px]" style={{ color: PRIMARY }}>
                {s.step}
              </span>
            </div>
            <div className="font-serif text-[44px] text-white mb-5 leading-tight">
              {s.title}
            </div>
            <p className="text-[22px] text-white/70 leading-snug flex-1">{s.body}</p>
            <div className="mt-8 text-[14px] font-mono uppercase tracking-widest text-white/40">
              {s.tag}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-10 text-[20px] text-white/50 font-mono">
        beta.zen.solar/demo · end-to-end in under 60 seconds
      </div>
    </div>
    <SlideFooter />
  </SlideLayout>
);

// 06 — FLYWHEEL
const SlideFlywheel = () => {
  const nodes = [
    { icon: Zap, label: "Produce kWh" },
    { icon: ShieldCheck, label: "Proof-of-Genesis™" },
    { icon: Coins, label: "Mint 1 $ZSOLAR" },
    { icon: Flame, label: "20% Burn" },
    { icon: Droplet, label: "3% LP" },
    { icon: RefreshCw, label: "Loop tightens" },
  ];
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="The Flywheel" number={6} />
      <Brand />
      <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col">
        <Kicker>The Compounding Flywheel</Kicker>
        <Title>Every kWh tightens the loop.</Title>

        <div className="relative flex-1 flex items-center justify-center mt-12">
          {/* Outer ring glow */}
          <div
            className="absolute w-[680px] h-[680px] rounded-full"
            style={{
              border: "1px dashed hsl(158,84%,52% / 0.35)",
              boxShadow: "inset 0 0 80px hsl(158,84%,52% / 0.06)",
            }}
          />
          <div
            className="absolute w-[680px] h-[680px] rounded-full blur-[100px]"
            style={{ background: "hsl(158,84%,52% / 0.10)" }}
          />
          {/* Center */}
          <div
            className="relative z-10 w-[260px] h-[260px] rounded-full flex flex-col items-center justify-center"
            style={{
              background: "hsl(220,20%,10%)",
              border: "2px solid hsl(158,84%,52% / 0.6)",
              boxShadow: "0 0 60px hsl(158,84%,52% / 0.3)",
            }}
          >
            <div className="font-mono text-[20px]" style={{ color: PRIMARY }}>
              1 kWh
            </div>
            <div className="font-serif text-[52px] text-white leading-none mt-2">=</div>
            <div className="font-mono text-[20px]" style={{ color: PRIMARY }}>
              1 $ZSOLAR
            </div>
          </div>

          {/* Orbit nodes */}
          {nodes.map((n, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const r = 340;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            return (
              <div
                key={n.label}
                className="absolute flex flex-col items-center gap-3"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                <div
                  className="w-[96px] h-[96px] rounded-full flex items-center justify-center"
                  style={{
                    background: "hsl(220,20%,14%)",
                    border: "1px solid hsl(158,84%,52% / 0.4)",
                  }}
                >
                  <n.icon className="h-10 w-10" style={{ color: PRIMARY }} />
                </div>
                <div className="text-[20px] text-white/80 font-medium whitespace-nowrap">
                  {n.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SlideFooter />
    </SlideLayout>
  );
};

// 07 — TOKENOMICS
const SlideTokenomics = () => (
  <SlideLayout variant="dark">
    <SlideHeader label="Tokenomics" number={7} />
    <Brand />
    <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col">
      <Kicker>Tokenomics</Kicker>
      <Title>Built to be scarce. Built to last.</Title>

      <div className="grid grid-cols-4 gap-6 mt-14">
        {[
          { stat: "1T", label: "Hard cap" },
          { stat: "1 : 1", label: "kWh per token" },
          { stat: "$0.10", label: "Launch price" },
          { stat: "4 yr", label: "Halving cadence" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-8 text-center">
            <div className="font-mono text-[64px]" style={{ color: PRIMARY }}>
              {s.stat}
            </div>
            <div className="text-[18px] text-white/60 mt-3 uppercase tracking-widest">
              {s.label}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-4 gap-6">
        {[
          { pct: "75%", who: "User", color: PRIMARY, icon: Wallet },
          { pct: "20%", who: "Burn", color: "hsl(0,72%,60%)", icon: Flame },
          { pct: "3%", who: "LP", color: "hsl(207,90%,60%)", icon: Droplet },
          { pct: "2%", who: "Treasury", color: "hsl(45,90%,60%)", icon: Lock },
        ].map((s) => (
          <div
            key={s.who}
            className="p-8 rounded-2xl flex items-center gap-5"
            style={{
              background: "hsl(220,20%,12%)",
              border: `1px solid ${s.color}55`,
            }}
          >
            <s.icon className="h-10 w-10" style={{ color: s.color }} />
            <div>
              <div className="font-mono text-[40px]" style={{ color: s.color }}>
                {s.pct}
              </div>
              <div className="text-[18px] text-white/60 uppercase tracking-widest">
                {s.who}
              </div>
            </div>
          </div>
        ))}
      </div>

      <GlassCard accent className="p-8 mt-10">
        <div className="flex items-center gap-4">
          <Lock className="h-7 w-7" style={{ color: PRIMARY }} />
          <p className="text-[24px] text-white/90">
            Founders pact-locked:{" "}
            <span className="font-mono" style={{ color: PRIMARY }}>
              Joseph 150B until $6.67
            </span>{" "}
            ·{" "}
            <span className="font-mono" style={{ color: PRIMARY }}>
              Michael 50B until $20
            </span>
          </p>
        </div>
      </GlassCard>
    </div>
    <SlideFooter />
  </SlideLayout>
);

// 08 — SELL-PRESSURE / STAKE-TO-UNLOCK
const SlideThrottle = () => (
  <SlideLayout variant="accent">
    <SlideHeader label="Sell-Pressure Solution" number={8} />
    <Brand />
    <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col">
      <Kicker>How sell pressure is capped</Kicker>
      <Title>
        Hybrid <span style={{ color: PRIMARY }}>stake-to-unlock</span> throttle.
      </Title>
      <p className="text-[30px] text-white/70 mt-8 max-w-[1500px] leading-snug">
        The 1:1 ratio keeps the story unmistakable. The throttle keeps the order
        book honest. Float grows with conviction, not panic.
      </p>

      <div className="grid grid-cols-3 gap-8 mt-16 flex-1">
        {[
          {
            icon: Coins,
            title: "Mint",
            body: "User earns 1 $ZSOLAR per verified kWh. 75% credited to wallet.",
          },
          {
            icon: ShieldCheck,
            title: "On-chain throttle",
            body: "Tokens vest through a stake-to-unlock curve. Only a bounded slice is liquid at any moment.",
          },
          {
            icon: TrendingUp,
            title: "Liquidity",
            body: "Float expands as conviction grows. No cliff. No panic. No flash dumps.",
          },
        ].map((s) => (
          <GlassCard key={s.title} accent className="p-10 flex flex-col">
            <div className="p-4 rounded-xl w-fit mb-6" style={{ background: PRIMARY_SOFT }}>
              <s.icon className="h-10 w-10" style={{ color: PRIMARY }} />
            </div>
            <div className="font-serif text-[40px] text-white leading-tight mb-4">
              {s.title}
            </div>
            <p className="text-[22px] text-white/75 leading-snug">{s.body}</p>
          </GlassCard>
        ))}
      </div>
    </div>
    <SlideFooter />
  </SlideLayout>
);

// 09 — MOAT
const SlideMoat = () => (
  <SlideLayout variant="dark">
    <SlideHeader label="The Moat" number={9} />
    <Brand />
    <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col">
      <Kicker>The Moat</Kicker>
      <Title>Three walls. No way around them.</Title>

      <div className="grid grid-cols-3 gap-8 mt-16 flex-1">
        {[
          {
            icon: Fingerprint,
            wall: "IP Wall",
            items: [
              "Proof-of-Genesis™ (patent-pending)",
              "TM Stack Tracks 1–3",
              "Device Watermark Registry",
            ],
          },
          {
            icon: Layers,
            wall: "Scarcity Stack",
            items: [
              "1T hard cap",
              "20% burn per mint",
              "4-year halving cadence",
              "Founder pact-lock",
            ],
          },
          {
            icon: ShieldCheck,
            wall: "Verification Stack",
            items: [
              "10-layer kWh verification",
              "Live OEM API integration",
              "No oracle, no trust, no double-mint",
            ],
          },
        ].map((m) => (
          <GlassCard key={m.wall} className="p-10 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-xl" style={{ background: PRIMARY_SOFT }}>
                <m.icon className="h-10 w-10" style={{ color: PRIMARY }} />
              </div>
              <div className="font-serif text-[36px] text-white">{m.wall}</div>
            </div>
            <ul className="space-y-4 flex-1">
              {m.items.map((it) => (
                <li key={it} className="flex items-start gap-3 text-[22px] text-white/80">
                  <span style={{ color: PRIMARY }} className="mt-2">▸</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </div>
    <SlideFooter />
  </SlideLayout>
);

// 10 — MILESTONES
const SlideMilestones = () => {
  const rows = [
    { months: "0–3", title: "Mainnet launch", body: "OG LP tranche live · audits complete (token + stake-to-unlock)" },
    { months: "3–9", title: "First 10K paying subs", body: "OEM pilot signed · Energy Oracle Phase 1 prototype" },
    { months: "9–15", title: "25K → 50K subs", body: "Round 2 + Round 3 LP tranches fire from seed reserve" },
    { months: "15–18", title: "Self-funding moment", body: "100K subs → Round 4 LP funded by subscriptions, not seed" },
    { months: "18–24", title: "Default-alive", body: "Multi-OEM live · Oracle Phase 2 · Series A optional" },
  ];
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Milestones" number={10} />
      <Brand />
      <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col">
        <Kicker>Self-Funding Moment · 24-Month Path</Kicker>
        <Title>
          Subscription revenue overtakes the LP burn rate by{" "}
          <span style={{ color: PRIMARY }}>month 18.</span>
        </Title>

        <div className="mt-14 space-y-4 flex-1">
          {rows.map((r, i) => (
            <div
              key={r.months}
              className="grid grid-cols-[180px_320px_1fr] items-center gap-8 px-8 py-6 rounded-2xl"
              style={{
                background: i === 3 ? "hsl(158,84%,52% / 0.08)" : "hsl(220,20%,12%)",
                border: i === 3
                  ? "1px solid hsl(158,84%,52% / 0.45)"
                  : "1px solid hsl(220,15%,24%)",
              }}
            >
              <div
                className="font-mono text-[28px]"
                style={{ color: i === 3 ? PRIMARY : "hsl(220,15%,55%)" }}
              >
                Mo {r.months}
              </div>
              <div className="font-serif text-[28px] text-white leading-tight">
                {r.title}
              </div>
              <div className="text-[20px] text-white/65 leading-snug">{r.body}</div>
            </div>
          ))}
        </div>
      </div>
      <SlideFooter />
    </SlideLayout>
  );
};

// 11 — WHY US
const SlideWhyUs = () => (
  <SlideLayout variant="dark">
    <SlideHeader label="Why Us" number={11} />
    <Brand />
    <div className="absolute inset-0 px-32 pt-44 pb-32 flex flex-col">
      <Kicker>Why Us · Why Now</Kicker>
      <Title>Five things converged.</Title>

      <div className="grid grid-cols-5 gap-5 mt-16">
        {[
          { n: "01", t: "Live product", b: "Shipping on Base L2 today" },
          { n: "02", t: "Real OEM data", b: "Tesla · SolarEdge · Enphase · Wallbox" },
          { n: "03", t: "Patent-pending IP", b: "Proof-of-Genesis™ + TM Stack" },
          { n: "04", t: "Macro catalyst", b: "$40B incentives just repealed" },
          { n: "05", t: "Founder pact-lock", b: "200B tokens locked until $6.67–$20" },
        ].map((c) => (
          <GlassCard key={c.n} className="p-7 flex flex-col">
            <div className="font-mono text-[18px] mb-4" style={{ color: PRIMARY }}>
              {c.n}
            </div>
            <div className="font-serif text-[28px] text-white leading-tight mb-3">
              {c.t}
            </div>
            <p className="text-[18px] text-white/65 leading-snug">{c.b}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard accent className="p-10 mt-14">
        <div className="flex items-center gap-5">
          <Users className="h-10 w-10" style={{ color: PRIMARY }} />
          <p className="text-[28px] text-white/90 leading-snug">
            <span className="font-semibold" style={{ color: PRIMARY }}>
              Skin in the game:
            </span>{" "}
            founders are pact-locked on 200B tokens — we only win when ZenSolar
            crosses $6.67–$20. Same boat as every holder.
          </p>
        </div>
      </GlassCard>
    </div>
    <SlideFooter />
  </SlideLayout>
);

// 12 — NEXT STEPS
const SlideNext = () => (
  <SlideLayout variant="accent">
    <SlideHeader label="Next Steps" number={12} />
    <Brand />
    <div className="absolute inset-0 px-32 pt-44 pb-28 flex flex-col">
      <Kicker>Next Steps</Kicker>
      <Title>Where we'd love your perspective.</Title>

      <div className="grid grid-cols-2 gap-8 mt-14 flex-1">
        {/* Open questions */}
        <GlassCard className="p-10">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="h-8 w-8" style={{ color: PRIMARY }} />
            <div className="font-serif text-[34px] text-white">Open Questions for Greg</div>
          </div>
          <ul className="space-y-5">
            {[
              "Does the 1:1 narrative + stake-to-unlock throttle land cleanly with institutional ears?",
              "How would you price the seed round given the live product + IP stack?",
              "What sequencing would you suggest for the Oracle R&D vs. growth spend?",
              "Who in your network should see this first?",
            ].map((q) => (
              <li key={q} className="flex gap-4 text-[20px] text-white/85 leading-snug">
                <span style={{ color: PRIMARY }}>▸</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Capital plan */}
        <GlassCard accent className="p-10">
          <div className="flex items-center gap-3 mb-8">
            <Coins className="h-8 w-8" style={{ color: PRIMARY }} />
            <div className="font-serif text-[34px] text-white">
              Directional Capital Plan
            </div>
          </div>
          <div className="text-[18px] text-white/50 uppercase tracking-widest mb-6">
            Working envelope · ~$10M · illustrative
          </div>
          <ul className="space-y-3 text-[20px] text-white/85">
            {[
              ["Team & Ops (24 mo)", "45%"],
              ["LP Reserve (3 tranches)", "25%"],
              ["User Acquisition", "12%"],
              ["Legal / Audits / Patents", "6.5%"],
              ["Energy Oracle R&D", "4.5%"],
              ["Contingency", "7%"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between py-2 border-b border-white/5">
                <span>{k}</span>
                <span className="font-mono" style={{ color: PRIMARY }}>
                  {v}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div className="mt-10 flex items-center justify-between text-[20px] text-white/45 font-mono uppercase tracking-widest">
        <span>beta.zen.solar</span>
        <span>Thank you, Greg.</span>
      </div>
    </div>
  </SlideLayout>
);

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

const slides = [
  <SlideCover />,
  <SlideNote />,
  <SlideCatalyst />,
  <SlideOpportunity />,
  <SlideProduct />,
  <SlideFlywheel />,
  <SlideTokenomics />,
  <SlideThrottle />,
  <SlideMoat />,
  <SlideMilestones />,
  <SlideWhyUs />,
  <SlideNext />,
];

const labels = [
  "Cover",
  "Note to Greg",
  "Catalyst",
  "Opportunity",
  "Product",
  "Flywheel",
  "Tokenomics",
  "Sell-Pressure Throttle",
  "Moat",
  "Milestones",
  "Why Us",
  "Next Steps",
];

export default function FoundersSeedPitchCompanionDeck() {
  return (
    <div className="min-h-[100svh] bg-[hsl(220,20%,6%)] text-white">
      <Helmet>
        <title>Companion Deck · Seed Narrative · Greg Falesnik (MZ Group)</title>
        <meta
          name="description"
          content="ZenSolar classic pitch deck — 12-slide companion to the seed narrative review draft for Greg Falesnik / MZ Group."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Top utility bar (hidden in fullscreen) */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 pointer-events-none">
        <Link
          to="/founders/seed-pitch-greg"
          className="pointer-events-auto inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" /> Review Draft
        </Link>
        <div className="pointer-events-auto inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400/80">
          <Lock className="h-3 w-3" /> Companion Deck · For Greg Falesnik
        </div>
      </div>

      <PitchDeckShell slides={slides} slideLabels={labels} />
    </div>
  );
}
