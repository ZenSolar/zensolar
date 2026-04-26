import { useEffect, useMemo, useState } from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Sparkles,
  Lock,
  RefreshCw,
  ScrollText,
  LogOut,
  BookOpen,
  ArrowRight,
  Home,
  Compass,
  Sparkles as SparklesIcon,
  Battery,
  ShieldCheck,
  Gauge,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useVaultSnapshot } from "@/hooks/useVaultSnapshot";
import { VaultPinGate } from "@/components/founders/VaultPinGate";
import { JumpToChapter } from "@/components/founders/JumpToChapter";
import { openFounderChooser } from "@/lib/founderChooser";
import { FounderCard } from "@/components/founders/FounderCard";
import { PriceScenarioToggle } from "@/components/founders/PriceScenarioToggle";
import { PriceAdminPanel } from "@/components/founders/PriceAdminPanel";
import { LpRoundTracker } from "@/components/founders/LpRoundTracker";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import zenLogo from "@/assets/zen-logo-horizontal-transparent.png";


export default function FoundersVault() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsFounder(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set((roles ?? []).map((r) => r.role));
      setIsFounder(set.has("founder") || set.has("admin"));
      setIsAdmin(set.has("admin"));
    })();
    return () => {
      cancelled = true;
    };
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
      <VaultDashboard isAdmin={isAdmin} />
    </VaultPinGate>
  );
}

