import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Term = {
  term: string;
  short: string;
  detail?: string;
  category: Category;
  also?: string[];
};

type Category =
  | "Basics"
  | "What You Do"
  | "Money & Rewards"
  | "Real-World Energy"
  | "Trust & Safety"
  | "Behind the Scenes";

const CATEGORIES: Category[] = [
  "Basics",
  "What You Do",
  "Money & Rewards",
  "Real-World Energy",
  "Trust & Safety",
  "Behind the Scenes",
];

const TERMS: Term[] = [
  // Basics
  {
    term: "ZenSolar",
    category: "Basics",
    short: "An app that turns your clean energy into real rewards.",
    detail:
      "If you have solar panels, a home battery, or an EV, ZenSolar gives you credit every time you make or use clean energy — and that credit becomes money in your account.",
  },
  {
    term: "Clean Energy Center",
    category: "Basics",
    short: "Your personal dashboard inside ZenSolar.",
    detail:
      "It's the screen that shows what you've produced, what you've earned, and what's happening with your panels, battery, or EV in real time.",
  },
  {
    term: "kWh (kilowatt-hour)",
    category: "Basics",
    short: "The unit of clean energy you produce or use.",
    detail:
      "1 kWh is roughly what it takes to run a microwave for an hour. ZenSolar pays you for every kWh you create or charge cleanly.",
  },
  {
    term: "EV (Electric Vehicle)",
    category: "Basics",
    short: "Any car that runs on electricity instead of gas.",
    detail: "When you charge your EV from clean energy, ZenSolar counts those kWh too.",
  },
  {
    term: "Home Battery",
    category: "Basics",
    short: "A wall-mounted battery that stores your solar energy for later.",
    detail:
      "Examples: Tesla Powerwall, Enphase IQ Battery. Storing and using clean energy from your battery counts toward your rewards.",
  },
  {
    term: "Solar Panels",
    category: "Basics",
    short: "The panels on your roof (or yard) that turn sunlight into electricity.",
  },
  {
    term: "Subscription",
    category: "Basics",
    short: "Your monthly ZenSolar plan.",
    detail:
      "It unlocks unlimited rewards, premium features, and your share of the rewards pool. Think Netflix, but it pays you back.",
  },

  // What You Do
  {
    term: "Proof of Genesis™",
    category: "What You Do",
    short: "Tap a button to turn your clean energy into a reward.",
    detail:
      "Whenever you've made or used clean energy, you tap once and ZenSolar instantly records it and credits your account.",
  },
  {
    term: "Mint",
    category: "What You Do",
    short: "The act of claiming a reward for your clean energy.",
    detail:
      "Each mint is a receipt — proof that a specific amount of clean energy happened and that you earned credit for it.",
  },
  {
    term: "Mint History",
    category: "What You Do",
    short: "Your full log of every reward you've ever claimed.",
    detail: "Like a bank statement, but for your clean energy.",
  },
  {
    term: "Energy Log",
    category: "What You Do",
    short: "A detailed breakdown of your daily energy production and use.",
  },
  {
    term: "Rewards",
    category: "What You Do",
    short: "What you earn for making or using clean energy.",
    detail:
      "Rewards build up in your account and can be spent in the store, saved, or eventually converted to cash.",
  },
  {
    term: "NFT Receipt",
    category: "What You Do",
    short: "A unique collectible proving a specific clean-energy moment was yours.",
    detail:
      "Big milestones (your first mint, your 1,000th kWh, an eclipse-day mint) come with a one-of-a-kind digital collectible you can keep, display, or trade.",
  },
  {
    term: "Store",
    category: "What You Do",
    short: "Where you spend your rewards.",
    detail: "Gift cards, gear, charging credits, and ZenSolar-exclusive items.",
  },
  {
    term: "Referrals",
    category: "What You Do",
    short: "Invite a friend, both of you earn bonus rewards.",
  },

  // Money & Rewards
  {
    term: "Reward Pool",
    category: "Money & Rewards",
    short: "The shared pot of value that subscribers earn from.",
    detail:
      "Every subscription, every mint, and every transaction feeds the pool. The more active the community, the bigger everyone's share.",
  },
  {
    term: "Price Floor",
    category: "Money & Rewards",
    short: "A built-in safety net under the value of your rewards.",
    detail:
      "ZenSolar is designed so your rewards can't fall below the real-world value of the clean energy that backed them.",
  },
  {
    term: "Burn",
    category: "Money & Rewards",
    short: "Permanently removing some rewards from circulation.",
    detail:
      "Every time someone mints, a small slice is destroyed forever. Fewer rewards in the world over time means each remaining one tends to be more valuable.",
  },
  {
    term: "Liquidity",
    category: "Money & Rewards",
    short: "How easily your rewards can be turned into cash.",
    detail:
      "ZenSolar funds a built-in exchange so you can always cash out your rewards without waiting.",
  },
  {
    term: "Treasury",
    category: "Money & Rewards",
    short: "A community fund used to keep ZenSolar running and growing.",
    detail:
      "A small share of every mint goes to the treasury — it pays for new features, partnerships, and emergencies.",
  },
  {
    term: "Cap",
    category: "Money & Rewards",
    short: "The maximum number of rewards that will ever exist.",
    detail:
      "ZenSolar has a fixed lifetime supply. No surprise inflation, no diluting your share.",
  },

  // Real-World Energy
  {
    term: "Grid",
    category: "Real-World Energy",
    short: "The big network of wires that delivers electricity to homes.",
    detail:
      "When your solar produces more than you use, the extra often flows back to the grid for your neighbors.",
  },
  {
    term: "Net Metering",
    category: "Real-World Energy",
    short: "Getting credit from your utility for the extra solar power you send to the grid.",
  },
  {
    term: "Carbon Offset",
    category: "Real-World Energy",
    short: "A measurable reduction in pollution you helped prevent.",
    detail:
      "Every kWh of clean energy you make replaces dirty energy that would have come from gas or coal. ZenSolar tracks the pollution you prevented.",
  },
  {
    term: "CO₂ Avoided",
    category: "Real-World Energy",
    short: "How much pollution you've kept out of the air.",
    detail:
      "Shown in pounds or tons. Your Proof-of-Genesis receipt headlines this number — it's the most honest measure of your impact.",
  },
  {
    term: "Renewable Energy Certificate",
    category: "Real-World Energy",
    short: "A formal record that 1 unit of clean energy was actually produced.",
    detail:
      "Utilities, governments, and big companies use these to prove their clean-energy claims. ZenSolar's receipts work the same way.",
  },
  {
    term: "OEM",
    category: "Real-World Energy",
    short: "The brand that made your equipment.",
    detail:
      "Tesla, Enphase, SolarEdge, Sunrun, Ford — these are OEMs. ZenSolar connects to your OEM's app to read your real energy data.",
    also: ["Tesla", "Enphase", "SolarEdge"],
  },

  // Trust & Safety
  {
    term: "Proof-of-Genesis™",
    category: "Trust & Safety",
    short: "The proof that your clean energy was real.",
    detail:
      "Every reward comes with a tamper-proof receipt showing exactly what happened, when, and how much pollution was avoided. Anyone can verify it.",
  },
  {
    term: "Verified Energy",
    category: "Trust & Safety",
    short: "Energy ZenSolar has confirmed actually happened.",
    detail:
      "We pull your data directly from your equipment's official app (Tesla, Enphase, etc.), so no one can fake it.",
  },
  {
    term: "Receipt",
    category: "Trust & Safety",
    short: "A permanent record of one reward you earned.",
    detail:
      "Like a paper receipt from a store, except it can never be lost, altered, or denied. Shareable with a single link.",
  },
  {
    term: "Wallet",
    category: "Trust & Safety",
    short: "Your secure account where rewards and collectibles live.",
    detail:
      "ZenSolar gives you one automatically when you sign up. You don't have to install or set up anything — it just works.",
  },
  {
    term: "Sign-in",
    category: "Trust & Safety",
    short: "Use your Google or Apple account.",
    detail: "No long passwords, no seed phrases to memorize. The same login you already use.",
  },
  {
    term: "Self-Custody (optional)",
    category: "Trust & Safety",
    short: "Holding your rewards in your own wallet instead of ours.",
    detail:
      "Advanced users can move their rewards out of ZenSolar into a wallet they fully control. Most members never need to.",
  },

  // Behind the Scenes
  {
    term: "Proof of Genesis™ Engine",
    category: "Behind the Scenes",
    short: "The patented technology that makes one-tap rewards possible.",
  },
  {
    term: "Mint-on-Proof™",
    category: "Behind the Scenes",
    short: "ZenSolar's rule: no proof, no reward.",
    detail:
      "We only create rewards after we've confirmed clean energy actually happened. No guesses, no estimates, no fakes.",
  },
  {
    term: "Anchored",
    category: "Behind the Scenes",
    short: "Locked in so it can never be changed.",
    detail:
      "Once a receipt is anchored, it's permanent. ZenSolar can't edit it. Neither can anyone else.",
  },
  {
    term: "Oracle",
    category: "Behind the Scenes",
    short: "A trusted source of real-world information.",
    detail:
      "ZenSolar uses oracles to confirm things like the current price of electricity in your area.",
  },
  {
    term: "Base",
    category: "Behind the Scenes",
    short: "The fast, low-cost network ZenSolar runs on.",
    detail:
      "Built by Coinbase. It's what lets your mints happen instantly and almost for free.",
  },
  {
    term: "Beta",
    category: "Behind the Scenes",
    short: "ZenSolar's early-access period.",
    detail:
      "You're using a working version of the app while we polish the final pieces. Your activity counts toward real future rewards.",
  },
];

