import { useState, useEffect } from "react";
import { X, ChevronLeft } from "lucide-react";

const TOOLTIP_STORAGE_KEY = "zen-menu-tooltip-dismissed";

export function MenuTooltip() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the tooltip
    const dismissed = localStorage.getItem(TOOLTIP_STORAGE_KEY);
    if (!dismissed) {
      // Small delay to let the page render first
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(showTimer);
    }
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (isVisible) {
      const autoDismissTimer = setTimeout(() => {
        handleDismiss();
      }, 6000);
      return () => clearTimeout(autoDismissTimer);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(TOOLTIP_STORAGE_KEY, "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed left-14 z-[60] animate-in fade-in slide-in-from-left-2 duration-300" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.625rem)' }}>
      {/* Arrow pointing to the menu icon */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-primary" />
      
      {/* Tooltip bubble */}
      <div className="bg-primary text-primary-foreground pl-3 pr-2 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
        <ChevronLeft className="h-4 w-4 flex-shrink-0 animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDirection: 'alternate' }} />
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
