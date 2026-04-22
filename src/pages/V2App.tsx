import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultBiometricGate } from "@/components/founders/VaultBiometricGate";
import { V2VariantA } from "@/components/v2app/V2VariantA";
import { V2VariantB } from "@/components/v2app/V2VariantB";
import { V2DashboardA } from "@/components/v2app/V2DashboardA";
import { V2DashboardB } from "@/components/v2app/V2DashboardB";

export default function V2App() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setIsFounder(false); return; }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id);
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
    <VaultBiometricGate userId={user.id} allowPreviewBypass>
      <V2AppHub />
    </VaultBiometricGate>
  );
}

type Variant = "hub" | "a" | "b" | "a-dash" | "b-dash";

function V2AppHub() {
  const [view, setView] = useState<Variant>("hub");

  if (view === "a") return <PreviewFrame onBack={() => setView("hub")} label="Variant A · Onboarding"><V2VariantA onComplete={() => setView("a-dash")} /></PreviewFrame>;
  if (view === "b") return <PreviewFrame onBack={() => setView("hub")} label="Variant B · Onboarding"><V2VariantB onComplete={() => setView("b-dash")} /></PreviewFrame>;
  if (view === "a-dash") return <PreviewFrame onBack={() => setView("a")} label="Variant A · Dashboard"><V2DashboardA onExit={() => setView("a")} /></PreviewFrame>;
  if (view === "b-dash") return <PreviewFrame onBack={() => setView("b")} label="Variant B · Dashboard"><V2DashboardB onExit={() => setView("b")} /></PreviewFrame>;

  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Founders Vault
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            Founders Only · v2 Sandbox
          </span>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            App Overhaul · v2 Beta
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-5 leading-[1.05]">
            Pick a direction.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Two takes on the first screen a new user sees. Same words, different feeling. Tap one to preview it full-screen.
          </p>
        </motion.div>

        {/* Variant cards */}
        <div className="space-y-4">
          <VariantCard
            label="Variant A"
            title="Same brand, quieter."
            body="Keeps the emerald glow and dark theme you already love. Less ornament, more breathing room, sharper typography."
            onOpen={() => setView("a")}
            tone="emerald"
          />
          <VariantCard
            label="Variant B"
            title="Tesla-grade restraint."
            body="Near-monochrome. One accent. Hairline dividers. Monospace numerals. Dramatic whitespace. A bigger leap toward Apple/Tesla."
            onOpen={() => setView("b")}
            tone="mono"
          />
        </div>

        <div className="mt-16 mb-8 text-center">
          <p className="text-xs text-muted-foreground italic max-w-md mx-auto leading-relaxed">
            Once you pick, I'll build the rest of the first-run experience and dashboard in that direction.
          </p>
        </div>
      </div>
    </div>
  );
}

function VariantCard({
  label,
  title,
  body,
  onOpen,
  tone,
}: {
  label: string;
  title: string;
  body: string;
  onOpen: () => void;
  tone: "emerald" | "mono";
}) {
  const accent = tone === "emerald" ? "text-primary/80" : "text-foreground/70";
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.4 }}
      onClick={onOpen}
      className="group w-full text-left rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 sm:p-7 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] uppercase tracking-[0.2em] font-medium ${accent}`}>
          {label}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
    </motion.button>
  );
}

function PreviewFrame({
  onBack,
  label,
  children,
}: {
  onBack: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100svh] bg-background">
      {/* Floating sandbox chrome */}
      <div className="fixed left-3 right-3 z-50 flex items-center justify-between rounded-full border border-border/50 bg-background/80 backdrop-blur-md px-4 py-2 shadow-lg" style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold truncate ml-3">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
