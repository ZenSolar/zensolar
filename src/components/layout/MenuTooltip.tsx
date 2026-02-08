import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft } from "lucide-react";

const TOOLTIP_STORAGE_KEY = "zen-menu-tooltip-dismissed-v3";
const SIDEBAR_OPENED_KEY = "zen-sidebar-ever-opened";
const MENU_TRIGGER_ID = "zen-sidebar-trigger";

/**
 * Mark that the user has opened the sidebar at least once.
 * Called from SidebarTrigger interactions — keeps tooltip from returning.
 */
export function markSidebarOpened() {
  try {
    localStorage.setItem(SIDEBAR_OPENED_KEY, "true");
  } catch {
    // storage full / unavailable
  }
}

export function MenuTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem(TOOLTIP_STORAGE_KEY, "true");
    markSidebarOpened();
  }, []);

  useEffect(() => {
    // Never show again if user dismissed OR ever opened the sidebar
    const dismissed = localStorage.getItem(TOOLTIP_STORAGE_KEY);
    const everOpened = localStorage.getItem(SIDEBAR_OPENED_KEY);
    if (dismissed || everOpened) return;

    // Small delay to let the page render first
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 800);
    return () => clearTimeout(showTimer);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = document.getElementById(MENU_TRIGGER_ID);
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const left = rect.right + 16;
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? 0;
    const top = rect.top + rect.height / 2 - tooltipHeight / 2;
    setPosition({ top, left });
  }, []);

  // No auto-dismiss — tooltip stays until user taps the menu icon or X button

  // When visible, pin tooltip to the *actual* menu trigger position (works in PWA
  // standalone mode where safe-area + viewport metrics can differ).
  useEffect(() => {
    if (!isVisible) return;

    let raf1 = 0;
    let raf2 = 0;

    // Two RAFs ensures the tooltip is in the DOM and has a measurable height.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        updatePosition();
      });
    });

    const onViewportChange = () => updatePosition();

    window.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("scroll", onViewportChange);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
    };
  }, [isVisible, updatePosition]);

  // Remove immediately when the user taps the menu icon (no lingering flicker).
  useEffect(() => {
    if (!isVisible) return;
    const trigger = document.getElementById(MENU_TRIGGER_ID);
    if (!trigger) return;

    const onPointerDown = () => handleDismiss();
    trigger.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      trigger.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isVisible, handleDismiss]);

  if (!isVisible) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[60] animate-in fade-in slide-in-from-left-2 duration-300"
      style={
        position
          ? { left: position.left, top: position.top }
          : {
              left: "3.5rem",
              top: "calc(env(safe-area-inset-top, 0px) + 0.625rem)",
            }
      }
    >
      {/* Arrow pointing to the menu icon */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-primary" />

      {/* Tooltip bubble */}
      <div className="bg-primary text-primary-foreground pl-3 pr-2 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
        <ChevronLeft
          className="h-4 w-4 flex-shrink-0 animate-[bounce_1s_ease-in-out_infinite]"
          style={{ animationDirection: "alternate" }}
        />
        <span className="text-sm font-medium whitespace-nowrap">Tap for menu</span>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-primary-foreground/20 rounded-full transition-colors flex-shrink-0 ml-1"
          aria-label="Dismiss tooltip"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

