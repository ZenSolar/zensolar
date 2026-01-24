import { useState, useEffect } from "react";
import { Flame, Zap } from "lucide-react";
import { getLiveBetaMode } from "@/lib/tokenomics";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LiveBetaIndicatorProps {
  collapsed?: boolean;
}

export function LiveBetaIndicator({ collapsed = false }: LiveBetaIndicatorProps) {
  const [isLiveBeta, setIsLiveBeta] = useState(getLiveBetaMode());

  useEffect(() => {
    const handleModeChange = (event: CustomEvent<boolean>) => {
      setIsLiveBeta(event.detail);
    };

    window.addEventListener('liveBetaModeChange', handleModeChange as EventListener);
    
    // Also poll localStorage in case of external changes
    const interval = setInterval(() => {
      setIsLiveBeta(getLiveBetaMode());
    }, 2000);

    return () => {
      window.removeEventListener('liveBetaModeChange', handleModeChange as EventListener);
      clearInterval(interval);
    };
  }, []);

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center justify-center p-2 rounded-md ${
            isLiveBeta 
              ? "bg-solar/20 text-solar" 
              : "bg-muted text-muted-foreground"
          }`}>
            {isLiveBeta ? (
              <Flame className="h-4 w-4 animate-pulse" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{isLiveBeta ? "Live Beta (10x)" : "Mainnet Mode"}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isLiveBeta 
        ? "bg-solar/10 border border-solar/30" 
        : "bg-muted/50 border border-muted"
    }`}>
      {isLiveBeta ? (
        <>
          <Flame className="h-4 w-4 text-solar animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-solar">Live Beta</span>
            <span className="text-[10px] text-solar/70">10x rewards active</span>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] border-solar/50 text-solar">
            TEST
          </Badge>
        </>
      ) : (
        <>
          <Zap className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">Mainnet Mode</span>
            <span className="text-[10px] text-muted-foreground/70">1x rewards</span>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px]">
            PROD
          </Badge>
        </>
      )}
    </div>
  );
}
