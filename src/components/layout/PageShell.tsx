import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Optional element rendered to the right of the title (e.g. a button or badge) */
  actions?: ReactNode;
  /** Sticky element rendered directly under the header — anchor nav, tab bar, etc. */
  sticky?: ReactNode;
  /** Max width of the inner container. Defaults to `4xl` for reading comfort. */
  width?: "lg" | "2xl" | "4xl" | "5xl" | "6xl";
  /** Tighten vertical padding (used inside other shells). */
  dense?: boolean;
  className?: string;
  children: ReactNode;
}

const widthMap: Record<NonNullable<PageShellProps["width"]>, string> = {
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

/**
 * Unified page shell used across all main demo routes.
 * Enforces consistent header styling, max width, and spacing so navigating
 * between pages no longer causes layout shifts or visual whiplash.
 */
export function PageShell({
  title,
  description,
  icon: Icon,
  actions,
  sticky,
  width = "4xl",
  dense = false,
  className,
  children,
}: PageShellProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("container mx-auto px-4", widthMap[width], dense ? "pt-4" : "pt-6")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-primary flex-shrink-0" aria-hidden />}
              <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </div>

      {sticky && (
        <div className="sticky top-0 z-30 mt-4 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className={cn("container mx-auto px-4", widthMap[width])}>
            {sticky}
          </div>
        </div>
      )}

      <div className={cn("container mx-auto px-4", widthMap[width], dense ? "py-4" : "py-6")}>
        {children}
      </div>
    </div>
  );
}

/**
 * Consistent section header for in-page sections (used heavily on Learn).
 */
export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <header id={id} className="scroll-mt-24 mb-6">
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-primary/80 mb-2">
          {eyebrow}
        </p>
      )}
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" aria-hidden />}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
      )}
    </header>
  );
}
