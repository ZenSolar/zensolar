import { useEffect, useState } from "react";
import { LayoutDashboard, History, BookOpen, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

const STORAGE_KEY = "zen.sidebarOnboardingSeen.v1";

/**
 * One-time tour shown the first time a signed-in user opens the sidebar.
 * Explains the three sections and recommends a starting path.
 */
export function SidebarOnboarding() {
  const { openMobile, open, isMobile } = useSidebar();
  const [show, setShow] = useState(false);

  const isOpen = isMobile ? openMobile : open;

  useEffect(() => {
    if (!isOpen) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    // Defer so the sidebar finishes its open animation first.
    const t = window.setTimeout(() => setShow(true), 350);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <Dialog open={show} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Welcome to ZenSolar</DialogTitle>
          </div>
          <DialogDescription>
            Your menu is organized into three simple sections so you always know where to go.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Section
            label="Main"
            desc="Everything you use every day — Dashboard, Mint History, Store, Energy Logs, Learn, Wallet."
          />
          <Section
            label="Resources"
            desc="Reference material — NFT Collection, Proof-of-Genesis™, White Paper, Patent Tech."
          />
          <Section label="Account" desc="Profile, Referrals, theme, and Sign Out." />
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <p className="font-medium text-foreground mb-2">Suggested first steps</p>
          <ol className="space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Open your <strong className="text-foreground">Dashboard</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Check your <strong className="text-foreground">Mint History</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Visit <strong className="text-foreground">Learn</strong> to see how it works</span>
            </li>
          </ol>
        </div>

        <DialogFooter>
          <Button onClick={dismiss} className="w-full">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex h-5 min-w-[3.75rem] items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-bold uppercase tracking-wider text-sidebar-accent-foreground">
        {label}
      </span>
      <p className="text-muted-foreground leading-snug">{desc}</p>
    </div>
  );
}
