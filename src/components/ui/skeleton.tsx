import { cn } from "@/lib/utils";

/**
 * Polished skeleton with subtle shimmer sweep on top of the base pulse.
 * Drop-in replacement for the original — pass `plain` to disable the shimmer
 * (useful for tiny inline placeholders where the sweep looks busy).
 */
function Skeleton({
  className,
  plain = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { plain?: boolean }) {
  return (
    <div
      className={cn(
        "relative animate-pulse rounded-md bg-muted overflow-hidden",
        !plain &&
          "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.06] before:to-transparent before:animate-[shimmer-sweep_1.8s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
