import { useState, useCallback } from 'react';
import { Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { useThemeToggle } from '@/hooks/useThemeToggle';
import { useSoundPreference } from '@/hooks/useSoundPreference';
import { cn } from '@/lib/utils';

export function DashboardTopControls() {
  const { isDark, toggle: toggleTheme } = useThemeToggle();
  const { soundEnabled, toggleSound } = useSoundPreference();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleToggleTheme = useCallback(() => {
    setIsTransitioning(true);
    // Add a brief whole-page fade transition
    document.documentElement.style.transition = 'background-color 0.4s ease, color 0.4s ease';
    document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';
    toggleTheme();
    setTimeout(() => {
      setIsTransitioning(false);
      document.documentElement.style.transition = '';
      document.body.style.transition = '';
    }, 450);
  }, [toggleTheme]);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggleSound}
        className="h-8 w-8 rounded-full flex items-center justify-center bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-200"
        aria-label={soundEnabled ? 'Mute ambient sound' : 'Enable ambient sound'}
        title={soundEnabled ? 'Sound On' : 'Sound Off'}
      >
        {soundEnabled ? (
          <Volume2 className="h-3.5 w-3.5 text-primary/80" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground/60" />
        )}
      </button>
      <button
        onClick={handleToggleTheme}
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-200",
          isTransitioning && "scale-110"
        )}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light Mode' : 'Dark Mode'}
      >
        <div className={cn(
          "transition-all duration-300",
          isTransitioning ? "rotate-180 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}>
          {isDark ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-primary/80" />
          )}
        </div>
      </button>
    </div>
  );
}
