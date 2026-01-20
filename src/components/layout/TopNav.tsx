import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopNavProps {
  isDemo?: boolean;
  className?: string;
}

/**
 * Shared fixed header component used by both AppLayout (live) and DemoLayout (demo).
 * Uses fixed positioning so it always stays visible regardless of scroll depth.
 */
export function TopNav({ isDemo = false, className }: TopNavProps) {
  return (
    <header 
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 pt-safe border-b border-border">
        <div className="flex items-center gap-2">
          <SidebarTrigger id="zen-sidebar-trigger" className="text-foreground touch-target" />
          {isDemo && (
            <Badge variant="outline" className="gap-1.5 text-xs bg-primary/10 text-primary border-primary/20">
              <Play className="h-3 w-3" />
              Demo Mode
            </Badge>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
