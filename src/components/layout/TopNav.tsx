import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";

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
      {/* Safe area spacer for PWA/notch */}
      <div className="pt-safe" />
      {/* Content row with icons */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger id="zen-sidebar-trigger" className="text-foreground touch-target" />
          {isDemo && (
            <Badge variant="outline" className="gap-1.5 text-xs bg-primary/10 text-primary border-primary/20">
              <Play className="h-3 w-3" />
              Demo Mode
            </Badge>
          )}
        </div>
        
        {/* Centered Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            className="h-7 w-auto object-contain dark:animate-logo-glow"
          />
        </div>
        
        <ThemeToggle />
      </div>
      {/* Border below everything */}
      <div className="border-b border-border" />
    </header>
  );
}
