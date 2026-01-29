import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Play, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { getLiveBetaMode } from "@/lib/tokenomics";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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
          {/* Live Beta indicator for admins */}
          {!isDemo && isAdmin && isLiveBeta && (
            <Badge variant="outline" className="gap-1.5 text-xs bg-solar/10 text-solar border-solar/30">
              <Flame className="h-3 w-3 animate-pulse" />
              Beta 10x
            </Badge>
          )}
        </div>
        
        {/* Centered Logo with Beta Badge - Links to Dashboard */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 hover:opacity-80 transition-opacity flex items-center gap-2">
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            className="h-7 w-auto object-contain dark:animate-logo-glow"
          />
          <Badge 
            variant="outline" 
            className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-primary/20 to-emerald-500/20 text-primary border-primary/40 px-2 py-0.5 animate-pulse"
          >
            Beta
          </Badge>
        </Link>
        
        <ThemeToggle />
      </div>
      {/* Border below everything */}
      <div className="border-b border-border" />
    </header>
  );
}
