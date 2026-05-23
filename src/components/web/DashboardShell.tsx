import { ReactNode } from "react";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";

interface DashboardShellProps {
  children: ReactNode;
}

/**
 * Phase 1 (+ Pass A #1, Pass C #2) of the web-app upgrade.
 *
 * Mobile (< lg): pass-through — renders children exactly as before. The PWA
 * single-column flow is sacred and must not change.
 *
 * Desktop (lg+): centers content in a column with generous horizontal padding.
 *   - lg : max-w-3xl (768px → comfortable single column on laptops)
 *   - xl : max-w-5xl (1024px → wider main column on large monitors)
 *   - 2xl: max-w-6xl (1152px → use the extra real estate)
 *
 * Pass C: desktop-only breadcrumbs render above content (hidden on root).
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="w-full lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl lg:mx-auto lg:px-6 xl:px-8">
      <Breadcrumbs />
      {children}
    </div>
  );
}
