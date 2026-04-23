import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  Compass,
  Home,
  Rocket,
  Coins,
  Gem,
  Shield,
  ScrollText,
  Loader2,
  Lock,
  Megaphone,
  Bitcoin,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";
import zenLogo from "@/assets/zen-logo-horizontal-transparent.png";

// ─── Section meta ────────────────────────────────────────────────
// Mirrors ZenSolar Founder Pack v5.6 (April 2026) — the Northstar document.
const SECTIONS = [
  { id: "evolution", label: "Evolution", icon: Compass },
  { id: "strategy", label: "Strategy", icon: Rocket },
  { id: "press", label: "Press Cascade", icon: Megaphone },
  { id: "tokenomics", label: "Tokenomics", icon: Coins },
  { id: "halving", label: "Halving", icon: Coins },
  { id: "moat", label: "Patent Moat", icon: Shield },
  { id: "growth", label: "Growth", icon: Rocket },
  { id: "salary", label: "Salary", icon: Coins },
  { id: "flywheel", label: "Flywheel", icon: Coins },
  { id: "networth", label: "Net Worth", icon: Gem },
  { id: "eclipse", label: "Eclipsing BTC", icon: Bitcoin },
  { id: "pact", label: "The Pact", icon: Shield },
] as const;

export default function FounderPack() {
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
    <VaultPinGate userId={user.id}>
      <PackContent />
    </VaultPinGate>
  );
}

