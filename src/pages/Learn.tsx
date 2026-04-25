import { Link } from 'react-router-dom';
import {
  BookOpen,
  Coins,
  Sparkles,
  Cpu,
  ArrowRight,
  Zap,
  ShieldCheck,
  Flame,
  DollarSign,
  Target,
  Layers,
  Award,
  Sun,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import {
  PageShell,
  SectionHeader,
  PageSectionNav,
  useSectionNavigation,
} from '@/components/layout/PageShell';

const sections = [
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
  { id: 'tokenomics', label: 'Tokenomics', icon: Coins },
  { id: 'proof-of-genesis', label: 'Proof-of-Genesis™', icon: Sparkles },
  { id: 'patent', label: 'Patent Tech', icon: Cpu },
] as const;

type SectionId = typeof sections[number]['id'];

export default function Learn() {
  const { active, select } = useSectionNavigation<SectionId>(sections, 'how-it-works');

  return (
    <>
      <SEO title="Learn" url="https://beta.zen.solar/learn" />
      <PageShell
        title="Learn"
        description="Everything about ZenSolar — how it works, the token economics, and the patent-pending tech behind it."
        icon={BookOpen}
        width="4xl"
        sticky={
          <PageSectionNav
            items={sections}
            active={active}
            onSelect={select}
            asAnchors
            ariaLabel="Learn sections"
          />
        }
      >
        <div className="space-y-12 sm:space-y-16">
          <section id="how-it-works" className="scroll-mt-32 min-h-[220px]"><HowItWorksSection /></section>
          <section id="tokenomics" className="scroll-mt-32 min-h-[360px]"><TokenomicsSection /></section>
          <section id="proof-of-genesis" className="scroll-mt-32 min-h-[320px]"><ProofOfGenesisSection /></section>
          <section id="patent" className="scroll-mt-32 min-h-[300px]"><PatentTechSection /></section>
        </div>
      </PageShell>
    </>
  );
}
/* -------------------------------------------------------------------------- */
/*                                 SECTIONS                                   */
/* -------------------------------------------------------------------------- */

function HowItWorksSection() {
  const steps = [
    { icon: Zap, title: 'Connect', desc: 'Link Tesla, Enphase, SolarEdge, or Wallbox in 30 seconds — no hardware.' },
    { icon: Sun, title: 'Generate', desc: 'Your panels, EV, and battery are already producing verified clean energy.' },
    { icon: Sparkles, title: 'Tap-to-Mint™', desc: 'One tap mints $ZSOLAR + milestone NFTs to your wallet.' },
    { icon: Award, title: 'Level up', desc: 'Hit milestones, earn rare NFTs, climb the leaderboard.' },
  ];
  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="01 — The Game"
        title="How ZenSolar works"
        description="Your clean energy is already worth real money. We just made it claimable in one tap."
        icon={BookOpen}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <Card key={s.title} className="h-full border-border/60 hover:border-primary/40 transition-colors fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            <CardContent className="p-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-semibold text-primary mb-1">Step {i + 1}</p>
              <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
        <Link to="/demo/how-it-works">
          Read full guide
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </Button>
    </section>
  );
}

function TokenomicsSection() {
  const stats = [
    { label: 'Max Supply', value: '1T', icon: Coins },
    { label: 'Launch Price', value: '$0.10', icon: DollarSign },
    { label: 'Mint Burn', value: '20%', icon: Flame },
    { label: 'Transfer Tax', value: '7%', icon: Target },
  ];
  const splits = [
    { label: 'User reward', pct: '75%', desc: 'Goes to your wallet on every mint' },
    { label: 'Burn', pct: '20%', desc: 'Permanently removed — deflationary by design' },
    { label: 'Liquidity', pct: '3%', desc: 'Auto-injected to USDC pool each round' },
    { label: 'Treasury', pct: '2%', desc: 'Funds protocol operations & growth' },
  ];
  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="02 — The Economy"
        title="$ZSOLAR tokenomics"
        description="1 trillion hard cap. Aggressive deflation. Every mint burns supply and seeds liquidity."
        icon={Coins}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 text-center">
              <s.icon className="h-4 w-4 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Mint distribution
          </h3>
          <div className="space-y-2.5">
            {splits.map((s) => (
              <div key={s.label} className="flex items-start justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs flex-shrink-0">{s.pct}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
        <Link to="/demo/tokenomics">
          Full tokenomics
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </Button>
    </section>
  );
}

function ProofOfGenesisSection() {
  const marks = [
    { mark: 'Proof-of-Genesis™', desc: 'The consensus primitive: Proof-of-Delta + Proof-of-Origin. Mints from verified clean energy instead of burning energy to prove waste.', icon: Sparkles },
    { mark: 'Tap-to-Mint™', desc: 'One tap reads device data, runs the proof, mints $ZSOLAR.', icon: Zap },
    { mark: 'Mint-on-Proof™', desc: 'No proof, no mint. Period. Every token traces back to a verified physical event.', icon: ShieldCheck },
  ];
  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="03 — The Thesis"
        title="Proof-of-Genesis™"
        description="Bitcoin proves work. We prove genesis — the verified moment clean energy enters the world."
        icon={Sparkles}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {marks.map((m) => (
          <Card key={m.mark} className="border-border/60 hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <m.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold text-sm mb-1.5">{m.mark}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
        <Link to="/demo/proof-of-genesis">
          See full trademark portfolio
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </Button>
    </section>
  );
}

function PatentTechSection() {
  const layers = [
    { n: 1, title: 'API Aggregation', desc: 'OAuth into Tesla, Enphase, SolarEdge, Wallbox. Zero hardware.' },
    { n: 2, title: 'Data Normalization', desc: 'Every provider unified into one Impact Score (kg CO₂ / kWh).' },
    { n: 3, title: 'Verification Engine', desc: 'Cryptographically signed device data — tamper-evident.' },
    { n: 4, title: 'Smart Contract Bridge', desc: 'Mint-on-Proof™ to Base L2. Anti-double-mint registry.' },
  ];
  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="04 — The Engine"
        title="Patent-pending tech"
        description="SEGI — the four-layer engine that turns real-world clean energy into on-chain currency."
        icon={Cpu}
      />
      <div className="space-y-2">
        {layers.map((l) => (
          <Card key={l.n} className="border-border/60">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary font-mono">L{l.n}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">{l.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{l.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
        <Link to="/demo/technology">
          See full architecture
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </Button>
    </section>
  );
}
