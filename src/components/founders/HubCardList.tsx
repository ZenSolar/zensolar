import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles as SparklesIcon,
  Activity,
  Gauge,
  ShieldCheck,
  ListTree,
  Pin,
  PinOff,
  Banknote,
  Presentation,
  MessageSquare,
  Coins,
  CreditCard,
  type LucideIcon,
} from "lucide-react";


/**
 * Founders Hub — sortable, pinnable card list.
 *
 * Cards are defined declaratively in HUB_CARDS with a `createdAt` so the hub
 * always shows newest-first. Pinned cards float above the chronological list.
 * Pin state is stored in localStorage (per-device, no backend needed).
 */

export type HubCardTone = "primary" | "eco" | "amber";

export type HubCardDef = {
  id: string;
  to: string;
  title: string;
  eyebrow: string;
  blurb: string;
  icon: LucideIcon;
  tone: HubCardTone;
  /** ISO date (YYYY-MM-DD). Used for newest-first sorting. */
  createdAt: string;
};

// Newest first by createdAt. Edit dates here to re-order.
// Only LIVE destinations — archived brainstorm pages were removed June 2026.
export const HUB_CARDS: HubCardDef[] = [
  {
    id: "ssot",
    to: "/admin/ssot",
    eyebrow: "Source of Truth · Living Doc",
    title: "SSOT — Single Source of Truth",
    blurb: "Canonical record of model, narrative, and product decisions. Supersedes Master Outline.",
    icon: ListTree,
    tone: "primary",
    createdAt: "2026-06-12",
  },
  {
    id: "todo",
    to: "/admin/todo",
    eyebrow: "Live · Work Queue",
    title: "Todo Board",
    blurb: "What's actively being built. One board, not three.",
    icon: ListTree,
    tone: "eco",
    createdAt: "2026-06-12",
  },
  {
    id: "investor-pitch",
    to: "/investor/pitch",
    eyebrow: "Investor · Canonical Pitch",
    title: "Investor Pitch",
    blurb: "The deck. Three Revenue Engines, multi-OEM moat, the ask.",
    icon: Presentation,
    tone: "amber",
    createdAt: "2026-06-10",
  },
  {
    id: "investor-one-pager",
    to: "/investor/one-pager",
    eyebrow: "Investor · One-Pager",
    title: "Investor One-Pager",
    blurb: "NDA-shareable single-page brief.",
    icon: Banknote,
    tone: "amber",
    createdAt: "2026-06-10",
  },
  {
    id: "fundraising",
    to: "/admin/fundraising",
    eyebrow: "Live · Round Tracker",
    title: "Fundraising",
    blurb: "Live round progress, allocation, commitments.",
    icon: Banknote,
    tone: "primary",
    createdAt: "2026-06-05",
  },
  {
    id: "final-tokenomics",
    to: "/admin/final-tokenomics",
    eyebrow: "Locked · 1T Era",
    title: "Final Tokenomics",
    blurb: "Mint Split v3.1 (50/25/20/5) + 3% transfer tax. The authoritative model.",
    icon: Coins,
    tone: "primary",
    createdAt: "2026-06-01",
  },
  {
    id: "subscriptions",
    to: "/admin/subscriptions",
    eyebrow: "Admin · Subscription Engine",
    title: "Subscriptions",
    blurb: "Tier config, 50/50 split, active members.",
    icon: CreditCard,
    tone: "eco",
    createdAt: "2026-06-01",
  },
  {
    id: "competitive-landscape",
    to: "/founders/competitive-landscape",
    eyebrow: "Moat · Side-by-Side",
    title: "Competitive Landscape",
    blurb: "Per-competitor wedge. Why we're not SolarCoin (or anyone else).",
    icon: ShieldCheck,
    tone: "primary",
    createdAt: "2026-05-20",
  },
  {
    id: "deason",
    to: "/deason",
    eyebrow: "AI · Founders-Only",
    title: "Deason",
    blurb: "Your in-app AI agent for thinking, drafting, and research.",
    icon: MessageSquare,
    tone: "primary",
    createdAt: "2026-05-15",
  },
  {
    id: "proof-of-genesis",
    to: "/proof-of-genesis",
    eyebrow: "Public · Canonical Receipt",
    title: "Proof of Genesis™",
    blurb: "The cryptographic primitive — Δ + Origin. Public-facing version.",
    icon: SparklesIcon,
    tone: "primary",
    createdAt: "2026-05-10",
  },
  {
    id: "transparency",
    to: "/transparency",
    eyebrow: "Public · Live Stats",
    title: "Transparency",
    blurb: "Live network stats, LP reserves, wave progress.",
    icon: Activity,
    tone: "amber",
    createdAt: "2026-04-10",
  },
];


