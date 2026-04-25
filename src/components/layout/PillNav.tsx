import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PillNavItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface PillNavProps<T extends string> {
  items: ReadonlyArray<PillNavItem<T>>;
  active: T;
  onSelect: (id: T) => void;
  /** Render as `<a href="#id">` instead of `<button>` (used for in-page anchor nav). */
  asAnchors?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Shared pill-style nav used by Learn (anchor scrollspy) and HelpCenter (tabs).
 *
 * - One render path → guarantees both surfaces stay visually identical.
 * - Solid background (no `backdrop-blur`) — measured perf win on mobile when
 *   placed over scrolling content (see project perf notes).
 * - Horizontal scroll auto-enabled when the row overflows the viewport.
 */
export function PillNav<T extends string>({
  items,
  active,
  onSelect,
  asAnchors = false,
  ariaLabel = "Section navigation",
  className,
}: PillNavProps<T>) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex gap-1 overflow-x-auto py-2 -mx-1 px-1 scrollbar-none",
        className
      )}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        const sharedClass = cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
