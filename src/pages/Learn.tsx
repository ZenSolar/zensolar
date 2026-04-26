import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Coins,
  Cpu,
  FileText,
  Search,
  Sparkles,
  X,
  Library,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/SEO';
import { PageShell, SectionHeader } from '@/components/layout/PageShell';
import { useLearnTheme } from '@/hooks/useLearnTheme';
import {
  DEFAULT_LEARN_THEME,
  LEARN_THEMES,
  setStoredLearnTheme,
  type LearnTheme,
} from '@/lib/learnThemes';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Hub topic cards — each routes to a focused sub-page                        */
/* -------------------------------------------------------------------------- */

interface Topic {
  title: string;
  blurb: string;
  href: string;
  icon: typeof BookOpen;
  badge: string;
  /** Time to read estimate so users know what they're committing to. */
  read: string;
}

const TOPICS: Topic[] = [
  {
    title: 'How It Works',
    blurb: 'The four-step game: connect → generate → tap → level up. Start here if you\'re new.',
    href: '/demo/learn/how-it-works',
    icon: BookOpen,
    badge: 'Start here',
    read: '2 min',
  },
  {
    title: 'Tokenomics',
    blurb: '1T hard cap, 75/20/3/2 mint split, deflationary by design. Built to not crash.',
    href: '/demo/learn/tokenomics',
    icon: Coins,
    badge: 'The numbers',
    read: '3 min',
  },
  {
    title: 'Proof-of-Genesis™',
    blurb: 'Why we don\'t burn energy to make money — we prove energy and mint from it.',
    href: '/demo/learn/proof-of-genesis',
    icon: Sparkles,
    badge: 'The thesis',
    read: '3 min',
  },
  {
    title: 'Patent Tech',
    blurb: 'The four-layer SEGI engine that turns Tesla / Enphase data into on-chain currency.',
    href: '/demo/learn/patent-tech',
    icon: Cpu,
    badge: 'The engine',
    read: '4 min',
  },
];

/* -------------------------------------------------------------------------- */
/*  Glossary — single source of truth for the plain-language explainers        */
/* -------------------------------------------------------------------------- */

interface GlossaryEntry {
  term: string;
  short: string;
}

const GLOSSARY: GlossaryEntry[] = [
  { term: '$ZSOLAR', short: 'The reward currency you earn for clean energy. Like loyalty points — but tradeable.' },
  { term: 'Tap-to-Mint™', short: 'One tap reads your device data, verifies the energy, and credits your account.' },
  { term: 'Proof-of-Genesis™', short: 'Our way of proving your clean energy is real before turning it into rewards.' },
  { term: 'Mint', short: 'Convert verified clean energy into $ZSOLAR — like cashing in a check.' },
  { term: 'Burn', short: 'Permanently removed from circulation — making the remaining supply more valuable.' },
  { term: 'NFT', short: 'A collectible badge for hitting a milestone (like 1,000 solar kWh). Yours forever.' },
  { term: 'Wallet', short: 'Your account that holds $ZSOLAR and NFTs. We create one for you automatically.' },
  { term: 'Liquidity (LP)', short: 'The pool of $ZSOLAR + USDC that lets you trade tokens at a fair market price.' },
  { term: 'Base L2', short: 'The blockchain we mint on — fast, cheap, and built by Coinbase on top of Ethereum.' },
  { term: 'kWh', short: 'Kilowatt-hour — the unit your solar panels and EV charger already report.' },
];

