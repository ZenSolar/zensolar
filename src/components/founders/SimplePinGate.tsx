import { useEffect, useState } from "react";
import { KeyRound, Delete, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  /** Static 4-digit code that unlocks the page. */
  code: string;
  /** Storage namespace so different pages don't share unlock state. */
  storageKey: string;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Lightweight client-side PIN gate for internal founder pages where a shared
 * static code is acceptable (e.g. the revenue-model comparison doc).
 *
 * NOT a replacement for VaultPinGate — no auth, no server check. Unlock
 * persists in sessionStorage under `zen.simple-pin:{storageKey}`.
 */
export function SimplePinGate({
  code,
  storageKey,
  children,
  title = "Enter access code",
  subtitle = "Founders only",
}: Props) {
  const sessionKey = `zen.simple-pin:${storageKey}`;
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(sessionKey) === "1";
  });
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (unlocked || pin.length < 4) return;
    if (pin === code) {
      setJustUnlocked(true);
      sessionStorage.setItem(sessionKey, "1");
      const t = setTimeout(() => setUnlocked(true), 600);
      return () => clearTimeout(t);
    } else {
      setShake(true);
      const t = setTimeout(() => {
        setShake(false);
        setPin("");
      }, 450);
      return () => clearTimeout(t);
    }
  }, [pin, code, sessionKey, unlocked]);

  if (unlocked) return <>{children}</>;

  const press = (d: string) => {
    if (pin.length >= 4) return;
    setPin((p) => p + d);
  };
  const del = () => setPin((p) => p.slice(0, -1));

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
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full bg-primary/5 blur-3xl" />
      </div>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-2 h-10 px-2 self-start"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </button>

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
              {justUnlocked ? (
                <Check className="h-8 w-8 text-primary" strokeWidth={2.5} />
              ) : (
                <KeyRound className="h-7 w-7 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {justUnlocked ? "Unlocked" : title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {justUnlocked ? "Welcome." : subtitle}
            </p>
          </div>

          {!justUnlocked && (
            <>
              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                      i < pin.length
                        ? "bg-primary border-primary scale-110 shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                        : "border-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2.5 select-none">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    onClick={() => press(d)}
                    className="h-14 rounded-xl bg-card/60 border border-border/60 text-xl font-medium hover:bg-card hover:border-primary/40 active:scale-90 active:bg-primary/15 transition-all"
                  >
                    {d}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => press("0")}
                  className="h-14 rounded-xl bg-card/60 border border-border/60 text-xl font-medium hover:bg-card hover:border-primary/40 active:scale-90 active:bg-primary/15 transition-all"
                >
                  0
                </button>
                <button
                  onClick={del}
                  disabled={pin.length === 0}
                  className="h-14 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all disabled:opacity-30"
                  aria-label="Delete"
                >
                  <Delete className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
