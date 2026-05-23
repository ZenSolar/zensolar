import { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
}

/**
 * Phase 1 of the web-app upgrade.
 *
 * Mobile (< lg): pass-through — renders children exactly as before. The PWA
 * single-column flow is sacred and must not change.
 *
 * Desktop (lg+): centers content in a `max-w-3xl` column with generous
 * horizontal padding. Gives the existing dashboard real web-app breathing
 * room without reflowing or restyling any individual card.
 *
 * Wraps the <main> body inside AppLayout / DemoLayout only. Sidebar, top nav
 * and bottom nav are untouched.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="w-full lg:max-w-3xl lg:mx-auto lg:px-6">
      {children}
    </div>
  );
}
