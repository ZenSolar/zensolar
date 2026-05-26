import { useEffect, useState } from "react";
import { Loader2, KeyRound, Delete, Check, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PitchDeckShell } from "@/components/investor/pitch/PitchDeckShell";
import { Slide01Title } from "@/components/investor/pitch/slides/Slide01Title";
import { Slide02Catalyst } from "@/components/investor/pitch/slides/Slide02Catalyst";
import { Slide04Opportunity } from "@/components/investor/pitch/slides/Slide04Opportunity";
import { Slide05Solution } from "@/components/investor/pitch/slides/Slide05Solution";
import { Slide06Technology } from "@/components/investor/pitch/slides/Slide06Technology";
import { Slide07ThirdPrimitive } from "@/components/investor/pitch/slides/Slide07ThirdPrimitive";
import { Slide07ValueMechanism } from "@/components/investor/pitch/slides/Slide07ValueMechanism";
import { Slide08POLDefense } from "@/components/investor/pitch/slides/Slide08POLDefense";
import { Slide10ThreeWallsMoat } from "@/components/investor/pitch/slides/Slide10ThreeWallsMoat";
import { Slide09Revenue } from "@/components/investor/pitch/slides/Slide09Revenue";
import { Slide10UnitEconomics } from "@/components/investor/pitch/slides/Slide10UnitEconomics";
import { Slide11Traction } from "@/components/investor/pitch/slides/Slide11Traction";
import { Slide12RiskMitigation } from "@/components/investor/pitch/slides/Slide12RiskMitigation";
import { Slide13TheAsk } from "@/components/investor/pitch/slides/Slide13TheAsk";
import { SlideCompetition } from "@/components/investor/pitch/slides/SlideCompetition";

const SESSION_KEY = "zen.deck-pin-unlocked";

const slides = [
  <Slide01Title />,
  <Slide02Catalyst />,
  <Slide04Opportunity />,
  <Slide11Traction />,
  <Slide05Solution />,
  <Slide06Technology />,
  <Slide07ThirdPrimitive />,
  <Slide07ValueMechanism />,
  <Slide08POLDefense />,
  <Slide10ThreeWallsMoat />,
  <Slide09Revenue />,
  <Slide10UnitEconomics />,
  <SlideCompetition />,
  <Slide12RiskMitigation />,
  <Slide13TheAsk />,
];

const slideLabels = [
  "Title", "The Catalyst", "The Opportunity", "Traction & Beta",
  "The Solution", "Proprietary Tech & IP", "Third Consensus Primitive",
  "Value Mechanism", "Sell-Pressure Defense", "The Moat",
  "Revenue Model", "Unit Economics", "Competition",
  "Risk Mitigation", "The Ask",
];

export default function DeckPinGated() {
  const [unlocked, setUnlocked] = useState(
    typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1",
  );
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [throttled, setThrottled] = useState<number | null>(null);

  useEffect(() => {
    document.title = "ZenSolar · Seed Deck";
  }, []);

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 480);
  };

  const verify = async (entered: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("deck-pin-verify", {
        body: { pin: entered },
      });
      if (error || !data?.ok) {
        const code = (data as any)?.error;
        if (code === "throttled") {
          setThrottled((data as any)?.minutes_remaining ?? 15);
          toast.error("Too many attempts. Try again later.");
        } else {
          triggerShake();
          const remaining = (data as any)?.attempts_remaining;
          toast.error(
            remaining != null
              ? `Wrong PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
              : "Wrong PIN.",
          );
        }
        setPin("");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
      setJustUnlocked(true);
      await new Promise((r) => setTimeout(r, 600));
      setUnlocked(true);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (busy || unlocked || throttled) return;
    if (pin.length === 4) void verify(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, busy, unlocked, throttled]);

  if (unlocked) {
    return <PitchDeckShell slides={slides} slideLabels={slideLabels} />;
  }

  const pressDigit = (d: string) => {
    if (busy || pin.length >= 4 || throttled) return;
    setPin(pin + d);
  };
  const pressDelete = () => {
    if (busy || pin.length === 0) return;
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(220,20%,6%)] text-white">
      <div className="flex-1 flex items-center justify-center px-6 py-10">
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
              ) : busy ? (
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
              ) : throttled ? (
                <ShieldAlert className="h-7 w-7 text-destructive" />
              ) : (
                <KeyRound className="h-7 w-7 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {justUnlocked
                ? "Unlocked"
                : throttled
                ? "Temporarily Locked"
                : "ZenSolar · Seed Deck"}
            </h1>
            <p className="text-sm text-white/60 leading-relaxed">
              {justUnlocked
                ? "Welcome."
                : throttled
                ? `Too many wrong attempts. Try again in ~${throttled} min.`
                : "Enter your 4-digit PIN."}
            </p>
          </div>

          {!justUnlocked && !throttled && (
            <>
              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((i) => {
                  const filled = i < pin.length;
                  return (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                        filled
                          ? "bg-primary border-primary scale-110 shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                          : "border-white/30"
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
                    className="h-14 rounded-xl bg-white/5 border border-white/10 text-xl font-medium hover:bg-white/10 hover:border-primary/40 active:scale-90 active:bg-primary/15 active:border-primary/60 transition-all duration-100 disabled:opacity-40"
                  >
                    {d}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => pressDigit("0")}
                  disabled={busy}
                  className="h-14 rounded-xl bg-white/5 border border-white/10 text-xl font-medium hover:bg-white/10 hover:border-primary/40 active:scale-90 active:bg-primary/15 active:border-primary/60 transition-all duration-100 disabled:opacity-40"
                >
                  0
                </button>
                <button
                  onClick={pressDelete}
                  disabled={busy || pin.length === 0}
                  className="h-14 rounded-xl flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all duration-100 disabled:opacity-30"
                  aria-label="Delete"
                >
                  <Delete className="h-5 w-5" />
                </button>
              </div>
            </>
          )}

          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 pt-2">
            Confidential · Strategic Seed
          </p>
        </div>
      </div>
    </div>
  );
}
