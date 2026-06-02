import { cn } from "@/lib/utils";

/**
 * Cold-open skeleton for the Deason floating bubble panel. Used while we
 * prepare the saved thread so the surface never appears blank or jumps.
 */
export function BubbleSkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border/60 px-3 py-2.5">
        <div className="h-3 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="mt-1.5 h-2 w-40 animate-pulse rounded bg-muted/60 motion-reduce:animate-none" />
      </div>
      <div className="flex-1 space-y-3 overflow-hidden px-3 py-4">
        <SkeletonRow align="left" widthClass="w-3/4" />
        <SkeletonRow align="right" widthClass="w-1/2" />
        <SkeletonRow align="left" widthClass="w-5/6" />
      </div>
      <div className="border-t border-border/60 px-3 py-3">
        <div className="h-9 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}

function SkeletonRow({ align, widthClass }: { align: "left" | "right"; widthClass: string }) {
  return (
    <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "h-12 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none",
          align === "right" ? "rounded-br-md" : "rounded-bl-md",
          widthClass
        )}
      />
    </div>
  );
}
