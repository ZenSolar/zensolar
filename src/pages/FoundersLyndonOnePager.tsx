import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Sun,
  Wallet as WalletIcon,
  Leaf,
  ShieldCheck,
  Eye,
  ExternalLink,
  Quote,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";

/**
 * Founders One-Pager — for Lyndon Rive.
 *
 * Frames today's shipped work (Proof of Genesis, CO₂ visibility, Wallet
 * "View Proof") as residential-solar distribution leverage. Same product as
 * the Elon framing, different door: this one speaks installer/homeowner,
 * not physics-and-fleet.
 *
 * Gated identically to every other founders page (FounderRoute + PIN).
 */

export default function FoundersLyndonOnePager() {
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
      <OnePagerContent />
    </VaultPinGate>
  );
}

interface ProofLink {
  label: string;
  url: string;
  preview?: boolean;
  desc: string;
}

const PROOF_LINKS: ProofLink[] = [
  {
    label: "Proof of Genesis Receipt",
    url: "https://beta.zen.solar/proof-of-genesis-receipt-preview",
    preview: true,
    desc: "The homeowner-facing artifact: solar/EV/battery readings → minted tokens → CO₂ tons offset.",
  },
  {
    label: "Wallet · ZPPA + View Proof",
    url: "https://beta.zen.solar/wallet",
    desc: "Producer Priority badge and the 3-most-recent-mints proof shortcut live here.",
  },
  {
    label: "Mint History · On-Chain Forensics",
    url: "https://beta.zen.solar/mint-history",
    desc: "Every mint expands to tx hash, $ZSOLAR + NFT contracts, per-NFT token-IDs.",
  },
];

function OnePagerContent() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 pb-16"
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
          <div className="inline-flex items-center gap-2 text-eco text-xs uppercase tracking-widest mb-3">
            <Sun className="h-3.5 w-3.5" /> One-Pager · For Lyndon Rive
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            The Homeowner Finally Owns Something
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Residential solar's #1 churn problem is that customers feel nothing after install — just a
            25-year loan. We just shipped the artifact that fixes it, and the wallet surface that
            makes it feel like ownership.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Internal · Drafted for Lyndon Rive · Not for distribution
          </p>
        </header>

        {/* The hook */}
        <section className="mb-10 rounded-xl border border-eco/30 bg-eco/[0.06] p-5">
          <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-eco flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
                "SolarCity solved <em>installation</em>. ZenSolar solves <em>what happens after
                install</em> — the 25-year emotional flatline between flipping the breaker and the
                loan being paid off."
              </p>
              <p className="text-xs text-muted-foreground mt-3 uppercase tracking-widest">
                The opening line
              </p>
            </div>
          </div>
        </section>

        {/* Three pillars */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Three things we shipped this week
          </h2>

          <div className="space-y-4">
            <Pillar
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Proof of Genesis Receipt"
              tag="The artifact"
              body="A cryptographic receipt that ties the kWh a homeowner's panels actually produced to the tokens they earned and the CO₂ tons they offset. Same idea as a Tesla delivery email — but it arrives every time the system mints, not once. Homeowners forward it. That's the referral engine."
            />
            <Pillar
              icon={<Leaf className="h-4 w-4" />}
              title="CO₂ Tons Offset, Visible"
              tag="The dad-friendly number"
              body="Every receipt converts kWh → CO₂ tons in plain English. Suddenly the system isn't 'paying for itself in 9 years' — it's 'I've kept 4.2 tons of carbon out of the air this year.' That's a sentence homeowners say at dinner parties. Utilities and ESG buyers will care for different reasons."
            />
            <Pillar
              icon={<WalletIcon className="h-4 w-4" />}
              title="Wallet · View Proof"
              tag="The dopamine surface"
              body="On the Wallet page, the homeowner sees their last 3 mints with one-tap deep links to the on-chain transaction. It's the moment crypto stops feeling like crypto and starts feeling like a Fitbit ring. Mom-friendly. Tappable. Proves we're real."
            />
          </div>
        </section>

        {/* The distribution thesis */}
        <section className="mb-10 rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold mb-3">Why this matters for distribution</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            We're <span className="text-foreground font-medium">not</span> recruiting installers
            yet. The thesis is inverted: let homeowners share their Proof of Genesis receipts, let
            their friends ask <em>"how do I get one of those?"</em>, and let the installer — the
            person already in the kitchen at the closing table — get pulled toward us by demand,
            not by our outbound.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Word-of-mouth is faster, cheaper, and structurally harder for incumbents to copy than
            an installer-recruitment program. Installers come last, after the homeowner has already
            made it weird not to offer ZenSolar.
          </p>
        </section>

        {/* Tap the proof */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Tap the proof — it's already live
          </h2>
          <div className="space-y-3">
            {PROOF_LINKS.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border hover:border-primary/40 hover:bg-primary/[0.04] p-4 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    {l.preview ? (
                      <Eye className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-semibold">{l.label}</span>
                    {l.preview && (
                      <span className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold">
                        Preview
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">{l.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* The ask */}
        <section className="rounded-xl border border-primary/30 bg-primary/[0.05] p-5">
          <h2 className="text-base font-semibold mb-2 text-primary">The conversation we want</h2>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Not a check (yet). A 30-minute call where we walk you through the receipt as a
            homeowner would see it, and you tell us where this lands inside SolarCity-era
            distribution instincts. Tap any link above first — the product is real and shipped,
            not a deck.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted-foreground">
            Companion to the Elon framing. Same product, different door.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Pillar({
  icon,
  title,
  tag,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  tag: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-eco/10 text-eco">{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
          {tag}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
