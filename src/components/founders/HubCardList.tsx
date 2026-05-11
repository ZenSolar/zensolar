import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Coffee,
  Sparkles as SparklesIcon,
  Activity,
  Battery,
  Gauge,
  ShieldCheck,
  Download,
  ListTree,
  Pin,
  PinOff,
  Banknote,
  Bitcoin,
  Rocket,
  FileText,
  Presentation,
  MessageSquare,
  History,
  LayoutDashboard,
  Droplets,
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
export const HUB_CARDS: HubCardDef[] = [
  {
    id: "creative-1to1-tokenomics",
    to: "/founders/creative-1to1-tokenomics-ideas",
    eyebrow: "Tokenomics · 1:1 kWh → $ZSOLAR",
    title: "Creative 1:1 Tokenomics Ideas",
    blurb: "9 smart contract rules to enable a true 1:1 mint ratio while keeping UX simple for Tesla/solar/EV users.",
    icon: Lightbulb,
    tone: "primary",
    createdAt: "2026-05-11",
  },
  {
    id: "funded-lp",
    to: "/founders/funded-lp",
    eyebrow: "LP Strategy · Founder-Funded",
    title: "Founder-Funded LP",
    blurb: "How Joseph + Michael seed the OG-round LP ($50K USDC) before any outside capital.",
    icon: Droplets,
    tone: "eco",
    createdAt: "2026-04-29",
  },
  {
    id: "competitive-landscape",
    to: "/founders/competitive-landscape",
    eyebrow: "Pre-Meeting · Q1",
    title: "Competitive Landscape",
    blurb: "Why we're not SolarCoin (or anyone else). Side-by-side, per-competitor wedge, category validation.",
    icon: ShieldCheck,
    tone: "primary",
    createdAt: "2026-05-11",
  },
  {
    id: "the-ask",
    to: "/founders/the-ask",
    eyebrow: "For Lyndon · Board Seat + $5M Seed",
    title: "The Ask — Lyndon",
    blurb: "Board seat to co-shape the protocol + $5M seed to ship the next 24 months. One conversation, two parts.",
    icon: Banknote,
    tone: "amber",
    createdAt: "2026-05-11",
  },
  {
    id: "lyndon-pitch-v2",
    to: "/founders/lyndon-pitch-v2",
    eyebrow: "Pitch · Long-Form v2",
    title: "Lyndon Pitch v2",
    blurb: "Full narrative pitch deck for Lyndon — vision, moat, ladder, ask.",
    icon: Presentation,
    tone: "primary",
    createdAt: "2026-04-29",
  },
  {
    id: "lyndon-one-pager",
    to: "/founders/lyndon",
    eyebrow: "Pitch · Short-Form",
    title: "Lyndon One-Pager",
    blurb: "The quick read companion to the long pitch. Print-friendly.",
    icon: FileText,
    tone: "primary",
    createdAt: "2026-04-29",
  },
  {
    id: "master-outline",
    to: "/founders/master-outline",
    eyebrow: "Source of Truth · Living Doc",
    title: "Master Outline",
    blurb: "Canonical record of every change to the business and model. Start here.",
    icon: ListTree,
    tone: "primary",
    createdAt: "2026-04-28",
  },
  {
    id: "tschida",
    to: "/founders/tschida",
    eyebrow: "Private · For Michael Tschida",
    title: "50/50 Split Handout",
    blurb: "Branded one-pager PDF. Verified against the live transparency model.",
    icon: Download,
    tone: "eco",
    createdAt: "2026-04-28",
  },
  {
    id: "bitcoin-thesis",
    to: "/founders/bitcoin-thesis",
    eyebrow: "Thesis · Why $ZSOLAR Eclipses BTC",
    title: "Bitcoin Thesis",
    blurb: "Δ + Origin vs. SHA-256. Why energy-backed currency wins the next 20 years.",
    icon: Bitcoin,
    tone: "amber",
    createdAt: "2026-04-27",
  },
  {
    id: "spacex",
    to: "/founders/spacex",
    eyebrow: "Comparable · Trajectory Mirror",
    title: "SpaceX Comparable",
    blurb: "Why ZenSolar's curve mirrors SpaceX 2002→2024 — and the timing of each leg.",
    icon: Rocket,
    tone: "primary",
    createdAt: "2026-04-27",
  },
  {
    id: "patent-expansion",
    to: "/founders/patent-expansion",
    eyebrow: "Patent · Phase 3 Claims",
    title: "Bi-Directional EV + FSD",
    blurb: "V2G / V2H / V2L + FSD autonomous miles. File now, ship later.",
    icon: ShieldCheck,
    tone: "primary",
    createdAt: "2026-04-26",
  },
  {
    id: "energy-oracle",
    to: "/founders/energy-oracle",
    eyebrow: "Patent Track 2.5 · Parked",
    title: "Energy Price Oracle",
    blurb: "Per-user verified $/kWh on-chain. Series A moat. NOT in seed pitch.",
    icon: Gauge,
    tone: "primary",
    createdAt: "2026-04-25",
  },
  {
    id: "app-overhaul-plan",
    to: "/founders/app-overhaul-plan",
    eyebrow: "Product · Roadmap",
    title: "App Overhaul Plan",
    blurb: "What ships next in the PWA — sequencing, scope, and dependencies.",
    icon: LayoutDashboard,
    tone: "eco",
    createdAt: "2026-04-22",
  },
  {
    id: "v2app",
    to: "/founders/v2app",
    eyebrow: "Preview · V2 App Concepts",
    title: "V2 App Variants",
    blurb: "Side-by-side dashboard variants A/B for the next-gen home screen.",
    icon: LayoutDashboard,
    tone: "amber",
    createdAt: "2026-04-20",
  },
  {
    id: "deason-v3",
    to: "/founders/deason-v3",
    eyebrow: "Deason · Conversational AI v3",
    title: "Deason v3",
    blurb: "Next iteration of the in-app AI assistant — scope, tools, guardrails.",
    icon: MessageSquare,
    tone: "primary",
    createdAt: "2026-04-19",
  },
  {
    id: "vpp-roadmap",
    to: "/founders/vpp-roadmap",
    eyebrow: "Phase 2 · Post-Seed Revenue",
    title: "VPP Program Roadmap",
    blurb: "Phase 1 mints today. Phase 2 layers VPP. 50% → LP on every dollar.",
    icon: Battery,
    tone: "eco",
    createdAt: "2026-04-18",
  },
  {
    id: "proof-of-genesis",
    to: "/founders/proof-of-genesis",
    eyebrow: "NDA-Shareable · Investor Brief",
    title: "Proof of Genesis™",
    blurb:
      "Δ + Origin → the primitive that eclipses Bitcoin. One-screen narrative + diagrams.",
    icon: SparklesIcon,
    tone: "primary",
    createdAt: "2026-04-15",
  },
  {
    id: "transparency",
    to: "/transparency",
    eyebrow: "Preview · Public Dashboard",
    title: "Transparency Page",
    blurb:
      "Live network stats, LP reserves, wave progress. Hidden from prod until you launch it.",
    icon: Activity,
    tone: "amber",
    createdAt: "2026-04-10",
  },
  {
    id: "changelog",
    to: "/founders/changelog",
    eyebrow: "Log · What Changed When",
    title: "Founders Changelog",
    blurb: "Dated record of meaningful product, model, and narrative changes.",
    icon: History,
    tone: "eco",
    createdAt: "2026-04-08",
  },
  {
    id: "catchup",
    to: "/founders/catchup",
    eyebrow: "Async Briefing · Daily Roll-Up",
    title: "Catchup",
    blurb: "What's new since your last visit + decisions awaiting your 👍 / 👎.",
    icon: Coffee,
    tone: "primary",
    createdAt: "2026-04-05",
  },
];

const PIN_STORAGE_KEY = "zen.foundersHub.pinned";
const DEFAULT_PINNED = ["master-outline"];

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
