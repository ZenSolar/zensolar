import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check, RotateCcw, Shield, Sparkles, Zap } from "lucide-react";
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

  const handleApply = () => {
    setStoredLearnTheme(preview);
    setApplied(preview);
  };

  const handleReset = () => {
    setStoredLearnTheme(DEFAULT_LEARN_THEME);
    setApplied(DEFAULT_LEARN_THEME);
    setPreview(DEFAULT_LEARN_THEME);
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
        {/* Sticky theme switcher */}
        <div className="sticky top-[3.5rem] z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 pt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Shield className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-medium">Learn Theme Gallery</span>
                <Badge variant="outline" className="hidden text-[10px] uppercase tracking-wider sm:inline-flex">
                  Admin
                </Badge>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
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

            {/* Theme chips — horizontal scroll on mobile so they never clip */}
            <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max items-center gap-2">
                {LEARN_THEMES.map((t) => {
                  const active = preview === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setPreview(t.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.name}
                      {applied === t.id && <Check className="ml-1.5 inline h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-3 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Check className="h-3 w-3" />
                Current: {LEARN_THEMES.find((t) => t.id === applied)?.name}
              </span>
              {isDirty && (
                <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Previewing: {LEARN_THEMES.find((t) => t.id === preview)?.name}
                </span>
              )}
              <span className="basis-full text-xs">
                {LEARN_THEMES.find((t) => t.id === preview)?.description}
              </span>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <ThemePreview theme={preview} />

        {/* All three side-by-side on large screens */}
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="mb-1 text-lg font-semibold">Side-by-side comparison</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Same content, three skins. Tap any tile to make it the active preview above.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {LEARN_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setPreview(t.id)}
                className={cn(
                  "group overflow-hidden rounded-xl border bg-card text-left transition-all active:scale-[0.99]",
                  preview === t.id
                    ? "border-primary shadow-[0_0_32px_hsl(var(--primary)/0.25)]"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="border-b border-border/60 p-4">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.tagline}</div>
                </div>
                <div className="h-[360px] overflow-hidden">
                  <ThemePreview theme={t.id} compact />
                </div>
              </button>
            ))}
          </div>
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
          "mx-auto max-w-5xl px-5",
          compact ? "py-6" : "py-12 sm:py-16"
        )}
      >
        {/* Hero */}
        <div className={compact ? "mb-5" : "mb-10"}>
          <div className="learn-mono mb-2 text-[10px] uppercase tracking-[0.2em] learn-muted">
            Learn · v1.0
          </div>
          <h1
            className={cn(
              "learn-display leading-[1.05]",
              compact ? "text-2xl" : "text-4xl sm:text-6xl"
            )}
          >
            Currency from{" "}
            <span className="learn-accent">energy</span>, explained.
          </h1>
          {!compact && (
            <p className="learn-muted mt-4 max-w-2xl text-base sm:text-lg">
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
            <div key={c.title} className={cn("learn-card p-4", compact ? "" : "p-5")}>
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
          <div className="learn-card mt-10 p-6 sm:p-8">
            <div className="learn-mono mb-2 text-[10px] uppercase tracking-[0.2em] learn-muted">
              §1.2 · Engineering
            </div>
            <h2 className="learn-display mb-3 text-2xl sm:text-3xl">
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
