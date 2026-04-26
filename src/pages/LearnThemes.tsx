import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check, ExternalLink, RotateCcw, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  DEFAULT_LEARN_THEME,
  LEARN_THEMES,
  LearnTheme,
  getStoredLearnTheme,
  setStoredLearnTheme,
} from "@/lib/learnThemes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * /learn/themes — admin-only gallery to compare Learn-section themes
 * side-by-side using identical mock content. Pick → "Apply" → persisted
 * to localStorage and broadcast for the real Learn pages to read.
 */
export default function LearnThemes() {
  const { isAdmin, isChecking } = useAdminCheck();
  const [preview, setPreview] = useState<LearnTheme>(DEFAULT_LEARN_THEME);
  const [applied, setApplied] = useState<LearnTheme>(DEFAULT_LEARN_THEME);

  useEffect(() => {
    const current = getStoredLearnTheme();
    setPreview(current);
    setApplied(current);
  }, []);

  const isDirty = preview !== applied;
  const previewMeta = LEARN_THEMES.find((t) => t.id === preview);
  const appliedMeta = LEARN_THEMES.find((t) => t.id === applied);

  const handleApply = () => {
    setStoredLearnTheme(preview);
    setApplied(preview);
    toast.success(`Applied: ${previewMeta?.name}`, {
      description: "Open /learn to see it live.",
      action: {
        label: "Open Learn",
        onClick: () => window.open("/learn", "_blank"),
      },
    });
  };

  const handleReset = () => {
    setStoredLearnTheme(DEFAULT_LEARN_THEME);
    setApplied(DEFAULT_LEARN_THEME);
    setPreview(DEFAULT_LEARN_THEME);
    toast("Reset to default theme.");
  };

  if (isChecking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Checking access…
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/learn" replace />;

  return (
    <>
      <Helmet>
        <title>Learn Theme Gallery — Admin Preview | ZenSolar</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Sticky theme switcher — compact, mobile-first */}
        <div className="sticky top-[3.5rem] z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 py-2.5">
            {/* Row 1: title + actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Shield className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-medium">Learn Themes</span>
                <Badge variant="outline" className="hidden text-[10px] uppercase tracking-wider sm:inline-flex">
                  Admin
                </Badge>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 px-2 text-muted-foreground"
                  title="Open the real /learn in a new tab"
                >
                  <Link to="/learn" target="_blank" rel="noopener">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">View Learn</span>
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="h-8 gap-1.5 px-2.5"
                  title="Reset to default"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!isDirty}
                  className="h-8 gap-1.5 px-2.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Apply
                </Button>
              </div>
            </div>

            {/* Row 2: theme chips + status — single horizontal scroll, no clip */}
            <div className="-mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {LEARN_THEMES.map((t) => {
                const active = preview === t.id;
                const isApplied = applied === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setPreview(t.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.3)]"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.name}
                    {isApplied && <Check className="ml-1.5 inline h-3 w-3" />}
                  </button>
                );
              })}
            </div>

            {/* Row 3: tagline + status — kept on one line, truncated */}
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              {isDirty ? (
                <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Preview
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  Active
                </span>
              )}
              <span className="truncate">
                {previewMeta?.tagline} — {previewMeta?.description}
              </span>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <ThemePreview theme={preview} />

        {/* Side-by-side comparison */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <h2 className="mb-1 text-base font-semibold sm:text-lg">Side-by-side</h2>
          <p className="mb-4 text-xs text-muted-foreground sm:mb-6 sm:text-sm">
            Same content, three skins. Tap any tile to make it the active preview above.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
            {LEARN_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setPreview(t.id)}
                className={cn(
                  "group overflow-hidden rounded-xl border bg-card text-left transition-all active:scale-[0.99]",
                  preview === t.id
                    ? "border-primary shadow-[0_0_28px_hsl(var(--primary)/0.22)]"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between border-b border-border/60 p-3 sm:p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.tagline}</div>
                  </div>
                  {applied === t.id && (
                    <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                      Active
                    </span>
                  )}
                </div>
                <div className="h-[280px] overflow-hidden sm:h-[360px]">
                  <ThemePreview theme={t.id} compact />
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Tip: <span className="font-medium text-foreground">Apply</span> saves your pick.
            Open <Link to="/learn" target="_blank" rel="noopener" className="text-primary underline-offset-2 hover:underline">/learn</Link> to see it on the real page.
          </p>
        </div>
      </div>
    </>
  );
}