export default function Glossary() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => {
      if (activeCategory !== "All" && t.category !== activeCategory) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.short.toLowerCase().includes(q) ||
        (t.detail?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<Category, Term[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const t of filtered) map.get(t.category)!.push(t);
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:pt-10">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 text-primary mb-2">
            <BookOpen className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Glossary
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Plain-English Dictionary
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Every word in ZenSolar, explained like you're talking to a friend. No jargon. No
            buzzwords. Just what it means and why it matters to you.
          </p>
        </header>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a term…"
            className="pl-9 h-11"
            aria-label="Search the glossary"
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["All", ...CATEGORIES] as const).map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border touch-target",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40",
                )}
                aria-pressed={active}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No terms match "{query}". Try a different word.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, items]) => (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2
                  id={`cat-${category}`}
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1"
                >
                  {category}
                </h2>
                <ul className="space-y-2">
                  {items.map((t) => (
                    <li key={t.term}>
                      <Card className="p-4 hover:border-primary/40 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="text-base font-semibold text-foreground">
                            {t.term}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px] font-normal"
                          >
                            {t.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {t.short}
                        </p>
                        {t.detail && (
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {t.detail}
                          </p>
                        )}
                        {t.also && t.also.length > 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            See also:{" "}
                            <span className="text-foreground/80">
                              {t.also.join(", ")}
                            </span>
                          </p>
                        )}
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Missing a word? Tap <span className="text-foreground/80">Feedback</span> and tell us.
        </p>
      </div>
    </div>
  );
}
