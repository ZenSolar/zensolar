import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  History,
  ShoppingBag,
  BarChart3,
  BookOpen,
  Wallet,
  Award,
  Sparkles,
  FileText,
  Cpu,
  User,
  Users,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { triggerLightTap } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";


const STORAGE_KEY = "zen.sidebarOnboardingSeen.v2";

type Step = {
  id: string;
  title: string;
  blurb: string;
  accent: string; // tailwind text color class
  items: { icon: React.ComponentType<{ className?: string }>; label: string }[];
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to ZenSolar",
    blurb:
      "A quick 15-second tour of your menu. Three simple sections — no crypto jargon, promise.",
    accent: "text-primary",
    items: [],
  },
  {
    id: "main",
    title: "Main",
    blurb:
      "This is where you check your energy, mint tokens, and see your rewards. You'll live here.",
    accent: "text-primary",
    items: [
      { icon: LayoutDashboard, label: "Dashboard" },
      { icon: History, label: "Mint History" },
      { icon: ShoppingBag, label: "$ZSOLAR Store" },
      { icon: BarChart3, label: "My Energy Logs" },
      { icon: BookOpen, label: "Learn" },
      { icon: Wallet, label: "Wallet" },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    blurb: "Deeper reading and advanced features — when you want to go further.",
    accent: "text-secondary",
    items: [
      { icon: Award, label: "NFT Collection" },
      { icon: Sparkles, label: "Proof-of-Genesis™" },
      { icon: FileText, label: "White Paper" },
      { icon: Cpu, label: "Patent Technology" },
    ],
  },
  {
    id: "account",
    title: "Account",
    blurb: "Profile, referrals, theme and sign-out — all in one tidy spot.",
    accent: "text-amber-400",
    items: [
      { icon: User, label: "Profile" },
      { icon: Users, label: "Referrals" },
    ],
  },
];

export function SidebarOnboarding() {
  const { openMobile, open, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => {
      setShow(true);
      triggerLightTap();
    }, 380);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    triggerLightTap();
    setShow(false);
    // Reset for unmount cleanliness
    window.setTimeout(() => setStep(0), 250);
  };

  const next = () => {
    triggerLightTap();
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const back = () => {
    triggerLightTap();
    setStep((s) => Math.max(0, s - 1));
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={show} onOpenChange={(v) => !v && finish()}>
      <DialogContent
        className={cn(
          "max-w-sm overflow-hidden border-sidebar-border/60 p-0",
          // Glassmorphism, dark-mode friendly
          "bg-background/85 backdrop-blur-xl",
          "shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.35)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=open]:duration-300",
        )}
      >
        <div className="sr-only">
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.blurb}</DialogDescription>
        </div>

        {/* Skip button */}
        <button
          onClick={finish}
          aria-label="Skip tour"
          className="absolute right-3 top-3 z-10 inline-flex h-7 items-center gap-1 rounded-full border border-border/50 bg-background/40 px-2.5 text-[11px] text-muted-foreground transition hover:bg-background/80 hover:text-foreground"
        >
          <span>Skip</span>
          <X className="h-3 w-3" aria-hidden="true" />
        </button>

        {/* Glowing top accent */}
        <div
          className={cn(
            "h-1 w-full bg-gradient-to-r transition-colors duration-500",
            step === 0 && "from-primary/0 via-primary to-primary/0",
            step === 1 && "from-primary/0 via-primary to-primary/0",
            step === 2 && "from-secondary/0 via-secondary to-secondary/0",
            step === 3 && "from-amber-400/0 via-amber-400 to-amber-400/0",
          )}
        />

        <div className="px-6 pb-5 pt-6">
          {/* Section badge */}
          {step > 0 && (
            <div
              key={`badge-${step}`}
              className="mb-3 inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            >
              <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", {
                "bg-primary": step === 1,
                "bg-secondary": step === 2,
                "bg-amber-400": step === 3,
              })} />
              <span className={current.accent}>{current.title}</span>
            </div>
          )}

          {/* Title */}
          <h2
            key={`title-${step}`}
            className="animate-fade-in text-xl font-semibold tracking-tight text-foreground"
            style={{ animationDelay: "40ms", animationFillMode: "both" }}
          >
            {step === 0 ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" aria-hidden="true" />
                {current.title}
              </span>
            ) : (
              current.title
            )}
          </h2>

          {/* Blurb */}
          <p
            key={`blurb-${step}`}
            className="mt-2 animate-fade-in text-sm leading-relaxed text-muted-foreground"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            {current.blurb}
          </p>

          {/* Item preview grid */}
          {current.items.length > 0 && (
            <div
              className={cn(
                "mt-4 rounded-xl border p-3 transition-colors",
                step === 1 && "border-primary/30 bg-primary/5 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.5)]",
                step === 2 && "border-secondary/30 bg-secondary/5 shadow-[0_0_30px_-10px_hsl(var(--secondary)/0.5)]",
                step === 3 && "border-amber-400/30 bg-amber-400/5 shadow-[0_0_30px_-10px_rgb(251_191_36/0.45)]",
              )}
            >
              <div className="grid grid-cols-2 gap-1.5">
                {current.items.map((it, i) => (
                  <div
                    key={it.label}
                    className="flex animate-fade-in items-center gap-2 rounded-md bg-background/40 px-2 py-1.5 text-xs text-foreground"
                    style={{
                      animationDelay: `${120 + i * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <it.icon
                      className={cn("h-3.5 w-3.5 flex-shrink-0", current.accent)}
                    />
                    <span className="truncate">{it.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final CTA on last step */}
          {isLast && (
            <div
              className="mt-4 animate-fade-in rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm"
              style={{ animationDelay: "180ms", animationFillMode: "both" }}
            >
              <p className="mb-2 font-medium text-foreground">Suggested first steps</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Pill icon={LayoutDashboard} label="Dashboard" />
                <ArrowRight className="h-3 w-3 opacity-50" />
                <Pill icon={History} label="Mint History" />
                <ArrowRight className="h-3 w-3 opacity-50" />
                <Pill icon={BookOpen} label="Learn" />
              </div>
            </div>
          )}

          {/* Progress dots */}
          <div className="mt-5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Tour progress">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                role="tab"
                aria-selected={i === step}
                aria-label={`Step ${i + 1} of ${STEPS.length}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted-foreground/25",
                )}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-4 flex items-center gap-2">
            {step > 0 && !isLast && (
              <Button variant="ghost" size="sm" onClick={back} className="text-muted-foreground">
                Back
              </Button>
            )}
            <Button
              onClick={next}
              size="sm"
              className={cn(
                "ml-auto min-h-[2.5rem] gap-1.5 px-4 transition-transform active:scale-[0.97]",
                isLast && "w-full",
              )}
            >
              {isLast ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Got it, thanks!
                </>
              ) : (
                <>
                  {step === 0 ? "Take the tour" : "Next"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Pill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/60 px-2 py-1 font-medium text-foreground">
      <Icon className="h-3 w-3 text-primary" />
      {label}
    </span>
  );
}
