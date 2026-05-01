import { Shield, TrendingUp, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SatoshiMirrorFloorCardProps {
  /** Current EIA national avg residential $/kWh. Defaults to a recent value. */
  eiaKwhRate?: number;
  /** Current epoch (0 = pre-first-halving). */
  epoch?: number;
  /** Compact rendering for dashboard grids. */
  compact?: boolean;
}

/**
 * Explains the Satoshi-Mirror floor mechanism on the user dashboard.
 * Floor formula: EIA $/kWh × 2^epoch. Defended by treasury auto-buyback.
 */
export function SatoshiMirrorFloorCard({
  eiaKwhRate = 0.16,
  epoch = 0,
  compact = false,
}: SatoshiMirrorFloorCardProps) {
  const floor = eiaKwhRate * Math.pow(2, epoch);

  return (
    <TooltipProvider>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className={compact ? "pb-2" : undefined}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Guaranteed floor</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">Satoshi-Mirror</Badge>
          </div>
          {!compact && (
            <CardDescription>
              The lowest price $ZSOLAR can fall to — anchored to the real cost of electricity.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">${floor.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">per $ZSOLAR</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Floor = EIA national avg ${eiaKwhRate.toFixed(2)}/kWh × 2<sup>{epoch}</sup>{" "}
                  (current epoch). Doubles after each Genesis Halving.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {!compact && (
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <p>
                  <strong className="text-foreground">Rises with electricity prices.</strong>{" "}
                  Updated monthly from official U.S. EIA data.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p>
                  <strong className="text-foreground">Defended automatically.</strong>{" "}
                  If the market price hits the floor, the treasury buys back $ZSOLAR until
                  it recovers — no rented liquidity, no rug risk.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default SatoshiMirrorFloorCard;
