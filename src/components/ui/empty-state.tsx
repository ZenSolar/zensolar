import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

/**
 * Polished empty state used across main pages.
 * Tighter typography, soft glow ring around the icon, optional secondary action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" aria-hidden />
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <h3 className="text-base font-semibold tracking-tight mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2">
          {action && (
            <Button onClick={action.onClick} size="sm">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} size="sm" variant="ghost">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function NoDataState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function NoResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <SearchX className="h-5 w-5 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">
        No results for <span className="text-foreground font-medium">"{query}"</span>
      </p>
    </div>
  );
}

/**
 * Standard loading skeleton for list-style pages (Mint History, Energy Logs, Referrals).
 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border/60">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Centered spinner-free pulsing block for full-page loading.
 */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg animate-pulse" />
        <div className="relative h-full w-full rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Unified card skeleton — matches the rounded-2xl, border-primary/15, bg-card/80
 * vertical rhythm used across Wallet, Mint History, Profile, and Referrals.
 */
export function PageCardSkeleton({
  rows = 4,
  showHeader = true,
  showGrid = false,
  className,
}: {
  rows?: number;
  showHeader?: boolean;
  showGrid?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/15 bg-card/80 p-5 space-y-4",
        className,
      )}
      aria-label="Loading"
    >
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      )}
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-3.5 w-1/3" />
      {showGrid && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}
      <div className="space-y-2 pt-1">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Standardized full-page skeleton for settings/profile pages.
 */
export function PageSkeleton({
  variant = "default",
}: {
  variant?: "default" | "settings" | "list";
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-3.5">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      {variant === "list" ? (
        <ListSkeleton rows={5} />
      ) : variant === "settings" ? (
        <>
          <PageCardSkeleton rows={3} showGrid />
          <PageCardSkeleton rows={2} />
          <PageCardSkeleton rows={2} />
        </>
      ) : (
        <>
          <PageCardSkeleton rows={3} showGrid />
          <PageCardSkeleton rows={4} />
        </>
      )}
    </div>
  );
}