/* ---------- Shared mock Learn content ---------- */

function ThemePreview({ theme, compact = false }: { theme: LearnTheme; compact?: boolean }) {
  const cards = useMemo(
    () => [
      {
        icon: Zap,
        title: "Engineering",
        body: "How Tap-to-Mint™ and Proof-of-Genesis combine cryptographic delta proofs with hardware attestation.",
        time: "8 min",
      },
      {
        icon: Sparkles,
        title: "Tokenomics",
        body: "1T hard cap, 75/20/3/2 mint split, LP-seeded tranches at $0.10 USDC. The whole math.",
        time: "6 min",
      },
      {
        icon: Shield,
        title: "Patent Tech",
        body: "USPTO claims behind Proof-of-Delta and Proof-of-Origin — the primitive that eclipses Proof-of-Work.",
        time: "12 min",
      },
    ],
    []
  );

  return (
    <div data-learn-theme={theme} className="learn-surface">
      <div
        className={cn(
          "mx-auto max-w-5xl px-4 sm:px-5",
          compact ? "py-5" : "py-8 sm:py-12"
        )}
      >
        {/* Hero */}
        <div className={compact ? "mb-4" : "mb-8 sm:mb-10"}>
          <div className="learn-mono mb-2 text-[10px] uppercase tracking-[0.2em] learn-muted">
            Learn · v1.0
          </div>
          <h1
            className={cn(
              "learn-display leading-[1.05]",
              compact ? "text-xl" : "text-3xl sm:text-5xl md:text-6xl"
            )}
          >
            Currency from{" "}
            <span className="learn-accent">energy</span>, explained.
          </h1>
          {!compact && (
            <p className="learn-muted mt-3 max-w-2xl text-sm sm:mt-4 sm:text-base md:text-lg">
              Everything you need to understand how ZenSolar turns verified clean
              energy into onchain value — without the jargon.
            </p>
          )}
        </div>

        {/* Card grid */}
        <div
          className={cn(
            "grid gap-3",
            compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"
          )}
        >
          {cards.slice(0, compact ? 2 : 3).map((c) => (
            <div key={c.title} className={cn("learn-card p-4", compact ? "" : "sm:p-5")}>
              <c.icon className="learn-accent mb-3 h-5 w-5" />
              <div className="learn-display mb-1 text-base">{c.title}</div>
              <p className="learn-muted text-xs leading-relaxed">{c.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="learn-mono text-[10px] learn-muted">
                  {c.time} read
                </span>
                <ArrowRight className="learn-accent h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Article excerpt */}
        {!compact && (
          <div className="learn-card mt-8 p-5 sm:mt-10 sm:p-8">
            <div className="learn-mono mb-2 text-[10px] uppercase tracking-[0.2em] learn-muted">
              §1.2 · Engineering
            </div>
            <h2 className="learn-display mb-3 text-xl sm:text-2xl md:text-3xl">
              Proof-of-Delta in three sentences
            </h2>
            <p className="learn-muted mb-4 text-sm leading-relaxed sm:text-base">
              Every meter reading is hashed with a salted nonce and the prior
              reading's hash, forming an append-only chain anchored to the device's
              attested public key. The protocol mints only on the verifiable{" "}
              <em>delta</em> between two adjacent readings — never the absolute
              value — which makes replay and inflation attacks computationally
              infeasible. The result is currency that cannot exist without genuine
              energy production.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="learn-mono inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-2.5 py-1 text-[10px] learn-accent">
                <Check className="h-3 w-3" />
                verified on-chain · 0x9f2…a41c
              </span>
              <span className="learn-mono text-[10px] learn-muted">
                Base L2 · block 24,118,402
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
