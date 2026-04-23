import { cn } from "@/lib/utils";

interface BrandedSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

/**
 * Branded loading spinner — emerald primary ring, transparent top.
 * Replaces lucide `Loader2` for app-wide consistency with the sidebar accent system.
 */
export function BrandedSpinner({ size = "md", className, label }: BrandedSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className={cn(
        "inline-block animate-spin rounded-full border-primary/30 border-t-primary",
        SIZES[size],
        className,
      )}
    />
  );
}
