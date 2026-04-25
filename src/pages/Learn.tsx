import { useMemo, useState } from 'react';
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
  Search,
  FileText,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/SEO';
import {
  PageShell,
  SectionHeader,
  PageSectionNav,
  useSectionNavigation,
} from '@/components/layout/PageShell';
import { useLearnTheme } from '@/hooks/useLearnTheme';
import { LEARN_THEMES } from '@/lib/learnThemes';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'index', label: 'Browse', icon: Search },
  { id: 'how-it-works', label: 'How It Works', icon: BookOpen },
  { id: 'tokenomics', label: 'Tokenomics', icon: Coins },
  { id: 'proof-of-genesis', label: 'Proof-of-Genesis™', icon: Sparkles },
  { id: 'patent', label: 'Patent Tech', icon: Cpu },
] as const;

type SectionId = typeof sections[number]['id'];

/* -------------------------------------------------------------------------- */
/*                              SEARCH INDEX DATA                             */
/* -------------------------------------------------------------------------- */

type LearnCategory = 'Engineering' | 'Tokenomics' | 'Patent Tech' | 'White Paper';

interface LearnEntry {
  title: string;
  description: string;
  href: string;
  category: LearnCategory;
  keywords: string[];
}

const LEARN_ENTRIES: LearnEntry[] = [
  // Engineering
  { title: 'How ZenSolar works', description: 'Connect → generate → Tap-to-Mint™ → level up.', href: '/demo/how-it-works', category: 'Engineering', keywords: ['onboarding', 'flow', 'tesla', 'enphase', 'wallbox', 'solaredge'] },
  { title: 'Full architecture', description: 'The four-layer SEGI engine — APIs, normalization, verification, mint bridge.', href: '/demo/technology', category: 'Engineering', keywords: ['segi', 'architecture', 'oauth', 'base l2'] },
  { title: 'Energy verification engine', description: 'How device data is signed, normalized, and made tamper-evident.', href: '/demo/technology', category: 'Engineering', keywords: ['verification', 'signing', 'impact score'] },
  // Tokenomics
  { title: 'Full tokenomics', description: '1T cap, 75/20/3/2 mint split, 7% transfer tax, LP-seeded launch at $0.10.', href: '/demo/tokenomics', category: 'Tokenomics', keywords: ['supply', 'burn', 'liquidity', 'treasury', 'lp'] },
  { title: 'Launch model & LP rounds', description: 'Tranche-per-round LP seeding — circulating vs pact-locked supply.', href: '/demo/tokenomics', category: 'Tokenomics', keywords: ['launch', 'lp rounds', 'tranches', 'usdc'] },
  { title: 'Founders pact & legacy lock', description: 'Joseph 150B / Michael 50B — pact-locked allocations and crossover prices.', href: '/demo/tokenomics', category: 'Tokenomics', keywords: ['founders', 'pact', 'trillionaire', 'crossover'] },
  // Patent Tech
  { title: 'Proof-of-Genesis™', description: 'The consensus primitive: Proof-of-Delta + Proof-of-Origin.', href: '/demo/proof-of-genesis', category: 'Patent Tech', keywords: ['proof', 'delta', 'origin', 'consensus'] },
  { title: 'Tap-to-Mint™', description: 'One tap reads device data, runs the proof, mints $ZSOLAR.', href: '/demo/proof-of-genesis', category: 'Patent Tech', keywords: ['mint', 'tap', 'one tap'] },
  { title: 'Mint-on-Proof™', description: 'No proof, no mint — every token traces to a verified physical event.', href: '/demo/proof-of-genesis', category: 'Patent Tech', keywords: ['mint', 'proof', 'verified'] },
  // White Paper
  { title: 'ZenSolar White Paper', description: 'The complete thesis, mechanics, and roadmap in one document.', href: '/white-paper', category: 'White Paper', keywords: ['whitepaper', 'thesis', 'roadmap'] },
  { title: 'Patent claims & filings', description: 'USPTO claim references for the SEGI engine and Proof-of-Genesis™.', href: '/demo/technology', category: 'White Paper', keywords: ['uspto', 'patent', 'filing', 'claims'] },
];

