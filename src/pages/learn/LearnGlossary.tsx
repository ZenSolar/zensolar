import { useMemo, useState } from 'react';
import { Search, X, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';

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

export default function LearnGlossary() {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter((g) => `${g.term} ${g.short}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <LearnSubPageShell
      title="Glossary"
      description="Every term used across ZenSolar, explained in one sentence."
      icon={BookOpen}
      seoTitle="Glossary"
      seoUrl="https://beta.zen.solar/learn/glossary"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms…"
            className="pl-9 pr-9 h-11"
            aria-label="Search glossary"
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

        {visible.length === 0 ? (
          <Card className="learn-card border-dashed border-border/60">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No terms match "{query}".
            </CardContent>
          </Card>
        ) : (
          <Card className="learn-card border-border/60">
            <CardContent className="p-0 divide-y divide-border/40">
              {visible.map((g) => (
                <div key={g.term} className="px-4 py-3 sm:px-5 sm:py-4">
                  <p className="text-sm font-semibold text-foreground">{g.term}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{g.short}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </LearnSubPageShell>
  );
}
