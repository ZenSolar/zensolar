import { useState, useEffect } from "react";
import { X } from "lucide-react";

const TOOLTIP_STORAGE_KEY = "zen-menu-tooltip-dismissed";

export function MenuTooltip() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the tooltip
    const dismissed = localStorage.getItem(TOOLTIP_STORAGE_KEY);
    if (!dismissed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(TOOLTIP_STORAGE_KEY, "true");
  };

  if (!isVisible) return null;

  return (
    <div className="absolute left-12 top-2 z-[60] animate-in fade-in slide-in-from-left-2 duration-300">
      {/* Arrow pointing to the menu icon */}
      <div className="absolute -left-2 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-primary" />
      
      {/* Tooltip bubble */}
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 max-w-[180px]">
        <span className="text-sm font-medium">Tap here for menu</span>
        <button
          onClick={handleDismiss}
          className="p-0.5 hover:bg-primary-foreground/20 rounded transition-colors flex-shrink-0"
          aria-label="Dismiss tooltip"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