const CATEGORY_META: Record<LearnCategory, { icon: typeof Cpu; tone: string }> = {
  'Engineering': { icon: Cpu, tone: 'text-primary' },
  'Tokenomics': { icon: Coins, tone: 'text-primary' },
  'Patent Tech': { icon: Sparkles, tone: 'text-primary' },
  'White Paper': { icon: FileText, tone: 'text-primary' },
};

const ALL_CATEGORIES: LearnCategory[] = ['Engineering', 'Tokenomics', 'Patent Tech', 'White Paper'];

export default function Learn() {
  const { active, select } = useSectionNavigation<SectionId>(sections, 'index');
  const learnTheme = useLearnTheme();
  const currentThemeName = LEARN_THEMES.find((theme) => theme.id === learnTheme)?.name ?? 'Cupertino Cryo';

  return (
    <>
      <SEO title="Learn" url="https://beta.zen.solar/learn" />
      <div data-learn-theme={learnTheme} className="learn-surface">
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
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Current theme: {currentThemeName}
          </div>
          <div className="space-y-12 sm:space-y-16">
            <section id="index" className="scroll-mt-32"><LearnIndexSection /></section>
            <section id="how-it-works" className="scroll-mt-32 min-h-[220px]"><HowItWorksSection /></section>
            <section id="tokenomics" className="scroll-mt-32 min-h-[360px]"><TokenomicsSection /></section>
            <section id="proof-of-genesis" className="scroll-mt-32 min-h-[320px]"><ProofOfGenesisSection /></section>
            <section id="patent" className="scroll-mt-32 min-h-[300px]"><PatentTechSection /></section>
          </div>
        </PageShell>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                            LEARN INDEX (SEARCH)                            */
/* -------------------------------------------------------------------------- */

function LearnIndexSection() {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<LearnCategory>>(new Set());

  const toggleFilter = (cat: LearnCategory) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LEARN_ENTRIES.filter(e => {
      if (activeFilters.size > 0 && !activeFilters.has(e.category)) return false;
      if (!q) return true;
      const hay = [e.title, e.description, e.category, ...e.keywords].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeFilters]);

  const clearAll = () => { setQuery(''); setActiveFilters(new Set()); };
  const hasActive = query.trim().length > 0 || activeFilters.size > 0;

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="00 — Browse"
        title="Find a topic"
        description="Search the entire Learn hub or filter by category."
        icon={Search}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search engineering, tokenomics, patents…"
          className="pl-9 pr-9 h-11"
          aria-label="Search Learn topics"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {ALL_CATEGORIES.map(cat => {
          const Icon = CATEGORY_META[cat].icon;
          const isOn = activeFilters.has(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleFilter(cat)}
              aria-pressed={isOn}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                "active:scale-95 motion-reduce:active:scale-100",
                isOn
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground/80 border-border/60 hover:border-primary/40 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat}
            </button>
          );
        })}
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Results */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {results.length} {results.length === 1 ? 'topic' : 'topics'}
        </p>
        {results.length === 0 ? (
          <Card className="learn-card border-dashed border-border/60">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No topics match your search.</p>
              <Button variant="ghost" size="sm" onClick={clearAll} className="mt-2 text-primary">
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {results.map(entry => {
              const Icon = CATEGORY_META[entry.category].icon;
              return (
                <Link
                  key={entry.title}
                  to={entry.href}
                  className="group block"
                >
                  <Card className="learn-card h-full border-border/60 group-hover:border-primary/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm leading-tight">{entry.title}</h3>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{entry.description}</p>
                          <Badge variant="secondary" className="mt-2 text-[10px] font-medium">{entry.category}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
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
          <Card key={s.title} className="learn-card h-full border-border/60 hover:border-primary/40 transition-colors fade-up" style={{ animationDelay: `${i * 50}ms` }}>
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
          <Card key={s.label} className="learn-card border-border/60">
            <CardContent className="p-4 text-center">
              <s.icon className="h-4 w-4 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="learn-card border-border/60">
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
          <Card key={m.mark} className="learn-card border-border/60 hover:border-primary/40 transition-colors">
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
          <Card key={l.n} className="learn-card border-border/60">
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
