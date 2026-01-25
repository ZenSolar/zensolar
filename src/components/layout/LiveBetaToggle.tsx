import { useState, useEffect } from "react";
import { Flame, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getLiveBetaMode, setLiveBetaMode } from "@/lib/tokenomics";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LiveBetaToggleProps {
  collapsed?: boolean;
}

export function LiveBetaToggle({ collapsed = false }: LiveBetaToggleProps) {
  const [isLiveBeta, setIsLiveBeta] = useState(getLiveBetaMode());

  useEffect(() => {
    const handleModeChange = (event: CustomEvent<boolean>) => {
      setIsLiveBeta(event.detail);
    };

    window.addEventListener('liveBetaModeChange', handleModeChange as EventListener);
    
    return () => {
      window.removeEventListener('liveBetaModeChange', handleModeChange as EventListener);
    };
  }, []);

  const handleToggle = (checked: boolean) => {
    setLiveBetaMode(checked);
    setIsLiveBeta(checked);
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => handleToggle(!isLiveBeta)}
            className={`flex items-center justify-center p-2 rounded-md transition-colors ${
              isLiveBeta 
                ? "bg-solar/20 text-solar hover:bg-solar/30" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {isLiveBeta ? (
              <Flame className="h-4 w-4 animate-pulse" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{isLiveBeta ? "Live Beta ON (10x)" : "Mainnet Mode"}</p>
          <p className="text-xs text-muted-foreground">Click to toggle</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
      isLiveBeta 
        ? "bg-solar/10 border border-solar/30" 
        : "bg-muted/50 border border-border"
    }`}>
      <div className="flex items-center gap-2">
        {isLiveBeta ? (
          <Flame className="h-4 w-4 text-solar animate-pulse flex-shrink-0" />
        ) : (
          <Zap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <Label 
          htmlFor="live-beta-toggle" 
          className={`text-xs font-medium cursor-pointer ${
            isLiveBeta ? "text-solar" : "text-muted-foreground"
          }`}
        >
          {isLiveBeta ? "Live Beta (10x)" : "Mainnet Mode"}
        </Label>
      </div>
      <Switch
        id="live-beta-toggle"
        checked={isLiveBeta}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-solar"
      />
    </div>
  );
}
