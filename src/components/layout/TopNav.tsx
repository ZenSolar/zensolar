import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { markSidebarOpened } from "@/components/layout/MenuTooltip";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { getLiveBetaMode } from "@/lib/tokenomics";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SoundToggle } from "@/components/layout/SoundToggle";
import { useAppBack } from "@/hooks/useAppHistory";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  isDemo?: boolean;
  className?: string;
}

/**
 * Shared fixed header component used by both AppLayout (live) and DemoLayout (demo).
 * Uses fixed positioning so it always stays visible regardless of scroll depth.
 */
export function TopNav({ isDemo = false, className }: TopNavProps) {
  const { isAdmin } = useAdminCheck();
  const { canGoBack, goBack } = useAppBack();
  const [isLiveBeta, setIsLiveBeta] = useState(getLiveBetaMode());

  useEffect(() => {
    const handleModeChange = (event: CustomEvent<boolean>) => {
      setIsLiveBeta(event.detail);
    };

    window.addEventListener('liveBetaModeChange', handleModeChange as EventListener);
    
    // Poll for changes in case of external updates
    const interval = setInterval(() => {
      setIsLiveBeta(getLiveBetaMode());
    }, 2000);

    return () => {
      window.removeEventListener('liveBetaModeChange', handleModeChange as EventListener);
      clearInterval(interval);
    };
  }, []);

  return (
    <header 
      data-fixed-top="true"
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-background border-b border-border",
        className
      )}
    >
      {/* pt-safe handled globally via [data-fixed-top] */}
      {/* Content row with icons */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-1 min-w-0">
          <SidebarTrigger id="zen-sidebar-trigger" className="text-foreground touch-target" onClick={() => markSidebarOpened()} />
          {/* Weather moved to the left of the logo to avoid overlap */}
          <div className="hidden min-[360px]:block max-w-[88px] sm:max-w-[140px] overflow-hidden truncate ml-1">
            <WeatherWidget />
          </div>
          {canGoBack && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goBack}
              aria-label="Go back"
              className="h-9 px-2 -ml-1 text-foreground/80 hover:text-foreground transition-transform duration-150 active:scale-95 active:bg-muted/60 motion-reduce:active:scale-100"
            >
              <ChevronLeft className="h-5 w-5 transition-transform duration-150 group-active:-translate-x-0.5" aria-hidden />
              <span className="sr-only sm:not-sr-only sm:ml-1 text-xs font-medium">Back</span>
            </Button>
          )}
        </div>
        
        {/* Centered Logo with Beta/Demo Badge underneath */}
        <Link 
          to={isDemo ? "/demo" : "/"} 
          className="absolute left-1/2 -translate-x-1/2 hover:opacity-80 transition-opacity flex flex-col items-center gap-0"
        >
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            width="84"
            height="25"
            className="h-[25px] sm:h-7 w-auto object-contain dark:brightness-150 dark:animate-logo-glow drop-shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
          />
          <span 
            className={cn(
              "relative overflow-hidden text-[6px] font-semibold uppercase tracking-[0.15em] px-1.5 py-px rounded-sm border",
              isDemo 
                ? "text-primary brightness-150 bg-primary/20 border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                : "text-primary brightness-150 bg-primary/20 border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.4)] animate-breathing-glow"
            )}
          >
            {/* Shimmer overlay */}
            <span 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
            <span className="relative">{isDemo ? "Demo" : "Beta"}</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-shrink">
          {/* Live Beta indicator for admins (hidden on very narrow screens) */}
          {!isDemo && isAdmin && isLiveBeta && (
            <Badge variant="outline" className="hidden min-[480px]:inline-flex gap-1.5 text-xs bg-solar/10 text-solar border-solar/30 whitespace-nowrap">
              <Flame className="h-3 w-3 animate-pulse" />
              Beta 10x
            </Badge>
          )}
          {!isDemo && <SoundToggle />}
          {!isDemo && <ThemeToggle />}
          {!isDemo && <NotificationBell />}
        </div>
      </div>
    </header>
  );
}
