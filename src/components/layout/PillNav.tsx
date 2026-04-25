import { PageSectionNav, PageSectionNavItem } from "@/components/layout/PageShell";

export type PillNavItem<T extends string = string> = PageSectionNavItem<T>;

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
  return <PageSectionNav items={items} active={active} onSelect={onSelect} asAnchors={asAnchors} ariaLabel={ariaLabel} className={className} />;
}
