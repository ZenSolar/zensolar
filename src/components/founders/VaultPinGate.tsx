import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Loader2,
  ArrowLeft,
  Home,
  KeyRound,
  Delete,
  Check,
  BookOpen,
  Vault,
  Atom,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getLastFounderRoute,
  isFounderRoute,
  rememberFounderRoute,
} from "@/lib/founderLastVisit";

interface Props {
  userId: string;
  children: React.ReactNode;
  /** Kept for API compatibility with the previous biometric gate. No longer used. */
  allowPreviewBypass?: boolean;
}

type Status =
  | { kind: "checking" }
  | { kind: "denied"; message: string }
  | { kind: "needs_setup" }
  | { kind: "needs_unlock"; attemptsRemaining?: number }
  | { kind: "locked"; minutesRemaining: number }
  | { kind: "unlocked" };

const SESSION_KEY_PREFIX = "zen.vault-pin-unlocked:";
const CHOOSER_SEEN_PREFIX = "zen.vault-chooser-seen:";

type Destination = {
  to: string;
  label: string;
  blurb: string;
  Icon: typeof BookOpen;
};

const FOUNDER_DESTINATIONS: Destination[] = [
  {
    to: "/founders",
    label: "Founders Hub",
    blurb: "Vault overview, founder cards, LP rounds.",
    Icon: Vault,
  },
  {
    to: "/founder-pack",
    label: "The Founder Pack",
    blurb: "All twelve chapters — Evolution → The Pact.",
    Icon: BookOpen,
  },
  {
    to: "/founders/proof-of-genesis",
    label: "Proof of Genesis™",
    blurb: "The cryptographic primitive thesis.",
    Icon: Atom,
  },
  {
    to: "/founders/app-overhaul-plan",
    label: "App Overhaul Plan",
    blurb: "Roadmap for the next surface.",
    Icon: Rocket,
  },
];