export default function Learn() {
  const learnTheme = useLearnTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.documentElement.dataset.learnTheme = learnTheme;
    return () => {
      delete document.documentElement.dataset.learnTheme;
    };
  }, [learnTheme]);

  const visibleTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOPICS;
    return TOPICS.filter(t =>
      [t.title, t.blurb, t.badge].join(' ').toLowerCase().includes(q),
    );
  }, [query]);

  const visibleGlossary = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(g =>
      [g.term, g.short].join(' ').toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <>
      <SEO title="Learn" url="https://beta.zen.solar/demo/learn" />
      <div data-learn-theme={learnTheme} className="learn-surface">
        <PageShell
          title="Learn"
          description="Pick a topic. Each one is a quick, focused read — no walls of text."
          icon={BookOpen}
          width="4xl"
        >
          <div className="space-y-10">
            <LiveThemeSwitcher current={learnTheme} />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search topics or glossary…"
                className="pl-9 pr-9 h-11"
                aria-label="Search Learn"
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

            {/* Topic cards */}
            <section className="space-y-4">
              <SectionHeader
                eyebrow="Topics"
                title="Pick what you want to learn"
                description="Each card opens its own focused page so you're never overwhelmed."
                icon={Library}
              />
              {visibleTopics.length === 0 ? (
                <Card className="learn-card border-dashed border-border/60">
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    No topics match "{query}". Try the glossary below.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleTopics.map((topic) => (
                    <Link key={topic.href} to={topic.href} className="group block">
                      <Card className="learn-card h-full border-border/60 group-hover:border-primary/50 group-hover:shadow-md transition-all">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <topic.icon className="h-5 w-5 text-primary" />
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-medium flex-shrink-0">
                              {topic.badge}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-base leading-tight mb-1">{topic.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{topic.blurb}</p>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                            <span className="text-[11px] text-muted-foreground font-medium">{topic.read} read</span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-1.5 transition-all">
                              Open
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Quick links */}
            <section className="space-y-3">
              <SectionHeader
                eyebrow="Go deeper"
                title="Full reference docs"
                description="Already familiar? Jump straight to the long-form material."
                icon={FileText}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { label: 'White Paper', href: '/demo/white-paper' },
                  { label: 'Engineering deep-dive', href: '/demo/engineering' },
                  { label: 'Full architecture', href: '/demo/technology' },
                  { label: 'Trademark portfolio', href: '/demo/proof-of-genesis' },
                ].map((link) => (
                  <Button
                    key={link.href}
                    asChild
                    variant="outline"
                    className="justify-between border-border/60 hover:border-primary/50"
                  >
                    <Link to={link.href}>
                      <span>{link.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ))}
              </div>
            </section>

            {/* Glossary */}
            <GlossarySection entries={visibleGlossary} totalCount={GLOSSARY.length} />
          </div>
        </PageShell>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Glossary section — plain-language terms at the bottom of the hub           */
/* -------------------------------------------------------------------------- */

function GlossarySection({ entries, totalCount }: { entries: GlossaryEntry[]; totalCount: number }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Plain English"
        title="Glossary"
        description="Every term used across ZenSolar, explained in one sentence."
        icon={BookOpen}
      />
      {entries.length === 0 ? (
        <Card className="learn-card border-dashed border-border/60">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No terms match your search.
          </CardContent>
        </Card>
      ) : (
        <Card className="learn-card border-border/60">
          <CardContent className="p-0 divide-y divide-border/40">
            {entries.map((g) => (
              <div key={g.term} className="px-4 py-3 sm:px-5 sm:py-4">
                <p className="text-sm font-semibold text-foreground">{g.term}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{g.short}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {entries.length > 0 && entries.length < totalCount && (
        <p className="text-[11px] text-muted-foreground">
          Showing {entries.length} of {totalCount} terms
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Live theme switcher (kept — user confirmed this works)                     */
/* -------------------------------------------------------------------------- */

function LiveThemeSwitcher({ current }: { current: LearnTheme }) {
  const handlePick = (id: LearnTheme) => setStoredLearnTheme(id);
  const handleReset = () => setStoredLearnTheme(DEFAULT_LEARN_THEME);

  return (
    <section
      aria-label="Live theme switcher"
      className="learn-card border border-border/60 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Live theme
          </p>
          <h2 className="text-sm font-semibold mt-0.5">
            Try a different look
          </h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Reset
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {LEARN_THEMES.map((t) => {
          const isActive = current === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handlePick(t.id)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-foreground/80 border-border/60 hover:border-primary/40 hover:text-foreground',
              )}
            >
              {isActive && <Sparkles className="h-3 w-3" aria-hidden />}
              {t.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
