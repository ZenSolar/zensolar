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
    date: "April 24, 2026 (LATEST)",
    iso: "2026-04-25T02:00",
    title: "Wallbox Verified Live · Proof-of-Genesis Receipt — EV Math + PoW Comparison",
    summary:
      "Confirmed Wallbox as the third OEM with verified live data flow (via Tschida) — joins Tesla and Enphase. SolarEdge remains the only OEM without a live user. Fixed the Proof-of-Genesis receipt: EV mints now use the correct 1-token-per-mile formula, the hero stat shows Miles Driven, and CO₂ is reframed context-aware (gasoline avoided for EV, grid CO₂ displaced for solar/battery) with a new 'vs. Bitcoin Proof-of-Work' chip showing emissions our regenerative mint avoids per transaction.",
    sections: [
      {
        heading: "Shipped",
        icon: "shipped",
        bullets: [
          "Wallbox confirmed as a verified live OEM via Tschida — real charging data flowing through the API.",
          "Provider status now: ✅ Tesla · ✅ Enphase · ✅ Wallbox · ⏳ SolarEdge (no live user yet).",
          "Proof-of-Genesis receipt EV mint fixed: 52 mi → 39.00 $ZSOLAR (1 token/mile × 0.75 user share), with 17.33 kWh equivalent shown.",
          "Hero stats are now context-aware: EV mints show 'Miles Driven', solar/battery mints show 'Verified Energy'.",
          "CO₂ panel reframed source-by-source: EV → gasoline gallons + kg CO₂ avoided vs ICE; solar/battery → grid CO₂ displaced.",
          "New 'vs. Bitcoin Proof-of-Work' comparison chip on every receipt — anchors Proof-of-Genesis™ as the regenerative inverse of PoW (~707 kg CO₂/BTC tx avoided).",
          "Wallbox sample receipt added (Apr 22 · 28 mi via Wallbox Pulsar Plus).",
        ],
        links: [
          {
            label: "Proof-of-Genesis Receipt (updated)",
            url: "https://beta.zen.solar/proof-of-genesis-receipt-preview",
            preview: true,
          },
        ],
      },
      {
        heading: "Saved to memory",
        icon: "memory",
        bullets: [
          "Verified-live OEM list: Tesla, Enphase, Wallbox. SolarEdge pending first user.",
          "Receipt CO₂ framing rule: context-aware per primary source + always include PoW comparison chip.",
          "EV mint math: 1 $ZSOLAR per mile × 0.75 user share; show kWh-equivalent at 3.0 mi/kWh.",
        ],
      },
    ],
  },
  {
    date: "April 24, 2026 (LATEST)",
    iso: "2026-04-25T00:30",
    title: "VPP Roadmap — UX Flow + Token Timing Locked",
    summary:
      "Expanded the VPP Roadmap with the full app user-experience walkthrough (enrollment → standing by → live dispatch → event settlement → monthly payday) and locked the dual-cadence settlement rule. Added VPP dispatch metering as a new patent claim and saved the rule to project memory.",
    sections: [
      {
        heading: "Shipped",
        icon: "shipped",
        bullets: [
          "VPP Roadmap now includes 5-step User Experience Flow (Enrollment, Standing By, Live Dispatch, Event Settlement, Monthly Payday).",
          "New 'When Tokens Hit The Wallet' section locks the rule: $ZSOLAR auto-mints in 30–60s per dispatch, cash pays monthly on the 1st.",
          "New 'What's Required To Launch' section: aggregator registration, OEM partner-tier APIs, dispatch infra (white-label Leap recommended), $550K–$2.9M capital.",
          "VPP Dispatch Metering claim added to /founders/patent-expansion — owns the OpenADR signal → verified discharge → real-time on-chain settlement link.",
        ],
        links: [
          {
            label: "VPP Roadmap (updated)",
            url: "https://beta.zen.solar/founders/vpp-roadmap",
            preview: true,
          },
          {
            label: "Patent Expansion (+ VPP claim)",
            url: "https://beta.zen.solar/founders/patent-expansion",
            preview: true,
          },
        ],
      },
      {
        heading: "Strategic Decisions Locked",
        icon: "strategy",
        bullets: [
          "Per-dollar VPP split: 50% LP · 30% user cash · 15% operating · 5% user tokens. 50% → LP rule preserved.",
          "Tokens mint REAL-TIME per dispatch (not batched daily) — maximizes dopamine, reuses Tap-to-Mint™ engine.",
          "Cash settles MONTHLY on the 1st — matches utility cycle, lowers ACH fees, creates 'payday' feel.",
          "Launch shortcut: white-label as 'Powered by Leap' in CA first. Move infrastructure in-house once leverage exists.",
          "VPP dispatch metering is patentable as a distinct claim — separate from passive energy production.",
        ],
      },
      {
        heading: "Memory Updated",
        icon: "memory",
        bullets: [
          "New file: mem://features/vpp-settlement — VPP token-timing + per-dollar split + launch mechanics. Indexed in mem://index.md.",
        ],
      },
    ],
  },
  {
    date: "April 24, 2026 (LATE)",
    iso: "2026-04-24T23:30",
    title: "Bi-Directional EV Patent Expansion",
    summary:
      "Logged the bi-directional EV charging (V2G/V2H/V2L) + FSD miles patent claim additions. Anchored with a real DB table to reduce the claim to practice. App feature deliberately deferred to Phase 3.",
    sections: [
      {
        heading: "Shipped",
        icon: "shipped",
        bullets: [
          "New /founders/patent-expansion page — full claim hierarchy (3 dependent claims + the killer separation-method claim + FSD adjacent claim) for patent counsel.",
          "Vault tile (primary green) added with ShieldCheck icon for one-tap access.",
          "New DB table `bidirectional_mint_events` — schema-only, RLS-locked. Records import vs export as separate mint events within a single session. patent_claim_ref defaults to ZSOLAR-BIDIR-V1.",
        ],
        links: [
          {
            label: "Patent Expansion (V2G/V2H/V2L + FSD)",
            url: "https://beta.zen.solar/founders/patent-expansion",
            preview: true,
          },
        ],
      },
      {
        heading: "Strategic Decisions Locked",
        icon: "strategy",
        bullets: [
          "File now, ship later — priority date is the asset, not feature parity.",
          "Killer claim = the separation method (two mint events per bi-directional session). Owns the IP for distinguishing import vs export kWh.",
          "Total mintable surface goes from 5 (Phase 1) → 9 (with Phase 3): adds V2G, V2H, V2L, FSD miles.",
          "Bi-directional minting will be Elite-tier with 1.5x multiplier when it ships (V2G has higher grid value).",
          "Do NOT publish claim language publicly until counsel confirms filing.",
        ],
      },
      {
        heading: "Memory Updates",
        icon: "memory",
        bullets: [
          "Saved mem://features/bidirectional-ev-minting — full Phase 3 roadmap, patent strategy, implementation anchor, tier pairing rules.",
        ],
      },
    ],
  },
  {
    date: "April 24, 2026 (EVE)",
    iso: "2026-04-24T22:00",
    title: "VPP Program Logged as Phase 2",
    summary:
      "VPP formally moved out of launch scope into a Phase 2 roadmap page. Phase 1 stays clean: mint + auto-mint only.",
    sections: [
      {
        heading: "Shipped",
        icon: "shipped",
        bullets: [
          "New /founders/vpp-roadmap page — Phase 1 vs Phase 2 split, Base Power anchor ($700 install + $19.99/$49.99), 50% → LP rule on every revenue line, 5 talking points for Lyndon, T+0 → T+12mo sequencing.",
          "Vault tile (eco-green) added to Founders Vault for one-tap access during investor calls.",
          "Honest-status callout up top: seed not closed, mainnet not launched, VPP deliberately held back so Phase 1 ships clean.",
        ],
        links: [
          {
            label: "VPP Roadmap (Phase 2)",
            url: "https://beta.zen.solar/founders/vpp-roadmap",
            preview: true,
          },
          {
            label: "Founders Vault",
            url: "https://beta.zen.solar/founders",
            preview: true,
          },
        ],
      },
      {
        heading: "Strategic Decisions Locked",
        icon: "strategy",
        bullets: [
          "Phase 1 launch scope = Mint Basic ($9.99 manual) + Mint Pro ($19.99 manual + Daily Auto-Mint DCA). No VPP.",
          "Phase 2 (post-seed) adds VPP Only ($19.99), Complete ($29.99 mint+VPP, no auto-mint), and Elite ($49.99 full stack with auto-mint).",
          "Auto-mint (DCA) is the defining premium feature of Elite — removed from Complete to make the $20 price ladder defensible.",
          "VPP and minting are independent product lines so battery-only owners and crypto-only minters self-select instead of being force-bundled.",
          "50% of every subscription dollar AND 50% of VPP utility revenue share inject directly into the $ZSOLAR LP — universal rule, no exceptions.",
          "Base Power ($19.99 / $49.99 in TX) is the public price anchor — ZenSolar matches dollar-for-dollar but customer keeps their battery + REP.",
          "Investor narrative: Phase 1 wins on its own; Phase 2 is a capital-gated revenue lever, not a tech-risk lever.",
        ],
      },
    ],
  },
  {
    date: "April 24, 2026 (PM)",
    iso: "2026-04-24T18:00",
    title: "Proof-of-Permanence™ + Patent Strategy Locked",
    summary:
      "Continuity primitive renamed. Three-track patent strategy. Phase 1 TM stack surfaces shipped.",
    sections: [
      {
        heading: "Shipped",
        icon: "shipped",
        bullets: [
          "VerifyOnChainDrawer — slide-up drawer on every PoG Receipt surfacing Proof-of-Delta™, Proof-of-Origin™, Mint-on-Proof™, Proof-of-Permanence™, SEGI™ source, and Tap-to-Mint™ provenance.",
          "PoA chip on receipt face — 7-char Proof-of-Authenticity™ hash linking to public verify page.",
          "Public /verify/:poa route — no auth required, shareable, surfaces all primitives behind a mint.",
          "Per-device Proof-of-Origin™ page at /devices/:deviceId/origin — keccak256 device hash, cumulative watermark, Genesis Anchor™ commemorative, latest Permanence root. Founder + PIN gated (Phase 1).",
        ],
        links: [
          {
            label: "PoG Receipt (with new drawer)",
            url: "https://beta.zen.solar/proof-of-genesis-receipt-preview",
            preview: true,
          },
          {
            label: "Public verify page (sample)",
            url: "https://beta.zen.solar/verify/a3f5b2e9c8d471a6b9e0d3f5a8c2b1e4d7f0a3c6b9e2d5f8a1c4b7e0d3f6a9c2",
          },
          {
            label: "Device PoO page (sample)",
            url: "https://beta.zen.solar/devices/enphase-envoy-7821/origin",
          },
        ],
      },
      {
        heading: "Strategic Decisions Locked",
        icon: "strategy",
        bullets: [
          "Continuity primitive renamed: Proof-of-Permanence™ — tagline 'The Eternal Ledger'. Never use 'Proof-of-Continuity'.",
          "Three-track patent strategy locked. Track 1 = Preliminary Amendment to App. 19/634,402 by July 2, 2026 (Robotaxi/Cybercab, FSD dual-mode formal drawings, Permanence™ naming, Tap-to-Mint™ embodiment). Track 2 = NEW Provisional for Optimist humanoid robots + Starlink/SpaceX orbital telemetry (no existing disclosure hook). Track 3 = CIP candidates (ZPPA gating) for attorney call.",
          "Confirmed filing facts: Provisional 63/782,397 (Apr 2 2025), Non-Provisional App. 19/634,402 (Confirmation #4783, Docket ZEN-001).",
          "Tier 1 trademark filings queued: Proof-of-Permanence™, Genesis Anchor™, Proof-of-Custody™.",
          "New rule: every Layer 2–5 trademark MUST ship with a first-class consumer surface. No primitive lives only in marketing copy.",
        ],
      },
      {
        heading: "Saved to Project Memory",
        icon: "memory",
        bullets: [
          "mem://legal/patent-update-checklist — Three-track strategy grounded in actual .docx claims (¶[0042], ¶[0048], Claims 5/9/10).",
          "mem://features/tm-stack-visualization — Layer 0–5 architecture vs Bitcoin parallel. Permanence™ in infrastructure column.",
          "mem://features/tm-stack-gaps — 9-item roadmap with Phase 1 / 1.5 / 2 / 3 horizons.",
          "mem://features/trademark-roadmap — Tier 1/2/3 USPTO filing priorities.",
          "mem://technical/data-integrity-hardening — 5-step roadmap (device sig → DB triggers → atomic delta → Merkle scheduler → public verify endpoint).",
          "Core memory updated: Permanence™ rename, TM-surface rule, patent filing facts.",
        ],
      },
    ],
  },
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
