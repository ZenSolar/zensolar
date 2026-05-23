import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { buildCrumbs } from "@/lib/routeLabels";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  className?: string;
}

/**
 * Pass C: desktop-only breadcrumbs.
 *
 * Renders on md:+ above the page content. Hidden on the dashboard root
 * (single crumb is just noise) and on mobile (sacred bottom-nav + tight
 * vertical rhythm). All segments before the last are clickable.
 */
export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname);

  // Don't render on the dashboard root or single-segment auth-style pages
  // where the page header already announces context.
  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "hidden md:flex items-center gap-1.5 text-xs text-muted-foreground px-4 lg:px-6 xl:px-8 pt-3 -mb-1",
        className,
      )}
    >
      <ol className="flex items-center gap-1.5 min-w-0">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
              )}
              {isLast ? (
                <span className="truncate text-foreground font-medium" aria-current="page">
                  {c.label}
                </span>
              ) : (
                <Link
                  to={c.href}
                  className="truncate hover:text-foreground transition-colors"
                >
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
