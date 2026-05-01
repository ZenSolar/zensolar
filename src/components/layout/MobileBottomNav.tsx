import { NavLink, useLocation } from "react-router-dom";
import { Home, Zap, Wallet, Image as ImageIcon, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
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

const MORE_LINKS_APP = [
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
  { to: "/devices", label: "Devices" },
  { to: "/subscribe", label: "Subscription" },
  { to: "/tokenomics", label: "Tokenomics" },
  { to: "/help", label: "Help" },
  { to: "/feedback", label: "Feedback" },
];

const MORE_LINKS_DEMO = [
  { to: "/demo", label: "Demo Home" },
  { to: "/", label: "Exit Demo" },
  { to: "/subscribe", label: "Subscription Plans" },
  { to: "/tokenomics", label: "Tokenomics" },
];

const MORE_LINKS_MARKETING = [
  { to: "/auth", label: "Sign in" },
  { to: "/install", label: "Install app" },
  { to: "/help", label: "Help" },
  { to: "/feedback", label: "Feedback" },
];

export function MobileBottomNav({ variant = "app", className }: MobileBottomNavProps) {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs =
    variant === "demo" ? DEMO_TABS : variant === "marketing" ? MARKETING_TABS : APP_TABS;
  const moreLinks =
    variant === "demo"
      ? MORE_LINKS_DEMO
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
    <nav
      aria-label="Primary"
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-40",
        "border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        height: "var(--bottom-nav-total-h)",
      }}
    >
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
              className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
            >
              <SheetHeader>
                <SheetTitle>More</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 grid gap-1">
                {moreLinks.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive: a }) =>
                        cn(
                          "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium touch-target",
                          "transition-colors active:scale-[0.98]",
                          a
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted",
                        )
                      }
                    >
                      <span>{link.label}</span>
                      <span aria-hidden className="text-muted-foreground">›</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}

export default MobileBottomNav;
