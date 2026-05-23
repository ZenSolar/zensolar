import { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
}

/**
 * Phase 1 (+ Pass A #1) of the web-app upgrade.
 *
 * Mobile (< lg): pass-through — renders children exactly as before. The PWA
 * single-column flow is sacred and must not change.
 *
 * Desktop (lg+): centers content in a column with generous horizontal padding.
 *   - lg : max-w-3xl (768px → comfortable single column on laptops)
 *   - xl : max-w-5xl (1024px → wider main column on large monitors)
 *   - 2xl: max-w-6xl (1152px → use the extra real estate)
 *
 * No reflow of individual cards — just generous gutters and a column that
 * actually fills modern displays.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="w-full lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl lg:mx-auto lg:px-6 xl:px-8">
      {children}
    </div>
  );
}