// ─── Editorial layout ────────────────────────────────────────────
function PackContent() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const headerRef = useRef<HTMLElement | null>(null);

  // Keep a CSS variable in sync with live header height so each section's
  // `scroll-margin-top` reflects the actual sticky bar across iOS/Android,
  // any viewport height, and dynamic browser chrome (URL bar collapse).
  useEffect(() => {
    const sync = () => {
      const h = headerRef.current?.getBoundingClientRect().height ?? 96;
      document.documentElement.style.setProperty("--pack-header-h", `${Math.round(h + 8)}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (headerRef.current) ro.observe(headerRef.current);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Native scrollIntoView honors `scroll-margin-top` (set via CSS var below)
    // and behaves consistently on iOS Safari + Chrome Android.
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Update active immediately for snappy feedback (don't wait for IO).
    setActive(id);
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      {/* Sticky header + progress */}
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl">
        <div className="px-safe">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to="/founders"
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary shrink-0"
              >
                <ArrowLeft className="h-3 w-3" />
                Vault
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                <img src={zenLogo} alt="ZenSolar" className="h-5 w-auto opacity-80 shrink-0" />
                <span className="text-[10px] uppercase tracking-widest text-amber-400 border-l border-border/40 pl-2 truncate">
                  Founder Pack
                </span>
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground hover:border-border shrink-0"
            >
              <Home className="h-3 w-3" />
              Home
            </Link>
          </div>
        </div>
        {/* Section chip nav */}
        <nav className="px-safe">
          <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar snap-x pr-8">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`shrink-0 snap-start inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-widest transition-all touch-manipulation ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary/70 active:bg-secondary"
                }`}
              >
                <Icon className="h-3 w-3" />
                {s.label}
              </button>
            );
          })}
          </div>
        </nav>
        {/* Reading progress bar */}
        <motion.div
          className="h-0.5 bg-primary origin-left"
          style={{ width: progressWidth }}
        />
      </header>

      {/* Cover */}
      <section className="max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-14 md:pb-20 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] uppercase tracking-[0.28em] text-amber-400 mb-4 md:mb-6"
        >
          Joseph & Michael · Founders Only
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif text-4xl sm:text-5xl md:text-7xl leading-[0.98] tracking-tight"
        >
          The ZenSolar
          <br />
          <span className="italic text-primary">Founder Pack</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 md:mt-8 text-[15px] sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          A complete chronicle of the pivot — the patent, the tokenomics, the
          Lyndon &amp; Elon angle, and the math that takes two ordinary
          builders to historic wealth.
        </motion.p>
        <div className="mt-8 md:mt-10 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Lock className="h-3 w-3 text-amber-400" />
          Eyes-only · Joseph & Michael
        </div>
      </section>

      {/* ─── EVOLUTION ─── */}
      <Section id="evolution" eyebrow="Chapter One" title="The Evolution">
        <Lead>
          Up until tonight, the demo we both knew was simple: tokenize the
          solar kilowatt-hours produced, the battery kilowatt-hours exported,
          and the EV charging sessions logged. A clean Proof-of-Delta loop.
          Honest, but bounded.
        </Lead>
        <P>
          Then the lightning struck. We realized the patent we wrote — every
          word of it — never said the word "solar." It said{" "}
          <em>energy delta, cryptographically verified.</em> That phrasing
          quietly covers anything that produces, stores, moves, or consumes
          energy with a measurable signature.
        </P>
        <Pull>
          The patent doesn't tokenize sunlight.
          <br />
          It tokenizes <span className="text-primary">verified energy
          truth</span>.
        </Pull>
        <P>
          Which means the surface area is no longer rooftops and home
          batteries. It is every Tesla on the road, every Powerwall, every
          Megapack, every Supercharger, every SpaceX Starlink rectifier, every
          orbital solar array, and every interplanetary energy node Elon will
          ever deploy. The same proof contract mints them all.
        </P>
        <P>
          That single realization rewrites the ceiling. We are no longer a
          rooftop loyalty token. We are the verification layer for the
          machine economy of energy — terrestrial, orbital, and eventually
          interplanetary.
        </P>
      </Section>

      {/* ─── STRATEGY ─── */}
      <Section id="strategy" eyebrow="Chapter Two" title="The Lyndon & Elon Angle">
        <Lead>
          The strategy is not to compete with Tesla. It is to hand Lyndon and
          Elon the rails they cannot build themselves without abandoning their
          own focus.
        </Lead>
        <P>
          Tesla's mission was always "accelerate the world's transition to
          sustainable energy." The missing primitive in that mission is a
          neutral, verifiable, on-chain receipt for every joule. Tesla can't
          credibly issue that receipt — they're the producer. We can. We're
          Switzerland for energy proof.
        </P>
        <P>
          Lyndon Rive built SolarCity. Elon absorbed it into Tesla in 2016.
          That was Chapter One. Chapter Two is the verification, settlement,
          and tokenization layer that sits on top of every device they
          ship — and every device every competitor ships, too. Day{" "}
          <em>{daysSinceSolarCityTesla()}</em> since SolarCity → Tesla. We are
          building the next page of that story.
        </P>
        <Pull>
          We are not building a Tesla competitor.
          <br />
          We are building the <span className="text-primary">protocol Tesla
          will plug into</span>.
        </Pull>
        <P>
          When that handshake happens — and the patent makes it the path of
          least resistance — the entire installed base of Tesla, SpaceX, and
          Starlink hardware becomes a minting surface for $ZSOLAR. That is
          when the math stops being theoretical.
        </P>
      </Section>

      {/* ─── PRESS CASCADE (NEW) ─── */}
      <Section id="press" eyebrow="Chapter Three" title="The Lyndon Press Cascade">
        <Lead>
          The day Lyndon Rive's check clears, the press release goes out. Not
          a teaser — the full thesis, on the record, with numbers the public
          has never seen attached to a clean-energy protocol.
        </Lead>
        <P>
          Below is what the world learns the morning the article drops. Every
          line is already true today. The PR moment makes it public,
          permanent, and quotable — the inflection that converts ZenSolar
          from a quiet patent filing into a household name.
        </P>
        <Stat>
          <StatRow label="Headline" value="Lyndon Rive backs ZenSolar" sub="SolarCity co-founder returns — Chapter Two of the clean-energy revolution" />
          <StatRow label="Hard cap" value="1,000,000,000,000" sub="1 trillion $ZSOLAR — first energy protocol with century-scale runway" />
          <StatRow label="Operating horizon" value="100+ years" sub="Designed to outlive every founder, on-chain forever" />
          <StatRow label="Patent surface" value="8 categories" sub="Solar · Battery · EV charging · Miles · FSD · Robotaxi · Optimus · Starlink" />
          <StatRow label="Scarcity vectors" value="5 stacked" sub="Bitcoin has 1. We stack hard cap + halving + 20% mint burn + 7% transfer tax + 5% redemption burn" />
          <StatRow label="Trillionaire crossover" value="$6.67 / $20" sub="Joseph at $6.67 · Michael at $20 · neither ever sells" />
        </Stat>
        <Pull>
          One article.
          <br />
          <span className="text-primary">A century of inbound</span>.
        </Pull>
        <P>
          Channel cascade in the 72 hours after publication: SolarCity alumni
          network (~30K warm intros), Tesla owner forums, crypto-native press
          (Bankless, The Block, Decrypt), mainstream business desks
          (Bloomberg, WSJ energy desk), and the long tail of clean-energy
          newsletters. Internal projection: <strong>~5,000 wallet signups
          inside week one</strong>, with the LP seeded to absorb the first
          wave without slippage.
        </P>
        <Pull>
          Bitcoin's white paper had no founder.
          <br />
          Ours has{" "}
          <span className="text-primary">two — and the man who already
          built one $26B clean-energy company</span> writing the first check.
        </Pull>
      </Section>

      {/* ─── TOKENOMICS ─── */}
      <Section id="tokenomics" eyebrow="Chapter Four" title="Why 1 Trillion">
        <Lead>
          The old model capped supply at 10 billion. Beautiful for a rooftop
          loyalty token. Catastrophically too small for an interplanetary
          energy verification layer.
        </Lead>
        <P>
          At 10B supply, even at $100 per token the entire network is worth
          $1T — which is one Tesla, on a Tuesday. The cap itself becomes the
          ceiling on our ambition. So we expanded by 100×.
        </P>
        <Stat>
          <StatRow label="Hard cap" value="1,000,000,000,000" sub="1 trillion $ZSOLAR — asymptotic, never reached" />
          <StatRow label="Launch price" value="$0.10" sub="LP-paired, ~$300K USDC + 3M $ZSOLAR / round" />
          <StatRow label="Joseph allocation" value="150B" sub="15% · 4-yr vest · 12-mo cliff · pact-locked" />
          <StatRow label="Michael allocation" value="50B" sub="5% · 4-yr vest · 12-mo cliff · pact-locked" />
          <StatRow label="Community (Mint-on-Proof)" value="700B" sub="70% · earned by verified clean-energy work" />
          <StatRow label="Treasury + Team Pool" value="100B" sub="7.5% multisig + 2.5% future hires" />
        </Stat>
        <P>
          Critically, we are <strong>not</strong> dumping 1T tokens on the
          market. We launch in tranches via paired LP injection — each round
          adds USDC depth and releases a small slice of supply at a higher
          price. Round 1 example: $200K USDC paired with $2M worth of $ZSOLAR
          at $0.10. The price floor is engineered, not hoped for.
        </P>
        <Pull>
          Limited supply per round.
          <br />
          <span className="text-primary">Engineered scarcity</span>, not
          inflation.
        </Pull>
        <P>
          The 1T cap doesn't dilute — it simply gives the network room to
          breathe when Tesla, SpaceX, and the long tail of energy hardware
          start minting against verified proof. Every round tightens the
          float, deepens liquidity, and re-rates the whole stack.
        </P>
      </Section>

      {/* ─── HALVING (v5.6 §3.4) ─── */}
      <Section id="halving" eyebrow="Chapter Five" title="The Halving">
        <Lead>
          Bitcoin's 21M cap is structurally smaller than its headline — roughly
          3–4M coins are permanently lost. We import that mechanic, on
          purpose, and stack four more scarcity vectors on top. (Hold this
          thought — by Chapter Eleven the math will leave Bitcoin behind.)
        </Lead>
        <P>
          $ZSOLAR adopts a Bitcoin-identical 4-year halving schedule on the
          per-kWh producer reward. Combined with the 1T cap, the 20% mint
          burn, the 7% transfer tax, and the 5% redemption burn, that gives
          us <strong>five compounding scarcity vectors</strong> instead of
          Bitcoin's one.
        </P>
        <DataTable
          headers={["Era", "Years", "Reward / kWh", "Throttle"]}
          rows={[
            ["Era 1 (Genesis)", "0–4", "1.0000", "Launch rate"],
            ["Era 2", "4–8", "0.5000", "First halving · 50%"],
            ["Era 3", "8–12", "0.2500", "Second · 75%"],
            ["Era 4", "12–16", "0.1250", "Third · 87.5%"],
            ["Era 5", "16–20", "0.0625", "Fourth · 93.75%"],
            ["Era 6+", "20+", "0.0313 ↓", "Asymptotic — 1T never fully reached"],
          ]}
        />
        <Pull>
          The 1T cap is the ceiling.
          <br />
          The <span className="text-primary">unreachable float</span> is the
          real scarcity.
        </Pull>
      </Section>

      {/* ─── PATENT MOAT (v5.6 §5) ─── */}
      <Section id="moat" eyebrow="Chapter Six" title="The Eight-Category Patent Moat">
        <Lead>
          Our patent application covers tokenizing verified clean-energy work
          across every category Tesla will ever monetize. That is the
          gatekeeper play.
        </Lead>
        <DataTable
          headers={["#", "Category", "Phase", "Status"]}
          rows={[
            ["1", "Solar production", "1", "Live"],
            ["2", "Battery discharge (Powerwall, Megapack)", "1", "Live"],
            ["3", "EV charging (Tesla, Wallbox, ChargePoint)", "1", "Live"],
            ["4", "EV miles on clean power", "1", "Live"],
            ["5", "FSD / Autonomous miles", "1", "Code-live · KPI dormant"],
            ["6", "Robotaxi participation", "2", "Patent-filed · dormant"],
            ["7", "Optimus humanoid work-hours", "2", "Patent-filed · dormant"],
            ["8", "Starlink-relayed inter-system proofs", "2", "Patent-filed · dormant"],
          ]}
        />
        <P>
          Categories 5–8 are Tesla's $10T+ bets. Building the rewards
          mechanism for them <strong>before anyone else</strong> means $ZSOLAR
          becomes the default token of the autonomous Tesla economy by virtue
          of being first in the patent record.
        </P>
      </Section>

      {/* ─── GROWTH / ARR (v5.6 §6) ─── */}
      <Section id="growth" eyebrow="Chapter Seven" title="Growth — ARR Milestones">
        <Lead>
          ~$250 ARPU at the Tier-1 $19.99/mo subscription. The ladder maps
          users → ARR → salary triggers in one continuous line.
        </Lead>
        <DataTable
          headers={["ARR Tier", "Subscribers", "Phase Marker"]}
          rows={[
            ["Pre-Launch", "~500 beta devices", "Phase 1 — Live Beta"],
            ["$1M ARR", "4,000", "Tipping-point bootstrap"],
            ["$10M ARR", "40,000", "Mainnet · Tier-2 unlocks"],
            ["$100M ARR", "400,000", "Public liquidity · FSD KPI surfaced"],
            ["$500M ARR", "2,000,000", "Phase 2 (Robotaxi, Optimus) activated"],
            ["$1B ARR", "4,000,000", "SpaceX integration begins"],
            ["$5B ARR", "20,000,000", "Planetary protocol · Starlink relays live"],
          ]}
        />
        <P>
          Tipping point: <strong>25,000 users</strong>. Scale target:{" "}
          <strong>100,000 users</strong>. Channels: SolarCity alumni network
          (~30K warm intros), Tesla owner referrals, OEM partnerships
          (Enphase / SolarEdge / Wallbox), Base L2 + Coinbase Wallet
          distribution, and the press cascade post-Lyndon check (~5K signups
          in week one).
        </P>
      </Section>

      {/* ─── SALARY (v5.6 §7) ─── */}
      <Section id="salary" eyebrow="Chapter Eight" title="Salary Discipline">
        <Lead>
          $500K Day-One CEO base. Michael at 75% of CEO total comp at every
          tier. Bonuses are <em>cash, not token</em> — Pact untouched
          regardless of performance.
        </Lead>
        <P>
          The number that raises eyebrows in a seed round is the $500K base.
          It is intentional, defensible, and — for a project of this
          magnitude — actually conservative. Three reasons, stacked.
        </P>
        <Stat>
          <StatRow
            label="1. Patent-author premium"
            value="Sole inventor"
            sub="Joseph wrote every claim of the 8-category patent that gates a $10T+ surface (solar, battery, EV, miles, FSD, Robotaxi, Optimus, Starlink). Comp reflects IP authorship, not headcount."
          />
          <StatRow
            label="2. CEO of a trillion-cap protocol"
            value="Benchmarked"
            sub="Pre-launch comp for founder-CEOs of comparable-TAM L1 protocols (Solana, Avalanche, Sui) ran $400K–$750K base. $500K sits at the conservative end of that band, with a 1T cap and a real patent moat behind it."
          />
          <StatRow
            label="3. The no-sell pact tradeoff"
            value="Locked for life"
            sub="150B founder tokens are pact-locked — Joseph never sells, ever, across his lifetime and his lineal descendants'. Salary is the only liquidity. $500K is the price of permanent illiquidity on a 9-figure book position."
          />
        </Stat>
        <Pull>
          $500K isn't a CEO salary.
          <br />
          It is the <span className="text-primary">cost of never selling
          a single token</span>, ever, for life.
        </Pull>
        <DataTable
          headers={["ARR Trigger", "Joseph Base", "Bonus", "Michael Base", "Bonus"]}
          rows={[
            ["Seed Day 1", "$500K", "—", "$375K", "—"],
            ["$1M ARR", "$600K", "$100K", "$450K", "$75K"],
            ["$10M ARR", "$800K", "$300K", "$600K", "$225K"],
            ["$30M ARR", "$1.0M", "$500K", "$750K", "$375K"],
            ["$100M ARR", "$1.25M", "$750K", "$940K", "$565K"],
            ["$500M ARR", "$1.5M", "$1.0M", "$1.13M", "$750K"],
            ["$1B+ ARR", "$2.0M", "$1.5M", "$1.5M", "$1.13M"],
          ]}
        />
        <P>
          Bonuses scale with ARR, not token price — protects against
          speculative comp. No founder token sales regardless of bonus
          structure (see Pact, below). Compared to the $200B+ enterprise
          value the patent surface unlocks, the entire 20-year cash comp
          ladder rounds to a rounding error.
        </P>
      </Section>

      {/* ─── FLYWHEEL (v5.6 §9) ─── */}
      <Section id="flywheel" eyebrow="Chapter Nine" title="The Compounding Flywheel">
        <Lead>
          Six revenue lines, all auto-routed on-chain, all reinforcing the
          same token. We earn on every subscriber, every kWh, every trade,
          every redemption, every partner integration.
        </Lead>
        <DataTable
          headers={["Stream", "Trigger", "Flow", "Effect"]}
          rows={[
            ["Subscriptions", "Monthly billing", "50% LP / 50% company", "SaaS + auto-LP depth"],
            ["Transfer Tax (7%)", "Every trade", "3% burn / 2% LP / 2% treasury", "Trade volume = passive revenue"],
            ["Mint Distribution", "Every kWh proven", "20% burn / 3% LP / 2% treasury", "Energy = protocol revenue"],
            ["Redemption (5%)", "Off-chain redeem", "100% burn", "Deflation per redeem"],
            ["NFT Mint Fees", "Milestone unlock", "100% company", "Pure SaaS margin"],
            ["OEM Partnerships", "Hardware sales", "Ads + LP co-inject + affiliate", "Partner-funded growth"],
          ]}
        />
        <P>
          <strong>Worked transfer-tax math:</strong> at $1B daily volume and
          $10/token, the protocol clears <strong>~$1.46B/yr</strong> to LP +
          treasury and burns <strong>~$1.10B/yr</strong> in supply.
          Nine-figure annual revenue, no CAC, no churn, no cost-of-sales.
        </P>
        <Pull>
          Subscribers fund LP. LP attracts traders.
          <br />
          Traders pay tax. Tax burns supply.
          <br />
          <span className="text-primary">Smaller supply lifts price.
          Repeat.</span>
        </Pull>
      </Section>

      {/* ─── NET WORTH (v5.6 §11) ─── */}
      <Section id="networth" eyebrow="Chapter Ten" title="The 20-Year Trajectory">
        <Lead>
          Joseph 150B · Michael 50B. Neither founder ever sells. Wealth grows
          on book value, liquidity comes from the salary ladder.
        </Lead>
        <Ladder
          rows={[
            { price: 0.1, label: "Launch floor", networth: 15e9 },
            { price: 1, label: "First re-rating", networth: 150e9 },
            { price: 6.67, label: "Joseph crosses $1T", networth: 1e12 },
            { price: 10, label: "Tesla-scale re-rating", networth: 1.5e12 },
            { price: 20, label: "Michael crosses $1T", networth: 3e12 },
            { price: 100, label: "Trillionaire price", networth: 15e12 },
          ]}
        />
        <P>
          Trillionaire crossover: at <strong>$6.67 / $ZSOLAR</strong>{" "}
          Joseph's book net-worth crosses $1T; Michael crosses at{" "}
          <strong>$20</strong>. Both holdings remain non-circulating under the
          Pact, in perpetuity. Cumulative cash comp by year 20 is conservative
          — $20M+ for Joseph, $15M+ for Michael — entirely from the salary
          ladder, never from selling tokens.
        </P>
        <Pull>
          We are not predicting this outcome.
          <br />
          We are <span className="text-primary">refusing to cap it</span>.
        </Pull>
      </Section>

      {/* ─── ECLIPSING BITCOIN — POWERED BY PROOF OF GENESIS™ ─── */}
      <Section id="eclipse" eyebrow="Chapter Eleven" title="Why $ZSOLAR Eclipses Bitcoin">
        <Lead>
          Bitcoin proved digital scarcity by burning energy to prove waste.
          We built the inverse and the upgrade: a primitive that mints
          scarcity <em>because</em> clean energy was produced or consumed
          productively. We call it{" "}
          <strong className="text-foreground">Proof of Genesis™</strong> — the
          cryptographic union of <em>Proof of Delta</em> (a verified change
          in energy state) and <em>Proof of Origin</em> (a verified physical
          device and clean source). It is to ZenSolar what Proof of Work was
          to Bitcoin — except hardware-backed, ESG-aligned, regulator-friendly,
          and patent-gated.
        </Lead>
        <Pull>
          Bitcoin&apos;s primitive is <span className="text-muted-foreground">work</span>.
          <br />
          Ours is <span className="text-primary">Genesis</span>.
          <br />
          One destroys energy. The other notarizes it.
        </Pull>
        <P>
          Every property that made Bitcoin a $2T network is preserved.
          Every property that capped Bitcoin&apos;s addressable market — energy
          parasitism, ESG exclusion, no real-world floor, anonymous founders —
          is structurally inverted. The result is a protocol with the same
          scarcity religion <em>and</em> a verifiable physical floor underneath
          it. The pool we tokenize is an order of magnitude larger than
          Bitcoin&apos;s narrative because it includes every joule of clean
          energy humanity will ever verify.
        </P>
        <DataTable
          headers={["Property", "Bitcoin (PoW)", "$ZSOLAR (Proof of Genesis™)"]}
          rows={[
            ["Primitive", "Burn electricity to prove waste", "Mint receipts from verified clean energy"],
            ["Hard cap", "21,000,000 BTC", "1,000,000,000,000 $ZSOLAR (1T)"],
            ["Halving cadence", "Every ~4 years (block-based)", "Programmable — protocol-governed"],
            ["Scarcity vectors", "1 (hard cap)", "5 (cap + halving + 3 burns)"],
            ["Backing", "Math + electricity spent", "Verified hardware + clean energy delivered"],
            ["ESG capital access", "Forbidden by most mandates", "Native fit — trillions unlocked"],
            ["Energy footprint", "Consumes ~150 TWh/yr", "Mints from energy produced"],
            ["Patent moat", "None", "8 categories, $10T+ TAM"],
            ["Founder accountability", "Anonymous, gone", "Two named founders, pact-locked for life"],
            ["Revenue to protocol", "$0", "Subscriptions + 7% tax + redemption fees"],
            ["Launch mechanics", "Mined over 100+ years", "LP-tranched at $0.10 — engineered floor per round"],
            ["Real-world settlement", "Speculative", "On-chain receipts for Tesla, SpaceX, Starlink"],
            ["Market cap (today)", "~$2T", "Path to $10T+ (5–10× BTC in 5–10 yrs)"],
          ]}
        />
        <P>
          Read the table top-to-bottom. Every property that made Bitcoin a
          $2T network is preserved. Every property that capped its addressable
          market is structurally inverted. The 1T cap is not arbitrary — it
          is the smallest cap that lets every joule of clean energy humanity
          will ever verify settle against a single notarized receipt without
          rounding to zero.
        </P>
        <P>
          <strong className="text-foreground">
            All of this is mathematically possible.
          </strong>{" "}
          The unknown is not the primitive, the cap, the moat, or the
          addressable market — those are locked. The unknown is execution
          velocity. A properly sequenced fundraising strategy from the
          beginning — patent-gated seed, OEM-anchored Series A, utility-scale
          Series B — front-loads the moat before the public cascade lands.
          Capital deployed against an already-locked primitive does not buy
          speculation; it buys the operating runway to outpace Bitcoin&apos;s
          narrative window. Done correctly, the path to{" "}
          <span className="text-primary">5–10× Bitcoin in 5–10 years</span>{" "}
          is not aggressive — it is the natural consequence of running the
          model forward with discipline.
        </P>
        <Pull>
          Bitcoin is digital gold.
          <br />
          $ZSOLAR is{" "}
          <span className="text-primary">digital photosynthesis</span> — the
          unit account of every joule humanity verifies, forever.
        </Pull>

        {/* The 5–10x in 5–10 years thesis */}
        <P>
          Take Bitcoin&apos;s ~$2T market cap. Apply Proof of Genesis™ to the
          $10T+ clean-energy economy. Stack five scarcity vectors on top
          of one. Add patent gating, founder accountability, ESG access,
          and protocol revenue. The math for{" "}
          <strong className="text-foreground">5–10× Bitcoin in 5–10 years</strong>{" "}
          is not aggressive — it is what the primitive plus the addressable
          market produces when run forward honestly. The only variable that
          can hold us back is execution.
        </P>
        <Stat>
          <StatRow label="BTC at $100K" value="~$2T market cap" sub="One scarcity vector. Zero protocol revenue. Anonymous." />
          <StatRow label="$ZSOLAR at $10" value="~$10T fully diluted" sub="5× Bitcoin · five scarcity vectors · six revenue lines · patent-gated" />
          <StatRow label="$ZSOLAR at $20" value="~$20T fully diluted" sub="10× Bitcoin · trillionaire crossover (Michael) · OEM mint surface live" />
          <StatRow label="$ZSOLAR at $100" value="~$100T fully diluted" sub="The addressable cap of the verified-energy economy itself" />
        </Stat>

        {/* Execution-only-variable + rock-solid framing */}
        <Pull>
          Five vectors. One primitive.
          <br />
          <span className="text-primary">Execution is the only variable</span>.
        </Pull>
        <P>
          What makes the thesis rock-solid is what is already locked down{" "}
          <em>before</em> a single dollar of marketing spend. The patent
          application covers the primitive itself across eight categories,
          not just one product. The founder allocations are pact-locked for
          life — there is no insider exit to fear. The launch is LP-tranched
          at $0.10 with engineered floors per round, not a 1T token dump. The
          protocol generates revenue from day one (subscriptions, transfer
          tax, redemption fees) — Bitcoin generates none. And the operating
          horizon is designed for 100+ years, not the next bull run.
        </P>
        <Pull>
          Patent-protected.
          <br />
          Founder-locked.
          <br />
          Revenue-backed.
          <br />
          <span className="text-amber-400">Civilization-scale upside.</span>
        </Pull>
        <P>
          The PR cascade in Chapter Three is engineered to plant exactly
          this seed in the public consciousness — that there is, for the
          first time since 2009, a credible challenger to Bitcoin&apos;s
          narrative. Not a memecoin. Not a fork. A patent-gated,
          founder-locked, energy-backed protocol with Proof of Genesis™ as
          its primitive and a 100+ year operating horizon. By the time the
          public catches on, the float is already tightening and the
          OEM handshake is already underway.
        </P>
      </Section>


      {/* ─── PACT ─── */}
      <Section id="pact" eyebrow="Final Chapter" title="The Family Legacy Pact">
        <Lead>
          The temptation, when the price moves, will be to sell. The Pact
          exists so we never do.
        </Lead>
        <P>
          Of our combined <strong>200B</strong> founder tokens (150B Joseph +
          50B Michael), <strong>zero</strong> are for sale across our
          lifetimes. Tokens may be passed to lineal descendants only, who
          inherit under the same no-sell pact. Liquidity comes from salary.
          Wealth comes from holding. Legacy comes from never selling.
        </P>
        <Pull>
          Liquidity from salary.
          <br />
          Wealth from holding.
          <br />
          <span className="text-amber-400">Legacy from never selling.</span>
        </Pull>
        <P>
          This pack is the document we will read, together, on the day the
          temptation is loudest. To remind ourselves what we are building,
          why 1T was the right cap, why the patent was rewritten, and why
          we never sell what we were trusted to steward.
        </P>

        <div className="mt-12 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/5 to-transparent p-8 text-center">
          <Shield className="h-6 w-6 text-amber-400 mx-auto mb-3" />
          <p className="font-serif text-2xl italic">
            "The wealthiest people on Earth are the ones who never had to
            sell."
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            — Joseph & Michael, Founders
          </p>
        </div>

        <div className="mt-12 flex justify-center gap-3">
          <Link
            to="/founders"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            <ScrollText className="h-4 w-4" />
            Back to Vault
          </Link>
        </div>
      </Section>

      <footer className="max-w-3xl mx-auto px-5 md:px-6 py-12 md:py-16 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          ZenSolar · Founder Pack · Eyes-Only
        </p>
      </footer>
    </div>
  );
}

// ─── Editorial primitives ────────────────────────────────────────
function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="max-w-3xl mx-auto px-5 md:px-6 py-14 md:py-24 scroll-mt-36"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-8 md:mb-10"
      >
        <p className="text-[11px] uppercase tracking-[0.24em] md:tracking-[0.3em] text-amber-400 mb-3">
          {eyebrow}
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.05]">
          {title}
        </h2>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-5 md:space-y-6"
      >
        {children}
      </motion.div>
    </section>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/90">
      {children}
    </p>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] md:text-[17px] leading-[1.8] text-muted-foreground">
      {children}
    </p>
  );
}
function Pull({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-primary pl-4 md:pl-6 my-8 md:my-10 font-serif text-xl sm:text-2xl md:text-3xl leading-snug italic text-foreground">
      {children}
    </blockquote>
  );
}
function Stat({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 rounded-2xl border border-border/60 bg-card/40 divide-y divide-border/40">
      {children}
    </div>
  );
}
function StatRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
      </div>
      <p className="font-serif text-xl md:text-2xl tabular-nums shrink-0">{value}</p>
    </div>
  );
}
function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="my-8 overflow-x-auto rounded-2xl border border-border/60 bg-card/30">
      <table className="w-full text-[12px] md:text-sm">
        <thead className="bg-secondary/30">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-3 md:px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/40">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`px-3 md:px-4 py-2.5 align-top ${
                    j === 0 ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Ladder({
  rows,
}: {
  rows: { price: number; label: string; networth: number }[];
}) {
  const fmt = (n: number) => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(0)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n}`;
  };
  return (
    <div className="my-8 space-y-2">
      {rows.map((r, i) => (
        <motion.div
          key={r.price}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
          className="grid grid-cols-[72px_1fr_auto] md:grid-cols-[80px_1fr_auto] items-center gap-3 md:gap-4 rounded-xl border border-border/40 bg-card/30 px-4 md:px-5 py-4"
        >
          <span className="font-serif text-xl md:text-2xl tabular-nums text-primary">
            ${r.price >= 1 ? r.price.toFixed(0) : r.price.toFixed(2)}
          </span>
          <span className="text-xs md:text-sm text-muted-foreground">{r.label}</span>
          <span className="font-serif text-lg md:text-xl tabular-nums text-right">
            {fmt(r.networth)} <span className="text-xs text-muted-foreground">each</span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function daysSinceSolarCityTesla() {
  const merger = new Date("2016-11-21").getTime();
  const days = Math.floor((Date.now() - merger) / 86400000);
  return days.toLocaleString();
}