const PIN_STORAGE_KEY = "zen.foundersHub.pinned";
const DEFAULT_PINNED = ["ssot"];


function readPinned(): Set<string> {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (!raw) return new Set(DEFAULT_PINNED);
    return new Set(JSON.parse(raw));
  } catch {
    return new Set(DEFAULT_PINNED);
  }
}

function writePinned(set: Set<string>) {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch { /* */ }
}

const TONE: Record<HubCardTone, { border: string; bg: string; iconBg: string; icon: string; arrow: string; eyebrow: string }> = {
  primary: {
    border: "border-primary/40 hover:border-primary/70",
    bg: "from-primary/10 via-primary/5 to-transparent",
    iconBg: "bg-primary/15",
    icon: "text-primary",
    arrow: "text-primary",
    eyebrow: "text-primary",
  },
  eco: {
    border: "border-eco/40 hover:border-eco/70",
    bg: "from-eco/10 via-eco/5 to-transparent",
    iconBg: "bg-eco/15",
    icon: "text-eco",
    arrow: "text-eco",
    eyebrow: "text-eco",
  },
  amber: {
    border: "border-amber-500/40 hover:border-amber-500/70",
    bg: "from-amber-500/10 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/15",
    icon: "text-amber-400",
    arrow: "text-amber-400",
    eyebrow: "text-amber-400",
  },
};

export function HubCardList() {
  const [pinned, setPinned] = useState<Set<string>>(() => readPinned());

  // Re-read on mount in case storage changed in another tab.
  useEffect(() => {
    setPinned(readPinned());
  }, []);

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writePinned(next);
      return next;
    });
  };

  // Sort: pinned first, then newest createdAt first.
  const sorted = [...HUB_CARDS].sort((a, b) => {
    const ap = pinned.has(a.id) ? 1 : 0;
    const bp = pinned.has(b.id) ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-4 md:space-y-5">
      {sorted.map((card) => (
        <HubCard
          key={card.id}
          card={card}
          pinned={pinned.has(card.id)}
          onTogglePin={() => togglePin(card.id)}
        />
      ))}
    </div>
  );
}

function HubCard({
  card,
  pinned,
  onTogglePin,
}: {
  card: HubCardDef;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const t = TONE[card.tone];
  const Icon = card.icon;

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTogglePin();
  };

  return (
    <div className="relative group">
      <Link
        to={card.to}
        className={`block rounded-2xl border ${t.border} bg-gradient-to-br ${t.bg} p-4 transition-colors`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-xl ${t.iconBg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${t.icon}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] uppercase tracking-widest ${t.eyebrow} flex items-center gap-1.5`}>
                {card.eyebrow}
                {pinned && (
                  <span className="inline-flex items-center gap-0.5 px-1 rounded-sm bg-amber-400/20 text-amber-400 text-[9px] font-semibold">
                    <Pin className="h-2.5 w-2.5" /> Pinned
                  </span>
                )}
              </p>
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {card.blurb}
              </p>
            </div>
          </div>
          <ArrowRight className={`h-4 w-4 ${t.arrow} group-hover:translate-x-0.5 transition-transform shrink-0`} />
        </div>
      </Link>

      {/* Pin / unpin button — overlay top-right */}
      <button
        type="button"
        onClick={handlePin}
        title={pinned ? "Unpin" : "Pin to top"}
        aria-label={pinned ? "Unpin card" : "Pin card to top"}
        className={`absolute top-2 right-2 h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
          pinned
            ? "text-amber-400 bg-amber-400/15 hover:bg-amber-400/25"
            : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 opacity-0 group-hover:opacity-100"
        }`}
      >
        {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
