import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Zap, Wallet, Image as ImageIcon, MoreHorizontal,
  User, Settings as SettingsIcon, Cpu, CreditCard, BarChart3,
  BookOpen, LifeBuoy, MessageSquare, LogIn, Download, ChevronRight,
  ShieldCheck, Sparkles, ArrowLeftRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { isAuthorizedReviewer } from "@/lib/reviewerAccess";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Match this prefix as well (for active highlighting) */
  matchPrefixes?: string[];
}

interface MobileBottomNavProps {
  /** Use demo routes (/demo/*) instead of live routes */
  variant?: "app" | "demo" | "marketing";
  className?: string;
}

const APP_TABS: NavItem[] = [
  { to: "/home", label: "Home", icon: Home, matchPrefixes: ["/home", "/"] },
  { to: "/mint-history", label: "Mint", icon: Zap, matchPrefixes: ["/mint"] },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/nft-collection", label: "NFTs", icon: ImageIcon, matchPrefixes: ["/nft"] },
];

const DEMO_TABS: NavItem[] = [
  { to: "/demo", label: "Home", icon: Home },
  { to: "/demo/energy-log", label: "Mint", icon: Zap },
  { to: "/demo/wallet", label: "Wallet", icon: Wallet },
  { to: "/demo/nft-collection", label: "NFTs", icon: ImageIcon },
];

const MARKETING_TABS: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tokenomics", label: "Tokenomics", icon: Zap },
  { to: "/subscribe", label: "Plans", icon: Wallet },
  { to: "/demo", label: "Demo", icon: ImageIcon },
];

type MoreLink = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  group?: "primary" | "secondary";
};

const MORE_LINKS_APP: MoreLink[] = [
  { to: "/profile", label: "Profile", icon: User, description: "Account & wallet", group: "primary" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, description: "Preferences & alerts", group: "primary" },
  { to: "/devices", label: "Devices", icon: Cpu, description: "Connected energy hardware", group: "primary" },
  { to: "/subscribe", label: "Subscription", icon: CreditCard, description: "Plan & billing", group: "primary" },
  { to: "/tokenomics", label: "Tokenomics", icon: BarChart3, description: "Supply, burn & LP", group: "secondary" },
  { to: "/glossary", label: "Glossary", icon: BookOpen, description: "Definitions", group: "secondary" },
  { to: "/help", label: "Help", icon: LifeBuoy, description: "Guides & support", group: "secondary" },
  { to: "/feedback", label: "Feedback", icon: MessageSquare, description: "Send a note", group: "secondary" },
];

const MORE_LINKS_DEMO: MoreLink[] = [
  { to: "/demo", label: "Demo Home", icon: Sparkles, description: "Back to the demo dashboard", group: "primary" },
  { to: "/", label: "Exit Demo", icon: ArrowLeftRight, description: "Return to marketing site", group: "primary" },
  { to: "/subscribe", label: "Subscription Plans", icon: CreditCard, description: "Plan & billing", group: "secondary" },
  { to: "/tokenomics", label: "Tokenomics", icon: BarChart3, description: "Supply, burn & LP", group: "secondary" },
  { to: "/glossary", label: "Glossary", icon: BookOpen, description: "Definitions", group: "secondary" },
];

const MORE_LINKS_MARKETING: MoreLink[] = [
  { to: "/auth", label: "Sign in", icon: LogIn, description: "Access your account", group: "primary" },
  { to: "/install", label: "Install app", icon: Download, description: "Add to home screen", group: "primary" },
  { to: "/glossary", label: "Glossary", icon: BookOpen, description: "Definitions", group: "secondary" },
  { to: "/help", label: "Help", icon: LifeBuoy, description: "Guides & support", group: "secondary" },
  { to: "/feedback", label: "Feedback", icon: MessageSquare, description: "Send a note", group: "secondary" },
];