function VaultDashboard({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth();
  const { snapshot, loading, error, refresh } = useVaultSnapshot(true);
  const lock = () => {
    if (user?.id) sessionStorage.removeItem(`zen.vault-pin-unlocked:${user.id}`);
    window.location.reload();
  };
  const [scenarioPrice, setScenarioPrice] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const goHome = () => {
    navigate("/", { replace: true });
    window.setTimeout(() => {
      if (window.location.pathname !== "/") {
        window.location.assign("/");
      }
    }, 120);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      navigate(-1);
      window.setTimeout(() => {
        const stillHere =
          window.location.pathname + window.location.search + window.location.hash === currentPath;
        if (stillHere) {
          goHome();
        }
      }, 160);
      return;
    }

    goHome();
  };

  // Recompute net worth client-side when scenario toggle is active
  const view = useMemo(() => {
    if (!snapshot) return null;
    const price = scenarioPrice ?? snapshot.state.current_price_usd;
    const remap = (f: typeof snapshot.founders.joseph) => ({
      ...f,
      net_worth: f.allocation * price,
      progress_to_trillion: Math.min(1, price / f.trillionaire_price),
    });
    return {
      price,
      isScenario: scenarioPrice !== null,
      joseph: remap(snapshot.founders.joseph),
      michael: remap(snapshot.founders.michael),
    };
  }, [snapshot, scenarioPrice]);

  if (loading && !snapshot) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !snapshot || !view) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background p-6 pt-safe relative">
        <div className="absolute top-4 left-4 right-4 pt-safe flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground">
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={goHome} className="text-muted-foreground">
            Home
          </Button>
        </div>
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-destructive text-sm">{error ?? "Vault unavailable"}</p>
          <p className="text-xs text-muted-foreground">
            {location.pathname === "/founders"
              ? "Your account is signed in, but this vault session is being denied right now."
              : "This page is unavailable right now."}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
            <Button onClick={lock} variant="outline" size="sm">
              <Lock className="h-3 w-3 mr-1" /> Re-lock
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const viewerEmail = snapshot.viewer.email?.toLowerCase();
  const viewerIsJoseph = viewerEmail === "jo@zen.solar";
  const totalNetWorth = view.joseph.net_worth + view.michael.net_worth;

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/88 pt-safe backdrop-blur-md">
        <div className="px-safe">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button asChild size="icon" variant="ghost" className="h-8 w-8 shrink-0 md:hidden">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <img src={zenLogo} alt="ZenSolar" className="h-6 w-auto shrink-0" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground border-l border-border/40 pl-2 truncate">
                  Founders Vault
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={openFounderChooser}
                title="Navigate (⌘K)"
                className="h-8 w-8"
              >
                <Compass className="h-4 w-4" />
              </Button>
              <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Home">
                <Link to="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={lock}
                title="Lock vault"
                className="h-8 w-8"
              >
                <Lock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 md:py-5 space-y-4 md:space-y-5">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className="text-[11px] uppercase tracking-widest text-primary">
            Welcome back, {snapshot.viewer.display_name.split(" ")[0]}
          </p>
          <h1 className="text-xl font-semibold">
            Combined book value:{" "}
            <span className="tabular-nums">
              {fmtBig(totalNetWorth)}
            </span>
          </h1>
        </motion.div>

        {/* Founder Pack CTA */}
        <Link
          to="/founder-pack"
          className="block rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-transparent p-4 hover:border-amber-400/70 transition-colors group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-amber-400/15 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-amber-400">
                  Eyes-Only · v5.6 Northstar
                </p>
                <p className="text-sm font-semibold">The Founder Pack</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  Allocations, halving, patent moat, ARR ladder, flywheel, 20-yr trajectory
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Link>

        {/* Jump to Chapter — skip the chooser, drop straight into a chapter */}
        <JumpToChapter />

        {/* Proof of Genesis™ CTA */}
        <Link
          to="/founders/proof-of-genesis"
          className="block rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 hover:border-primary/70 transition-colors group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-primary">
                  NDA-Shareable · Investor Brief
                </p>
                <p className="text-sm font-semibold">Proof of Genesis™</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  Δ + Origin → the primitive that eclipses Bitcoin. One-screen narrative + diagrams.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Link>

        {/* VPP Roadmap — Phase 2 revenue stream */}
        <Link
          to="/founders/vpp-roadmap"
          className="block rounded-2xl border border-eco/40 bg-gradient-to-br from-eco/10 via-eco/5 to-transparent p-4 hover:border-eco/70 transition-colors group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-eco/15 flex items-center justify-center">
                <Battery className="h-5 w-5 text-eco" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-eco">
                  Phase 2 · Post-Seed Revenue
                </p>
                <p className="text-sm font-semibold">VPP Program Roadmap</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  Phase 1 mints today. Phase 2 layers VPP. 50% → LP on every dollar.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-eco group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Link>

        {/* Energy Price Oracle — Patent Track 2.5 (parked roadmap) */}
        <Link
          to="/founders/energy-oracle"
          className="block rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 hover:border-primary/70 transition-colors group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-primary">
                  Patent Track 2.5 · Parked
                </p>
                <p className="text-sm font-semibold">Energy Price Oracle</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  Per-user verified $/kWh on-chain. Series A moat. NOT in seed pitch.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Link>

        {/* Patent Expansion — bi-directional EV + FSD claim additions */}
        <Link
          to="/founders/patent-expansion"
          className="block rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 hover:border-primary/70 transition-colors group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-primary">
                  Patent · Phase 3 Claims
                </p>
                <p className="text-sm font-semibold">Bi-Directional EV + FSD</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  V2G / V2H / V2L + FSD autonomous miles. File now, ship later.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Link>

        {/* Live Price */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {view.isScenario ? "Scenario price" : "Live $ZSOLAR price"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Updated {timeAgo(snapshot.state.updated_at)}
            </span>
          </div>
          <motion.div
            key={view.price}
            initial={{ scale: 0.96, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold tracking-tight tabular-nums"
          >
            ${view.price.toFixed(2)}
          </motion.div>
          {!view.isScenario && (
            <PriceAdminPanel
              currentPrice={snapshot.state.current_price_usd}
              isAdmin={isAdmin && viewerIsJoseph}
              onUpdated={refresh}
            />
          )}
          <PriceScenarioToggle
            current={snapshot.state.current_price_usd}
            targets={snapshot.moonshot_targets}
            selected={scenarioPrice}
            onSelect={setScenarioPrice}
          />
        </section>

        {/* Founder cards */}
        <section className="grid grid-cols-2 gap-3">
          <FounderCard founder={view.joseph} isViewer={viewerIsJoseph} />
          <FounderCard founder={view.michael} isViewer={!viewerIsJoseph} />
        </section>

        {/* LP Round Tracker */}
        <LpRoundTracker
          currentPrice={view.price}
          josephAllocation={view.joseph.allocation}
          michaelAllocation={view.michael.allocation}
        />

        {/* Family Legacy Pact banner */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/5 to-transparent p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400">
              The Family Legacy Pact
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tokens held: <strong className="text-foreground">200B</strong> ·
            Tokens sold: <strong className="text-foreground">0</strong> ·
            Pact day:{" "}
            <strong className="text-foreground">
              {snapshot.state.pact_days_active.toLocaleString()}
            </strong>{" "}
            of ∞
          </p>
          <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-border/30">
            "Liquidity from salary. Wealth from holding. Legacy from never selling."
          </p>
        </motion.section>

        {/* Chapter 2 counter */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <ScrollText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Chapter 2</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Day{" "}
            <strong className="text-foreground tabular-nums">
              {snapshot.state.chapter_two_days.toLocaleString()}
            </strong>{" "}
            since SolarCity → Tesla. ZenSolar is building Chapter 2 of the
            clean-energy revolution.
          </p>
        </section>

        {/* Moonshot ladder */}
        <section className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Moonshot Ladder</h2>
          </div>
          <ul className="space-y-1.5">
            {snapshot.moonshot_targets.map((t) => {
              const j = view.joseph.allocation * t.price;
              const m = view.michael.allocation * t.price;
              const isCurrent = Math.abs(t.price - view.price) < 0.01;
              return (
                <li
                  key={t.price}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${
                    isCurrent
                      ? "bg-primary/10 border border-primary/30"
                      : ""
                  }`}
                >
                  <span className="text-muted-foreground tabular-nums w-12">
                    ${t.price.toFixed(t.price < 10 ? 2 : 0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-1 px-2">
                    {t.label}
                  </span>
                  <span className="tabular-nums text-right text-[11px]">
                    {fmtBig(j)} · {fmtBig(m)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="pt-2 text-center">
          <button
            onClick={lock}
            className="text-[10px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1 hover:text-primary"
          >
            <LogOut className="h-3 w-3" />
            Lock vault
          </button>
        </div>
      </main>
    </div>
  );
}

function fmtBig(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function timeAgo(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
