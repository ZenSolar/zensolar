import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Play, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { markSidebarOpened } from "@/components/layout/MenuTooltip";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { getLiveBetaMode } from "@/lib/tokenomics";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";

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
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-background border-b border-border",
        className
      )}
    >
      {/* Safe area spacer for PWA/notch */}
      <div className="pt-safe" />
      {/* Content row with icons */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger id="zen-sidebar-trigger" className="text-foreground touch-target" onClick={() => markSidebarOpened()} />
          {isDemo && (
            <Badge variant="outline" className="gap-1.5 text-xs bg-primary/10 text-primary border-primary/20">
              <Play className="h-3 w-3" />
              Demo Mode
            </Badge>
          )}
          {/* Live Beta indicator for admins */}
          {!isDemo && isAdmin && isLiveBeta && (
            <Badge variant="outline" className="gap-1.5 text-xs bg-solar/10 text-solar border-solar/30">
              <Flame className="h-3 w-3 animate-pulse" />
              Beta 10x
            </Badge>
          )}
        </div>
        
        {/* Centered Logo with Beta Badge underneath - Links to Dashboard */}
        <Link 
          to="/" 
          className="absolute left-1/2 -translate-x-1/2 hover:opacity-80 transition-opacity flex flex-col items-center gap-0"
        >
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            width="94"
            height="28"
            className="h-7 w-auto object-contain brightness-125 dark:brightness-150 dark:animate-logo-glow drop-shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
          />
          <span 
            className="relative overflow-hidden text-[6px] font-semibold uppercase tracking-[0.15em] text-primary brightness-150 bg-primary/20 px-1.5 py-px rounded-sm border border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.4)] animate-breathing-glow"
          >
            {/* Shimmer overlay */}
            <span 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
            <span className="relative">Beta</span>
          </span>
        </Link>
        
        <div className="flex items-center max-w-[120px] sm:max-w-none overflow-hidden">
          <WeatherWidget />
        </div>
      </div>
    </header>
  );
}