export function MobileBottomNav({ variant = "app", className }: MobileBottomNavProps) {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs =
    variant === "demo" ? DEMO_TABS : variant === "marketing" ? MARKETING_TABS : APP_TABS;
  const reviewerLinks: MoreLink[] = variant === "demo" && isAuthorizedReviewer()
    ? [{ to: "/demo/reviewer", label: "Greg Review Materials", icon: ShieldCheck, description: "Reviewer-only docs", group: "primary" }]
    : [];

  const moreLinks =
    variant === "demo"
      ? [...reviewerLinks, ...MORE_LINKS_DEMO]
      : variant === "marketing"
        ? MORE_LINKS_MARKETING
        : MORE_LINKS_APP;

  const isActive = (item: NavItem) => {
    if (pathname === item.to) return true;
    return (item.matchPrefixes ?? []).some((p) =>
      p === "/" ? pathname === "/" : pathname.startsWith(p),
    );
  };

  return (
    <>
      {/* Soft fade mask above the tab bar — prevents the next scrolling card
          from peeking up as a half-rendered sliver against the bottom nav. */}
      <div
        aria-hidden
        className="md:hidden pointer-events-none fixed inset-x-0 z-30"
        style={{
          bottom: "var(--bottom-nav-total-h)",
          height: "24px",
          background:
            "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0) 100%)",
        }}
      />
      <nav
      aria-label="Primary"
      data-fixed-bottom="true"
      className={cn(
        "md:hidden fixed inset-x-0 z-40",
        // Bar background extends all the way to the physical screen edge so the
        // home-indicator zone is visually continuous with the nav (no white slab,
        // no floating bar). The icon row inside is offset upward by the safe area.
        "bg-card border-t border-border",
        className,
      )}
      style={{
        bottom: 0,
        height: "var(--bottom-nav-total-h)",
        paddingBottom: "var(--bottom-nav-safe)",
      }}
    >
      {/* Icon row stays at native height; padding-bottom on the nav lifts it
          above the iOS home indicator so taps feel natural. */}
      <ul className="grid grid-cols-5 h-[var(--bottom-nav-height)]">
        {tabs.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.to} className="contents">
              <NavLink
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] touch-target",
                  "text-[10px] font-medium tracking-wide transition-colors active:scale-95",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "scale-110 drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]",
                  )}
                  aria-hidden
                />
                <span>{item.label}</span>
                {active && (
                  <span
                    className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary"
                    aria-hidden
                  />
                )}
              </NavLink>
            </li>
          );
        })}
        <li className="contents">
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] touch-target",
                  "text-[10px] font-medium tracking-wide transition-colors active:scale-95",
                  "text-muted-foreground hover:text-foreground",
                )}
                aria-label="More navigation"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              hideCloseButton
              className={cn(
                "border-t border-border/60 bg-card/95 backdrop-blur-xl",
                "rounded-t-3xl px-0 pt-0 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)]",
                "shadow-[0_-20px_60px_-20px_hsl(var(--primary)/0.25)]",
                "max-h-[85vh] overflow-hidden",
              )}
            >
              <SwipeDismissWrapper onDismiss={() => setMoreOpen(false)}>
                <div className="px-5 pb-2">
                  <SheetHeader className="text-left space-y-1 pb-3">
                    <SheetTitle className="text-base font-semibold tracking-tight">
                      More
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground">
                      Account, settings, and protocol info
                    </p>
                  </SheetHeader>
                </div>
                <div className="px-3 pb-2 max-h-[68vh] overflow-y-auto overscroll-contain">
                  {(["primary", "secondary"] as const).map((group, gi) => {
                    const items = moreLinks.filter((l) => (l.group ?? "primary") === group);
                    if (items.length === 0) return null;
                    return (
                      <div key={group} className={cn(gi > 0 && "mt-3 pt-3 border-t border-border/40")}>
                        <ul className="grid gap-1">
                          {items.map((link) => {
                            const Icon = link.icon;
                            return (
                              <li key={link.to}>
                                <NavLink
                                  to={link.to}
                                  onClick={() => setMoreOpen(false)}
                                  className={({ isActive: a }) =>
                                    cn(
                                      "group flex items-center gap-3 rounded-xl px-3 py-3 touch-target",
                                      "transition-all active:scale-[0.98]",
                                      a
                                        ? "bg-primary/10 text-primary"
                                        : "text-foreground hover:bg-muted/60",
                                    )
                                  }
                                >
                                  {({ isActive: a }) => (
                                    <>
                                      <span
                                        className={cn(
                                          "flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-colors",
                                          a
                                            ? "bg-primary/15 text-primary"
                                            : "bg-muted/60 text-foreground/80 group-hover:bg-muted",
                                        )}
                                      >
                                        <Icon className="h-[18px] w-[18px]" />
                                      </span>
                                      <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-medium leading-tight truncate">
                                          {link.label}
                                        </span>
                                        {link.description && (
                                          <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                                            {link.description}
                                          </span>
                                        )}
                                      </span>
                                      <ChevronRight
                                        className={cn(
                                          "h-4 w-4 shrink-0 transition-transform",
                                          a ? "text-primary" : "text-muted-foreground/60 group-hover:translate-x-0.5",
                                        )}
                                        aria-hidden
                                      />
                                    </>
                                  )}
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </SwipeDismissWrapper>
            </SheetContent>

          </Sheet>
        </li>
      </ul>
    </nav>
    </>
  );
}

export default MobileBottomNav;
