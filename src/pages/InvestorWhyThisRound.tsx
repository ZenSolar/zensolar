import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Activity,
  Sparkles,
  Coins,
  FileText,
  Shield,
  TrendingUp,
  Rocket,
  PlayCircle,
  Flag,
} from 'lucide-react';

const USE_OF_FUNDS = [
  { name: 'Token Launch & LP', value: 25 },
  { name: 'Legal & Audits', value: 20 },
  { name: 'App & Onboarding', value: 15 },
  { name: 'Growth & Acquisition', value: 15 },
  { name: 'Operational Runway', value: 25 },
];

const FLYWHEEL_NODES = [
  'Subs → LP',
  'More Users',
  'Stronger Liquidity',
  'Better Token',
  'More Minting',
  'Data Revenue',
];

const TIMELINE_STEPS = [
  { label: 'Round 1', sub: 'Token launch + first users', icon: Rocket },
  { label: 'Flywheel Activation', sub: 'LP + minting compound', icon: Activity },
  { label: 'Round 2', sub: 'Aggressive scaling', icon: TrendingUp },
  { label: 'Self-Sustainability', sub: 'Goal: no Series A needed', icon: Flag },
];

export default function InvestorWhyThisRound() {
  return (
    <>
      <Helmet>
        <title>ZenSolar — Why We're Raising $2.5M–$3.5M</title>
        <meta
          name="description"
          content="Transparent look at progress already shipped, what this round funds, and our two-round path to self-sustainability."
        />
        <link rel="canonical" href="https://www.zensolar.com/investor/why-this-round" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-3xl px-5 pt-10 pb-24 md:pt-16 md:pb-32">
          <Link
            to="/investor"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Investor Hub
          </Link>

          {/* 1. Header */}
          <header className="mt-8 mb-14">
            <div className="text-[11px] uppercase tracking-[0.28em] text-secondary/90 mb-4">
              The Round
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              Why We're Raising
              <br className="hidden md:block" /> $2.5M – $3.5M Now
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              A transparent look at the real progress already shipped, what this
              round funds, and how we reach self-sustainability.
            </p>
          </header>

          {/* 2. Where We Are Today */}
          <Section kicker="01 · De-risked Progress" title="Where we are today">
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
              The hardest technical work — verified real-world energy data
              flowing into on-chain minting — is already working in beta today.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                'Direct OAuth2 integrations with Tesla, Enphase, SolarEdge, and Wallbox are live and pulling real telemetry today.',
                'Core MVP is operational with working token minting via Proof-of-Genesis™.',
                'Multi-OEM Clean Energy Center and live energy monitoring cockpit are functional.',
                'Deason AI (monthly energy analysis + outage intelligence) is built.',
              ].map((line) => (
                <div
                  key={line}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-4"
                >
                  <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <p className="text-[13px] md:text-sm text-foreground/90 leading-relaxed">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* 3. Product Capabilities */}
          <Section kicker="02 · Already Live" title="Product capabilities shipping today">
            <div className="grid gap-4 md:grid-cols-3">
              <CapabilityCard
                icon={Activity}
                title="Zen Monitoring"
                body="First-of-its-kind multi-OEM live energy cockpit. Tesla · Enphase · SolarEdge · Wallbox — all in one screen."
              />
              <CapabilityCard
                icon={Sparkles}
                title="Deason AI"
                body="Personalized monthly Clean Energy Reports plus real-time outage support."
              />
              <CapabilityCard
                icon={Coins}
                title="Proof-of-Genesis™ Minting"
                body="One-tap, in-app minting through Coinbase Smart Wallet. No seed phrases required."
              />
            </div>
          </Section>

          {/* 3b. Technical Foundation */}
          <Section
            kicker="03 · Technical Foundation"
            title="How Proof-of-Genesis works"
          >
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
              A clear look at the core technology behind verified, on-chain
              clean energy minting.
            </p>
            <div className="grid gap-3">
              {[
                'Direct OAuth2 integrations with Tesla, Enphase, SolarEdge, and Wallbox pull real hardware telemetry in real time — not self-reported data.',
                'Proof-of-Delta™ serves as the cryptographic verification layer that validates energy production and sustainable behavior before any tokens are minted.',
                'Verified events are immutably anchored on-chain, creating a tamper-proof record of clean energy activity.',
                'Users can mint tokens with one tap inside the app using Coinbase Smart Wallet — no seed phrases or external wallet connection required.',
                'The core Proof-of-Genesis architecture is protected by U.S. Patent Application No. 19/634,402 and is designed to scale globally as clean energy adoption accelerates.',
              ].map((line) => (
                <div
                  key={line}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-4"
                >
                  <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <p className="text-[13px] md:text-sm text-foreground/90 leading-relaxed">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* 4. Use of Funds */}
          <Section kicker="04 · Use of Funds" title="What this round will fund">
            <ul className="space-y-2.5">
              {[
                'Token launch infrastructure and initial liquidity seeding on Uniswap',
                'Regulatory, compliance, legal, and smart contract audits',
                'App polish, onboarding experience, and mobile optimization',
                'Initial user acquisition and growth initiatives',
                '18–24 months of operational runway',
              ].map((line, i) => (
                <li
                  key={line}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/30 px-4 py-3"
                >
                  <span className="text-[11px] font-mono tabular-nums text-secondary mt-0.5 shrink-0">
                    0{i + 1}
                  </span>
                  <span className="text-[13px] md:text-sm text-foreground/90 leading-relaxed">
                    {line}
                  </span>
                </li>
              ))}
            </ul>

            <UseOfFundsChart />
          </Section>

          {/* 5. Round Structure */}
          <Section kicker="05 · Round Structure" title="A familiar, founder-aligned instrument">
            <div className="rounded-3xl border border-secondary/30 bg-secondary/[0.04] p-6 md:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                  We are raising on a <strong className="text-foreground">Convertible Note</strong>{' '}
                  (post-money) — a familiar and professional instrument for
                  sophisticated clean energy and infrastructure investors.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Coins className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                  The round includes a <strong className="text-foreground">Token Warrant</strong>{' '}
                  (via side letter) granting investors the right to purchase
                  $ZSOLAR at TGE price with a modest discount.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                  Both the Convertible Note and Token Warrants are subject to a{' '}
                  <strong className="text-foreground">4-year vesting schedule with a 1-year cliff</strong>
                  , demonstrating strong long-term alignment from both the founding
                  team and investors.
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                Full term sheet and detailed economics are available in the{' '}
                <Link to="/investor/data-room" className="text-secondary hover:underline">
                  Data Room
                </Link>{' '}
                after NDA.
              </p>
            </div>
          </Section>

          {/* 6. GTM */}
          <Section kicker="06 · Go-to-Market" title="High-level GTM strategy">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                'Target users who already own compatible hardware — Tesla vehicles, Enphase / SolarEdge solar + batteries, Wallbox chargers.',
                'Leverage early network effects through existing demo users, the waitlist, and strategic relationships.',
                'Use the $4.99/mo Deason AI tool as both an engagement driver and a premium upsell.',
                'Drive organic growth through real utility value plus token rewards once the flywheel begins compounding.',
              ].map((line) => (
                <div
                  key={line}
                  className="rounded-2xl border border-border/60 bg-card/40 p-5"
                >
                  <p className="text-[13px] md:text-sm text-foreground/90 leading-relaxed">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* 7. Flywheel */}
          <Section kicker="07 · The Flywheel" title="How it actually compounds">
            <FlywheelDiagram />
            <div className="space-y-2 mt-8">
              {[
                '100% of every monthly subscription goes directly into the Liquidity Pool.',
                'More users = more capital flowing into the LP every month.',
                'Stronger liquidity + real utility = better token price support and perception.',
                'Better token economics = more users want to join and mint.',
                'Data revenue grows in parallel with the user base.',
                'Goal: LP inflows + data revenue meaningfully cover operations.',
              ].map((line, i, arr) => (
                <div key={line}>
                  <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/40 px-5 py-4">
                    <span className="text-secondary font-mono text-sm tabular-nums shrink-0 mt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-[13px] md:text-sm text-foreground/90 leading-relaxed">
                      {line}
                    </p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="h-3 w-3 text-muted-foreground/40 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* 8. Runway */}
          <Section kicker="08 · Runway" title="Path to self-sustainability">
            <div className="rounded-3xl border border-border/60 bg-card/40 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <div className="text-2xl md:text-3xl font-semibold text-foreground">
                  18–24 months
                </div>
                <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  runway
                </span>
              </div>

              <TwoRoundTimeline />

              <div className="grid gap-4 md:grid-cols-3 mt-8">
                <RunwayBlock
                  label="Round 1 Goal"
                  body="Launch the token and acquire the first meaningful wave of minting users so the flywheel can begin operating."
                />
                <RunwayBlock
                  label="Round 2 Goal"
                  body="Aggressive scaling once early traction and flywheel mechanics are proven."
                />
                <RunwayBlock
                  label="Long-Term Vision"
                  body="Build toward a business that can become largely self-sustaining without needing a traditional Series A."
                />
              </div>
            </div>
          </Section>

          {/* 9. Long-Term Opportunity */}
          <Section kicker="09 · The Opportunity" title="Why this becomes a durable, multi-decade business">
            <div className="grid gap-3">
              {[
                'Proof-of-Genesis™ has the potential to become a foundational primitive for tokenizing and rewarding verified clean energy behavior at global scale.',
                'The addressable market is enormous: every Tesla driver, every solar + battery owner, and every EV household represents a potential user.',
                'With proper execution, the combination of real utility, a self-reinforcing flywheel, and a growing data moat creates the conditions for significant long-term scale.',
                'Our goal is to build a durable, multi-decade business that can compound over time as clean energy adoption accelerates worldwide.',
              ].map((line) => (
                <div
                  key={line}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 px-5 py-4"
                >
                  <Rocket className="h-4 w-4 text-secondary mt-1 shrink-0" />
                  <p className="text-[13px] md:text-sm text-foreground/90 leading-relaxed">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* CTA */}
          <div className="mt-16 pt-10 border-t border-border/40">
            <div className="text-center mb-6">
              <div className="text-xs uppercase tracking-[0.28em] text-secondary mb-2">
                Continue exploring
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
                More investor materials
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <CtaLink to="/deck" icon={FileText} label="View the Full Deck" />
              <CtaLink to="/investor/one-pager" icon={FileText} label="Read the One-Pager" />
              <CtaLink to="/investor/data-room" icon={PlayCircle} label="Enter the Data Room" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 md:mt-16">
      <div className="text-[11px] uppercase tracking-[0.24em] text-secondary/80 mb-2">
        {kicker}
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Activity;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 hover:border-secondary/40 transition-colors">
      <div className="h-10 w-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-secondary" />
      </div>
      <div className="text-base font-semibold text-foreground">{title}</div>
      <p className="text-[12px] md:text-[13px] text-muted-foreground leading-relaxed mt-1.5">
        {body}
      </p>
    </div>
  );
}

function RunwayBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
      <div className="text-[10px] uppercase tracking-[0.22em] text-secondary mb-2">
        {label}
      </div>
      <p className="text-[13px] text-foreground/90 leading-relaxed">{body}</p>
    </div>
  );
}

function CtaLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof FileText;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 px-5 py-4 hover:border-secondary/40 hover:bg-card/60 transition-colors"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-secondary" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function UseOfFundsChart() {
  return (
    <div className="mt-6 rounded-2xl border border-border/60 bg-card/30 p-4 md:p-6">
      <div className="text-[10px] uppercase tracking-[0.22em] text-secondary mb-4">
        Allocation
      </div>
      <div className="w-full" style={{ height: USE_OF_FUNDS.length * 44 + 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={USE_OF_FUNDS}
            layout="vertical"
            margin={{ top: 4, right: 44, left: 0, bottom: 4 }}
            barCategoryGap={10}
          >
            <XAxis type="number" hide domain={[0, 30]} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={18}>
              {USE_OF_FUNDS.map((_, i) => (
                <Cell key={i} fill="hsl(var(--secondary))" fillOpacity={0.55 + i * 0.06} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v: number) => `${v}%`}
                style={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">
        Indicative allocation across the $2.5M – $3.5M range.
      </p>
    </div>
  );
}

function FlywheelDiagram() {
  const reduce = useReducedMotion();
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 118;

  return (
    <div className="rounded-3xl border border-border/60 bg-card/30 p-4 md:p-6 flex justify-center">
      <div className="relative w-full max-w-[360px] aspect-square">
        <motion.svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <defs>
            <marker
              id="fw-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--secondary))" />
            </marker>
          </defs>

          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeOpacity={0.25}
            strokeWidth={1.25}
            strokeDasharray="4 6"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={reduce ? undefined : { duration: 60, repeat: Infinity, ease: 'linear' }}
          />

          {FLYWHEEL_NODES.map((_, i) => {
            const next = (i + 1) % FLYWHEEL_NODES.length;
            const a1 = (i / FLYWHEEL_NODES.length) * Math.PI * 2 - Math.PI / 2;
            const a2 = (next / FLYWHEEL_NODES.length) * Math.PI * 2 - Math.PI / 2;
            const x1 = cx + Math.cos(a1) * (r - 14);
            const y1 = cy + Math.sin(a1) * (r - 14);
            const x2 = cx + Math.cos(a2) * (r - 14);
            const y2 = cy + Math.sin(a2) * (r - 14);
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeOpacity={0.55}
                strokeWidth={1.5}
                markerEnd="url(#fw-arrow)"
              />
            );
          })}

          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize="10"
            style={{ letterSpacing: '0.22em', textTransform: 'uppercase' }}
          >
            The
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            fontSize="18"
            fontWeight={600}
          >
            Flywheel
          </text>
        </motion.svg>

        {FLYWHEEL_NODES.map((label, i) => {
          const angle = (i / FLYWHEEL_NODES.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + Math.cos(angle) * 42;
          const y = 50 + Math.sin(angle) * 42;
          return (
            <motion.div
              key={label}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary/40 bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] md:text-[11px] font-medium text-foreground/90 whitespace-nowrap"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.4 }}
            >
              {label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TwoRoundTimeline() {
  return (
    <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-5 md:p-6">
      <div className="text-[10px] uppercase tracking-[0.22em] text-secondary mb-5">
        Two-Round Path
      </div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-4 h-px bg-border/60" aria-hidden />
        <div className="relative grid grid-cols-4 gap-2">
          {TIMELINE_STEPS.map(({ label, sub, icon: Icon }, i) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className="relative z-10 h-8 w-8 rounded-full border border-secondary/60 bg-secondary/15 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-secondary" />
              </div>
              <div className="mt-2 text-[10px] md:text-[11px] font-semibold text-foreground leading-tight">
                {label}
              </div>
              <div className="mt-0.5 text-[9px] md:text-[10px] text-muted-foreground leading-tight">
                {sub}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className="hidden" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
