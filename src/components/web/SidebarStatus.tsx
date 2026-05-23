import { Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSafeAccount } from "@/hooks/useSafeWagmi";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarStatusProps {
  /**
   * Where the wallet pill should navigate when clicked.
   * Defaults to "/wallet" — pass "/demo-leonardo/wallet" or "/demo/wallet"
   * from the demo sidebars so it stays scoped to that route tree.
   */
  walletHref?: string;
}

/**
 * Phase 2 of the web-app upgrade.
 *
 * Desktop-only glanceable status block surfaced above the main nav in the
 * sidebar. Mobile (offcanvas sidebar) hides this entirely — the mobile bottom
 * nav already covers the same intent.
 *
 * Today this surfaces:
 *  • Wallet pill — last 4 of connected address, or "Connect wallet" CTA.
 *  • ⌘K hint    — discoverability for the command palette (Phase 3).
 *
 * Mints-ready chip and last-sync timestamp are intentionally not wired yet —
 * they need real data sources that don't exist in a clean shape yet. Adding
 * placeholders would lie about state. Real wiring lands in a follow-up.
 */
export function SidebarStatus({ walletHref = "/wallet" }: SidebarStatusProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const account = useSafeAccount();
  const address = account?.address;
  const isConnected = !!address;
  const short = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : null;

  // Collapsed (icon) state: just a single dot-status on the wallet icon.
  // The mobile sheet ALWAYS renders the sidebar in expanded mode, so this
  // branch is effectively desktop-collapsed only.
  if (collapsed) {
    return (
      <div className="px-2 pt-2">
        <NavLink
          to={walletHref}
          aria-label={isConnected ? `Wallet ${short} connected` : "Connect wallet"}
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Wallet className="h-4 w-4" />
          <span
            className={cn(
              "absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full",
              isConnected ? "bg-emerald-500" : "bg-sidebar-foreground/30",
            )}
            aria-hidden="true"
          />
        </NavLink>
      </div>
    );
  }

  return (
    <div className="hidden lg:block px-3 pt-2 pb-1 space-y-2">
      <NavLink
        to={walletHref}
        className={cn(
          "group flex items-center gap-2 rounded-md border border-sidebar-border/60 bg-sidebar-accent/40 px-2.5 py-1.5 text-xs transition-colors",
          "hover:bg-sidebar-accent hover:border-sidebar-border",
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full flex-shrink-0",
            isConnected ? "bg-emerald-500 shadow-[0_0_6px_hsl(var(--primary))]" : "bg-sidebar-foreground/30",
          )}
          aria-hidden="true"
        />
        <Wallet className="h-3.5 w-3.5 text-sidebar-foreground/60" aria-hidden="true" />
        <span className="truncate text-sidebar-foreground/90 font-mono">
          {isConnected ? short : "Connect wallet"}
        </span>
      </NavLink>

      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }}
        className="flex w-full items-center justify-between rounded-md px-2.5 py-1 text-[11px] text-sidebar-foreground/55 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/40 transition-colors"
        aria-label="Open command palette"
      >
        <span>Quick jump</span>
        <kbd className="rounded border border-sidebar-border/70 bg-sidebar/40 px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground/70">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
