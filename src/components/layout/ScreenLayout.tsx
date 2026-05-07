import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppBack } from "@/hooks/useAppHistory";
import { Button } from "@/components/ui/button";

interface ScreenLayoutProps {
  /** Centered title in the header. Optional — pass null for a chromeless header (back-only). */
  title?: ReactNode;
  /** Optional element rendered on the right side of the header. */
  rightSlot?: ReactNode;
  /** Override back behavior. Defaults to useAppBack(). */
  onBack?: () => void;
  /** Force-hide the back button even when history exists. */
  hideBack?: boolean;
  /** Show bottom padding so content clears the fixed bottom nav. Default: true. */
  withBottomNavPadding?: boolean;
  /** Extra class on the <main> region. */
  className?: string;
  children: ReactNode;
}

/**
 * ScreenLayout — Master screen wrapper.
 *
 * Enforces global rules for every standalone screen:
 *  1. Top safe-area padding so nothing collides with the Dynamic Island/notch.
 *  2. Consistent header: ← Back (auto from history) · centered title · right slot.
 *  3. Bottom safe-area padding so content never hides under the home indicator
 *     or the fixed bottom nav.
 *
 * Use this for any page that does NOT already render inside <AppLayout>
 * (which provides its own TopNav). Pages inside AppLayout already get
 * safe-area + back button via TopNav.
 */
export function ScreenLayout({
  title,
  rightSlot,
  onBack,
  hideBack = false,
  withBottomNavPadding = true,
  className,
  children,
}: ScreenLayoutProps) {
  const navigate = useNavigate();
  const { canGoBack, goBack } = useAppBack();

  const handleBack = () => {
    if (onBack) return onBack();
    if (canGoBack) return goBack();
    navigate("/");
  };

  const showBack = !hideBack && (canGoBack || !!onBack);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-background flex flex-col">
      {/* Fixed header — safe-area aware */}
      <header
        className="fixed inset-x-0 top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="relative flex h-14 items-center px-2">
          <div className="flex items-center min-w-0 flex-1">
            {showBack && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                aria-label="Go back"
                className="h-9 px-2 text-foreground/80 hover:text-foreground active:scale-95 transition-transform"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
                <span className="sr-only sm:not-sr-only sm:ml-1 text-xs font-medium">
                  Back
                </span>
              </Button>
            )}
          </div>

          {title && (
            <h1 className="absolute left-1/2 -translate-x-1/2 max-w-[60%] truncate text-sm sm:text-base font-semibold text-foreground text-center">
              {title}
            </h1>
          )}

          <div className="flex items-center justify-end min-w-0 flex-1">
            {rightSlot}
          </div>
        </div>
      </header>

      {/* Content — offset for fixed header (header height + top safe area) */}
      <main
        className={cn(
          "flex-1 w-full",
          withBottomNavPadding ? "pb-bottom-nav" : "pb-safe",
          className,
        )}
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default ScreenLayout;
