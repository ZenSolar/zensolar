import { useSidebar } from "@/components/ui/sidebar";
import { Command as CommandIcon } from "lucide-react";

/**
 * Phase 2 of the web-app upgrade.
 *
 * Desktop-only glanceable status block surfaced above the main nav in the
 * sidebar. Mobile (offcanvas sidebar) hides this entirely.
 *
 * Currently just surfaces the ⌘K command-palette discoverability hint.
 * Wallet pill was intentionally removed — wallet connection lives in TopNav /
 * dedicated wallet flows, not the sidebar chrome.
 */
export function SidebarStatus() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (collapsed) {
    return (
      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
          aria-label="Open command palette"
          className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <CommandIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="hidden lg:block px-3 pt-2 pb-1">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
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
