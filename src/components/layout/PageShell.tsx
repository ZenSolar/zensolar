import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
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
  width?: "lg" | "2xl" | "4xl" | "5xl" | "6xl" | "7xl";
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
  "7xl": "max-w-7xl",
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
        <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-40 mt-4 border-b border-border/60 bg-background shadow-[0_1px_0_0_hsl(var(--border)/0.4)]">
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
    <header id={id} className="scroll-mt-28 mb-6">
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

/* -------------------------------------------------------------------------- */
/*  Shared section navigation                                                  */
/* -------------------------------------------------------------------------- */

export interface PageSectionNavItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

export function PageSectionNav<T extends string>({
  items,
  active,
  onSelect,
  asAnchors = false,
  ariaLabel = "Section navigation",
  className,
}: {
  items: ReadonlyArray<PageSectionNavItem<T>>;
  active: T;
  onSelect: (id: T) => void;
  asAnchors?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn("flex gap-1 overflow-x-auto py-2 -mx-1 px-1 scrollbar-hide", className)}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        const sharedClass = cn(
          "inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        );
        const inner = (
          <>
            {item.icon && <item.icon className="h-3.5 w-3.5" aria-hidden />}
            {item.label}
          </>
        );

        if (asAnchors) {
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                onSelect(item.id);
              }}
              className={sharedClass}
            >
              {inner}
            </a>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-pressed={isActive}
            className={sharedClass}
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared anchor / scrollspy behaviour                                       */
/*  Single source of truth so Learn + any future hub stay identical.          */
/* -------------------------------------------------------------------------- */

/**
 * Track which section is currently in view. Returns the active id.
 *
 * - Single IntersectionObserver, single threshold → cheap on mobile.
 * - rootMargin biased so the active pill flips at ~40% from the top, which
 *   feels natural while scrolling and avoids flicker between adjacent
 *   sections during fast flicks on iOS Safari.
 */
export function useSectionScrollSpy<T extends string>(
  ids: ReadonlyArray<T>,
  initial: T,
): T {
  const [active, setActive] = useState<T>(initial);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const probeLine = 128;
      const current = ids.reduce<T>((best, id) => {
        const el = document.getElementById(id);
        if (!el) return best;
        return el.getBoundingClientRect().top <= probeLine ? id : best;
      }, initial);
      setActive(current);
    };
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
    };
  }, [ids]);

  return active;
}

/** Smooth-scroll to a section, accounting for the fixed top bar + sticky pill nav. */
export function jumpToSection(id: string, offset = 128) {
  const el = document.getElementById(id);
  if (!el) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
  el.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
  window.setTimeout(() => {
    const top = el.getBoundingClientRect().top;
    if (Math.abs(top - offset) > 12) {
      window.scrollBy({ top: top - offset, behavior: "auto" });
    }
  }, reducedMotion ? 0 : 260);
}

export function useSectionNavigation<T extends string>(
  items: ReadonlyArray<PageSectionNavItem<T>>,
  initial: T,
  offset = 128,
) {
  const ids = useMemo(() => items.map((item) => item.id) as T[], [items]);
  const active = useSectionScrollSpy<T>(ids, initial);
  const select = useCallback((id: T) => jumpToSection(id, offset), [offset]);
  useDeepLinkSection(ids, select);
  return { active, select };
}

/**
 * On mount: if the URL contains `#section-id` or `?section=id`, jump there.
 * Used by Learn so deep-links from the sidebar / footer always land correctly
 * even when content is lazy-rendered behind `content-visibility: auto`.
 */
export function useDeepLinkSection(validIds: ReadonlyArray<string>, onMatch: (id: string) => void) {
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "");
    const fromQuery = new URLSearchParams(window.location.search).get("section") ?? "";
    const fromLegacyTab = new URLSearchParams(window.location.search).get("tab") ?? "";
    const target = [fromHash, fromQuery, fromLegacyTab].find((v) => v && validIds.includes(v));
    if (!target) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => onMatch(target));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
