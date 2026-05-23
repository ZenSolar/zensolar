import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck } from "lucide-react";
import { getSourceMeta } from "@/lib/energySources";
import { cn } from "@/lib/utils";

interface SourceBadgesProps {
  providers: string[];
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Pass E · #3 — compact "verified by" badge cluster for Energy Log rows.
 * Hover any badge to see what proof / API backs that data source.
 */
export function SourceBadges({ providers, size = "xs", className }: SourceBadgesProps) {
  if (!providers?.length) return null;

  // Dedupe + cap visible badges; overflow shown as "+N"
  const unique = Array.from(new Set(providers));
  const visible = unique.slice(0, 2);
  const overflow = unique.length - visible.length;

  const iconCls = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  const padCls = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("inline-flex items-center gap-1", className)}>
        {visible.map((p) => {
          const meta = getSourceMeta(p);
          const Icon = meta.icon;
          return (
            <Tooltip key={p}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full ring-1 font-medium tabular-nums",
                    padCls,
                    meta.className,
                  )}
                >
                  <Icon className={iconCls} aria-hidden />
                  <span className="hidden sm:inline">{meta.label}</span>
                  <ShieldCheck className={cn(iconCls, "opacity-70")} aria-hidden />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[220px]">
                <p className="font-semibold mb-0.5">Verified by {meta.label}</p>
                <p className="text-muted-foreground">{meta.verification}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {overflow > 0 && (
          <span className={cn("inline-flex items-center rounded-full ring-1 ring-border bg-muted/40 text-muted-foreground font-medium", padCls)}>
            +{overflow}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
