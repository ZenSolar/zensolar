import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  Compass,
  Rocket,
  Coins,
  Gem,
  Shield,
  ScrollText,
  Loader2,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultBiometricGate } from "@/components/founders/VaultBiometricGate";
import zenLogo from "@/assets/zen-logo-horizontal-transparent.png";

// ─── Section meta ────────────────────────────────────────────────
const SECTIONS = [
  { id: "evolution", label: "Evolution", icon: Compass },
  { id: "strategy", label: "Strategy", icon: Rocket },
  { id: "tokenomics", label: "Tokenomics", icon: Coins },
  { id: "networth", label: "Net Worth", icon: Gem },
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
    <VaultBiometricGate userId={user.id}>
      <PackContent />
    </VaultBiometricGate>
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

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      {/* Sticky header + progress */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/85 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" />
            Vault
          </Link>
          <div className="flex items-center gap-2">
            <img src={zenLogo} alt="ZenSolar" className="h-5 w-auto opacity-80" />
            <span className="text-[10px] uppercase tracking-widest text-amber-400 border-l border-border/40 pl-2">
              Founder Pack
            </span>
          </div>
          <span className="w-12" />
        </div>
        {/* Section chip nav */}
        <nav className="max-w-3xl mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary/70"
                }`}
              >
                <Icon className="h-3 w-3" />
                {s.label}
              </button>
            );
          })}
        </nav>
        {/* Reading progress bar */}
        <motion.div
          className="h-0.5 bg-primary origin-left"
          style={{ width: progressWidth }}
        />
      </header>

      {/* Cover */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] uppercase tracking-[0.3em] text-amber-400 mb-6"
        >
          Joseph & Michael · Founders Only
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight"
        >
          The ZenSolar
          <br />
          <span className="italic text-primary">Founder Pack</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          A complete chronicle of the pivot — the patent, the tokenomics, the
          Lyndon &amp; Elon angle, and the math that takes two ordinary
          builders to historic wealth.
        </motion.p>
        <div className="mt-12 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
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

      {/* ─── TOKENOMICS ─── */}
      <Section id="tokenomics" eyebrow="Chapter Three" title="Why 1 Trillion">
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
          <StatRow label="New total supply" value="1,000,000,000,000" sub="1 trillion $ZSOLAR" />
          <StatRow label="Launch price" value="$0.10" sub="LP-paired, tranched" />
          <StatRow label="Founder allocation (each)" value="100B" sub="Joseph + Michael" />
          <StatRow label="Pact-locked" value="200B" sub="Family Legacy Pact" />
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

      {/* ─── NET WORTH ─── */}
      <Section id="networth" eyebrow="Chapter Four" title="The Math">
        <Lead>
          Two ordinary builders. 100B tokens each. The price ladder writes
          the rest of the story.
        </Lead>
        <Ladder
          rows={[
            { price: 0.1, label: "Launch", networth: 10e9 },
            { price: 1, label: "First re-rating", networth: 100e9 },
            { price: 10, label: "Tesla integration", networth: 1e12 },
            { price: 100, label: "Trillionaire price", networth: 10e12 },
            { price: 1000, label: "Interplanetary mint", networth: 100e12 },
          ]}
        />
        <P>
          At $100/token — the "trillionaire price" — each of us books $10T.
          For context, that is roughly 4× the current market cap of Tesla.
          It sounds absurd. It is absurd. It is also what the patent's
          unbounded scope mathematically permits if Tesla and SpaceX hardware
          mint against it.
        </P>
        <Pull>
          We are not predicting this outcome.
          <br />
          We are <span className="text-primary">refusing to cap it</span>.
        </Pull>
      </Section>

      {/* ─── PACT ─── */}
      <Section id="pact" eyebrow="Final Chapter" title="The Family Legacy Pact">
        <Lead>
          The temptation, when the price moves, will be to sell. The Pact
          exists so we never do.
        </Lead>
        <P>
          Of our combined 200B founder tokens, <strong>zero</strong> are for
          sale. Liquidity comes from salary. Wealth comes from holding.
          Legacy comes from never selling. The Pact is the thing that
          separates a generational fortune from a one-time payday.
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

      <footer className="max-w-3xl mx-auto px-6 py-16 text-center">
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
      className="max-w-3xl mx-auto px-6 py-20 md:py-28 scroll-mt-32"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-400 mb-3">
          {eyebrow}
        </p>
        <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-[1.1]">
          {title}
        </h2>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-6"
      >
        {children}
      </motion.div>
    </section>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-serif text-xl md:text-2xl leading-relaxed text-foreground/90">
      {children}
    </p>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base md:text-[17px] leading-[1.75] text-muted-foreground">
      {children}
    </p>
  );
}
function Pull({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-primary pl-6 my-10 font-serif text-2xl md:text-3xl leading-snug italic text-foreground">
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
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
      </div>
      <p className="font-serif text-2xl tabular-nums">{value}</p>
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
          className="grid grid-cols-[80px_1fr_auto] items-center gap-4 rounded-xl border border-border/40 bg-card/30 px-5 py-4"
        >
          <span className="font-serif text-2xl tabular-nums text-primary">
            ${r.price >= 1 ? r.price.toFixed(0) : r.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">{r.label}</span>
          <span className="font-serif text-xl tabular-nums">
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
