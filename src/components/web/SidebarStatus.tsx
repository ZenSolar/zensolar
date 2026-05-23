import { useSidebar } from "@/components/ui/sidebar";
import { Command as CommandIcon, Rows3, Rows4 } from "lucide-react";
import { useDensity } from "@/hooks/useDensity";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Phase 2 + 4 of the web-app upgrade.
 *
 * Desktop-only glanceable status block surfaced above the main nav in the
 * sidebar. Mobile (offcanvas sidebar) hides this entirely.
 *
 * Surfaces:
 *  - ⌘K command-palette discoverability hint
 *  - Density toggle (comfortable | compact)
 *
 * Wallet pill was intentionally removed — wallet connection lives in TopNav /
 * dedicated wallet flows, not the sidebar chrome.
 */
export function SidebarStatus() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { density, toggle } = useDensity();
  const DensityIcon = density === "compact" ? Rows4 : Rows3;
  const densityLabel = density === "compact" ? "Compact" : "Comfortable";

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col items-center gap-1 px-2 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                aria-label="Open command palette"
                className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CommandIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Quick jump (⌘K)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => toggle()}
                aria-label={`Density: ${densityLabel}. Click to toggle.`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <DensityIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Density: {densityLabel}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="hidden lg:flex flex-col gap-1 px-3 pt-2 pb-1">
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
      <button
        type="button"
        onClick={() => toggle()}
        className="flex w-full items-center justify-between rounded-md px-2.5 py-1 text-[11px] text-sidebar-foreground/55 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/40 transition-colors"
        aria-label={`Density: ${densityLabel}. Click to toggle.`}
      >
        <span className="flex items-center gap-1.5">
          <DensityIcon className="h-3 w-3" />
          Density
        </span>
        <span className="rounded border border-sidebar-border/70 bg-sidebar/40 px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground/70">
          {densityLabel}
        </span>
      </button>
    </div>
  );
}