export function VaultPinGate({ userId, children }: Props) {
  const { user } = useAuth();
  const sessionKey = `${SESSION_KEY_PREFIX}${userId}`;
  const chooserSeenKey = `${CHOOSER_SEEN_PREFIX}${userId}`;
  const [status, setStatus] = useState<Status>(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(sessionKey) === "1") {
      return { kind: "unlocked" };
    }
    return { kind: "checking" };
  });
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupStage, setSetupStage] = useState<"create" | "confirm">("create");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [showChooser, setShowChooser] = useState(false);
  const { lightTap, success: hapticSuccess, error: hapticError, mediumTap } = useHaptics();
  const navigate = useNavigate();
  const location = useLocation();

  const email = (user?.email ?? "").toLowerCase();
  const isDenied = email === "jo@zen.solar" || email === "todd@zen.solar";

  useEffect(() => {
    if (status.kind === "unlocked") return;
    let cancelled = false;
    (async () => {
      if (isDenied) {
        if (!cancelled)
          setStatus({
            kind: "denied",
            message: "This account does not have PIN access to the Founders area.",
          });
        return;
      }
      const { data } = await supabase
        .from("founder_pins")
        .select("locked_until")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setStatus({ kind: "needs_setup" });
        return;
      }
      if (data.locked_until && new Date(data.locked_until) > new Date()) {
        const mins = Math.ceil(
          (new Date(data.locked_until).getTime() - Date.now()) / 60000,
        );
        setStatus({ kind: "locked", minutesRemaining: mins });
        return;
      }
      setStatus({ kind: "needs_unlock" });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isDenied, status.kind]);

  const goHome = () => {
    navigate("/", { replace: true });
    window.setTimeout(() => {
      if (window.location.pathname !== "/") window.location.assign("/");
    }, 120);
  };

  const goBack = () => {
    const fallback = location.pathname === "/founder-pack" ? "/founders" : "/";
    if (window.history.length > 1) {
      navigate(-1);
      window.setTimeout(() => {
        if (window.location.pathname === location.pathname) navigate(fallback, { replace: true });
      }, 160);
      return;
    }
    navigate(fallback, { replace: true });
  };

  const markUnlocked = async () => {
    sessionStorage.setItem(sessionKey, "1");
    void hapticSuccess();
    setJustUnlocked(true);
    // Brief celebratory pause so the user sees the success burst
    await new Promise((r) => setTimeout(r, 700));
    // Show chapter chooser the first time per session — saves a tap when they
    // wanted to land somewhere other than the page they originally clicked.
    const alreadySeen =
      typeof window !== "undefined" &&
      sessionStorage.getItem(chooserSeenKey) === "1";
    if (!alreadySeen) {
      setShowChooser(true);
      return;
    }
    // Subsequent unlocks within the same session: jump straight to the last
    // founder chapter they were reading, if any — and only if they aren't
    // already on it.
    const last = getLastFounderRoute(userId);
    if (last && last !== location.pathname) {
      navigate(last);
    }
    setStatus({ kind: "unlocked" });
  };

  const dismissChooser = (target?: string) => {
    sessionStorage.setItem(chooserSeenKey, "1");
    setShowChooser(false);
    if (target && target !== location.pathname) {
      rememberFounderRoute(userId, target);
      navigate(target);
    } else {
      // Continuing on current page — remember it as the latest visit.
      if (isFounderRoute(location.pathname)) {
        rememberFounderRoute(userId, location.pathname);
      }
      setStatus({ kind: "unlocked" });
    }
  };

  const triggerShake = () => {
    void hapticError();
    setShake(true);
    window.setTimeout(() => setShake(false), 480);
  };

  const handleVerify = async (entered: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("vault-pin-verify", {
        body: { pin: entered },
      });
      if (error || !data?.ok) {
        const code = (data as any)?.error;
        const mins = (data as any)?.minutes_remaining;
        const remaining = (data as any)?.attempts_remaining;
        if (code === "locked") {
          setStatus({ kind: "locked", minutesRemaining: mins ?? 15 });
          toast.error(`Too many wrong attempts. Locked for ${mins ?? 15} min.`);
          void hapticError();
        } else if (code === "no_pin_access") {
          setStatus({ kind: "denied", message: (data as any)?.message ?? "No PIN access." });
          void hapticError();
        } else if (code === "no_pin_set") {
          setStatus({ kind: "needs_setup" });
        } else {
          setStatus({ kind: "needs_unlock", attemptsRemaining: remaining });
          triggerShake();
          toast.error(
            remaining != null
              ? `Wrong PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
              : "Wrong PIN.",
          );
        }
        setPin("");
        return;
      }
      await markUnlocked();
    } finally {
      setBusy(false);
    }
  };

  const handleSetup = async (entered: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("vault-pin-set", {
        body: { pin: entered },
      });
      if (error || !data?.ok) {
        toast.error("Could not set PIN. Try again.");
        triggerShake();
        setPin("");
        setConfirmPin("");
        setSetupStage("create");
        return;
      }
      toast.success("PIN set. Vault unlocked.");
      await markUnlocked();
    } finally {
      setBusy(false);
    }
  };

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (busy) return;
    if (status.kind === "needs_unlock" && pin.length === 4) {
      void handleVerify(pin);
    } else if (status.kind === "needs_setup") {
      if (setupStage === "create" && pin.length === 4) {
        void mediumTap();
        setSetupStage("confirm");
      } else if (setupStage === "confirm" && confirmPin.length === 4) {
        if (confirmPin === pin) {
          void handleSetup(pin);
        } else {
          toast.error("PINs don't match. Try again.");
          triggerShake();
          setPin("");
          setConfirmPin("");
          setSetupStage("create");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, confirmPin, status.kind, setupStage, busy]);

  // While unlocked, persist the current founder route so a later unlock
  // (same session) can default the user back to where they left off.
  useEffect(() => {
    if (status.kind !== "unlocked" || showChooser) return;
    rememberFounderRoute(userId, location.pathname);
  }, [status.kind, showChooser, userId, location.pathname]);

  if (status.kind === "unlocked" && !showChooser) return <>{children}</>;

  if (showChooser) {
    return (
      <div
        className="min-h-[100svh] flex flex-col bg-background relative overflow-hidden"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
          paddingLeft: "calc(env(safe-area-inset-left) + 1rem)",
          paddingRight: "calc(env(safe-area-inset-right) + 1rem)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-6 animate-fade-in">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_24px_hsl(var(--primary)/0.35)]">
              <Check className="h-6 w-6 text-primary" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Vault unlocked</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Jump straight to a chapter, or continue here.
            </p>
          </div>

          <div className="space-y-2.5">
            {FOUNDER_DESTINATIONS.map(({ to, label, blurb, Icon }, i) => {
              const isCurrent = to === location.pathname;
              return (
                <button
                  key={to}
                  type="button"
                  onClick={() => {
                    void lightTap();
                    dismissChooser(to);
                  }}
                  className="group w-full text-left rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 active:scale-[0.99] transition-all p-4 flex items-center gap-3 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {label}
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-widest text-primary/80 border border-primary/30 rounded-full px-1.5 py-0.5">
                          You're here
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground leading-snug truncate">
                      {blurb}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            className="mt-5 text-muted-foreground hover:text-foreground"
            onClick={() => {
              void lightTap();
              dismissChooser();
            }}
          >
            Continue on this page
          </Button>

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center pt-4">
            You won't see this again until you sign back in.
          </p>
        </div>
      </div>
    );
  }

  const activeValue = status.kind === "needs_setup" && setupStage === "confirm" ? confirmPin : pin;
  const setActiveValue = (v: string) => {
    if (status.kind === "needs_setup" && setupStage === "confirm") setConfirmPin(v);
    else setPin(v);
  };
  const pressDigit = (d: string) => {
    if (busy) return;
    if (activeValue.length >= 4) return;
    void lightTap();
    setActiveValue(activeValue + d);
  };
  const pressDelete = () => {
    if (busy) return;
    if (activeValue.length === 0) return;
    void lightTap();
    setActiveValue(activeValue.slice(0, -1));
  };

  const heading =
    status.kind === "denied"
      ? "Access Denied"
      : status.kind === "needs_setup"
      ? setupStage === "create"
        ? "Create your PIN"
        : "Confirm your PIN"
      : status.kind === "locked"
      ? "Temporarily Locked"
      : "Enter your PIN";

  const subtitle =
    status.kind === "checking"
      ? "Checking access…"
      : status.kind === "denied"
      ? status.message
      : status.kind === "needs_setup"
      ? setupStage === "create"
        ? "Choose a 4-digit PIN to unlock the Founders area on this account."
        : "Re-enter the same PIN to confirm."
      : status.kind === "locked"
      ? `Too many wrong attempts. Try again in ~${status.minutesRemaining} min.`
      : status.kind === "needs_unlock" && status.attemptsRemaining != null
      ? `${status.attemptsRemaining} attempt${status.attemptsRemaining === 1 ? "" : "s"} remaining.`
      : "Founders Only";

  return (
    <div
      className="min-h-[100svh] flex flex-col bg-background relative overflow-hidden"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
        paddingLeft: "calc(env(safe-area-inset-left) + 1rem)",
        paddingRight: "calc(env(safe-area-inset-right) + 1rem)",
      }}
    >
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header — safe-area aware, never under the notch */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="text-muted-foreground -ml-2 h-10"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={goHome}
          className="text-muted-foreground -mr-2 h-10"
        >
          <Home className="h-4 w-4 mr-1" /> Home
        </Button>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`w-full max-w-xs space-y-6 text-center ${
            shake ? "animate-[shake_0.45s_cubic-bezier(.36,.07,.19,.97)]" : ""
          }`}
        >
          <div className="flex justify-center">
            <div
              className={`relative h-16 w-16 rounded-full border flex items-center justify-center transition-all duration-500 ${
                justUnlocked
                  ? "bg-primary/20 border-primary scale-110 shadow-[0_0_40px_hsl(var(--primary)/0.45)]"
                  : "bg-primary/10 border-primary/30"
              }`}
            >
              {justUnlocked && (
                <>
                  <span className="absolute inset-[-6px] rounded-full border-2 border-primary/40 animate-[ping_0.7s_ease-out_1]" />
                  <span className="absolute inset-[-14px] rounded-full border border-primary/20 animate-[ping_0.9s_ease-out_1]" />
                </>
              )}
              {justUnlocked ? (
                <Check className="h-8 w-8 text-primary animate-scale-in" strokeWidth={2.5} />
              ) : status.kind === "checking" || busy ? (
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
              ) : status.kind === "denied" || status.kind === "locked" ? (
                <ShieldAlert className="h-7 w-7 text-destructive" />
              ) : (
                <KeyRound className="h-7 w-7 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {justUnlocked ? "Unlocked" : heading}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {justUnlocked ? "Welcome back." : subtitle}
            </p>
          </div>

          {!justUnlocked && (status.kind === "needs_unlock" || status.kind === "needs_setup") && (
            <>
              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((i) => {
                  const filled = i < activeValue.length;
                  return (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                        filled
                          ? "bg-primary border-primary scale-110 shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                          : "border-muted-foreground/40"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2.5 select-none">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    onClick={() => pressDigit(d)}
                    disabled={busy}
                    className="h-14 rounded-xl bg-card/60 border border-border/60 text-xl font-medium hover:bg-card hover:border-primary/40 active:scale-90 active:bg-primary/15 active:border-primary/60 transition-all duration-100 disabled:opacity-40"
                  >
                    {d}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => pressDigit("0")}
                  disabled={busy}
                  className="h-14 rounded-xl bg-card/60 border border-border/60 text-xl font-medium hover:bg-card hover:border-primary/40 active:scale-90 active:bg-primary/15 active:border-primary/60 transition-all duration-100 disabled:opacity-40"
                >
                  0
                </button>
                <button
                  onClick={pressDelete}
                  disabled={busy || activeValue.length === 0}
                  className="h-14 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all duration-100 disabled:opacity-30"
                  aria-label="Delete"
                >
                  <Delete className="h-5 w-5" />
                </button>
              </div>
            </>
          )}

          {status.kind === "locked" && (
            <Button onClick={goHome} variant="outline" className="w-full">
              Return Home
            </Button>
          )}

          {status.kind === "denied" && (
            <Button onClick={goHome} variant="outline" className="w-full">
              Return Home
            </Button>
          )}

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground pt-2">
            Confidential · Founders Only
          </p>
        </div>
      </div>
    </div>
  );
}
