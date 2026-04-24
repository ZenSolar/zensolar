import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  ScrollText,
  Sparkles,
  Wrench,
  Brain,
  ExternalLink,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

/**
 * Founders Changelog — gated to founders + PIN.
 *
 * Single source of truth Tschida (and Joseph) can scan to see everything
 * built/decided in each work session. Newest entry first. Every shipped
 * feature includes a tappable deep-link to the live page on beta.zen.solar.
 */

interface ChangelogLink {
  label: string;
  url: string;
  preview?: boolean;
}

interface ChangelogSection {
  heading: string;
  icon: "shipped" | "strategy" | "memory";
  bullets: string[];
  links?: ChangelogLink[];
}

interface ChangelogEntry {
  date: string; // human-readable
  iso: string; // sortable
  title: string;
  summary: string;
  sections: ChangelogSection[];
}

const ENTRIES: ChangelogEntry[] = [
  {
    date: "April 24, 2026",
    iso: "2026-04-24",
    title: "ZPPA + Wallet Proof Shortcut",
    summary:
      "Producer Priority lands in the Wallet. Whales gated, producers prioritized.",
    sections: [
      {
        heading: "Shipped",
        icon: "shipped",
        bullets: [
          "ZPPA Status Widget on Wallet — shows your 30d verified kWh, lock/unlock state, your producer-window ceiling (min($500, kWh×$0.50)), and the rules in plain English.",
          "View Proof shortcut on Wallet — your 3 most recent mints with tx hash + metadata, deep-linking to Mint History.",
          "Mint History upgrade — every transaction expands to ERC-20 transfer link, $ZSOLAR + NFT contract pages, per-NFT token-ID chips, and a Proof of Genesis link (preview-only).",
          "Proof of Genesis Receipt preview page — solar/EV/battery readings → minted tokens → CO₂ tons offset, with cryptographic evidence.",
        ],
        links: [
          { label: "Open Wallet", url: "https://beta.zen.solar/wallet" },
          { label: "Open Mint History", url: "https://beta.zen.solar/mint-history" },
          {
            label: "Proof of Genesis Receipt (preview)",
            url: "https://beta.zen.solar/proof-of-genesis-receipt-preview",
            preview: true,
          },
        ],
      },
      {
        heading: "Strategic Decisions Locked",
        icon: "strategy",
        bullets: [
          "Producer-gated LP rounds = official launch posture. Whales/Saylor cannot dominate tranches.",
          "Mechanism named ZPPA (Zen Power Purchase Agreement). Always capitalized. First mention = full name.",
          "Vesting model: 4yr linear, 1yr cliff for team & advisors.",
          "Legal entity = ZenCorp Inc — footer & legal docs only. Product UI always says ZenSolar (one word).",
          "We will NEVER IPO — corporate-style governance is the joke ZenCorp Inc winks at.",
          "Saylor framing: Bitcoin = burned-energy metaphor. ZSOLAR = created-energy reality. We don't fight him; we make his thesis literal.",
        ],
      },
      {
        heading: "Saved to Project Memory",
        icon: "memory",
        bullets: [
          "ZPPA naming/placement rules (wallet badge + tokenomics page).",
          "Producer-gated LP mechanics (25 kWh / 30d threshold, 24h producer window, weighted ceilings).",
          "ZenCorp Inc vs ZenSolar separation (legal vs product brand).",
          "Founders Changelog now a project convention — every session appends here.",
        ],
      },
    ],
  },
];

export default function FoundersChangelog() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setIsFounder(false); return; }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set((roles ?? []).map((r) => r.role));
      setIsFounder(set.has("founder") || set.has("admin"));
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || isFounder === null) {
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
      <ChangelogContent />
    </VaultPinGate>
  );
}

function iconFor(kind: ChangelogSection["icon"]) {
  switch (kind) {
    case "shipped":
      return <Wrench className="h-3.5 w-3.5" />;
    case "strategy":
      return <Sparkles className="h-3.5 w-3.5" />;
    case "memory":
      return <Brain className="h-3.5 w-3.5" />;
  }
}

function colorFor(kind: ChangelogSection["icon"]) {
  switch (kind) {
    case "shipped":
      return "text-eco border-eco/30 bg-eco/[0.06]";
    case "strategy":
      return "text-amber-400 border-amber-400/30 bg-amber-400/[0.06]";
    case "memory":
      return "text-primary border-primary/30 bg-primary/[0.06]";
  }
}

function ChangelogContent() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 pb-12"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Founders Vault
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            Founders Only
          </span>
        </div>

        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-widest mb-3">
            <ScrollText className="h-3.5 w-3.5" /> Changelog
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Founders Changelog
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Everything built, decided, and locked into project memory — session by session. Newest first.
            Tap any link to jump straight to the live page.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Internal only · Joseph & Michael Tschida · Not for distribution
          </p>
        </header>

        {/* Entries */}
        <div className="space-y-12">
          {ENTRIES.map((entry) => (
            <article key={entry.iso} className="space-y-6">
              {/* Entry header */}
              <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-border/60">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                    {entry.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{entry.summary}</p>
                </div>
                <time
                  dateTime={entry.iso}
                  className="text-[11px] uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                >
                  {entry.date}
                </time>
              </div>

              {/* Sections */}
              <div className="space-y-5">
                {entry.sections.map((section) => (
                  <section
                    key={section.heading}
                    className={`rounded-xl border p-4 ${colorFor(section.icon)}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-md bg-background/60">
                        {iconFor(section.icon)}
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest">
                        {section.heading}
                      </h3>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {section.bullets.map((b, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-foreground/90 leading-relaxed"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-70" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    {section.links && section.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                        {section.links.map((l) => (
                          <a
                            key={l.url}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 border border-border/60 hover:border-primary/40 hover:bg-primary/[0.04] text-xs font-medium transition-colors"
                          >
                            {l.preview ? (
                              <Eye className="h-3 w-3 text-amber-400" />
                            ) : (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span>{l.label}</span>
                            {l.preview && (
                              <span className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold">
                                Preview
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted-foreground">
            New entries are appended at the top of each work session.
          </p>
        </footer>
      </div>
    </div>
  );
}
