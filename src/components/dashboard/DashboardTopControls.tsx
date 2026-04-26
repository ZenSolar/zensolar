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
    // Smooth whole-page crossfade for theme switch
    const allEls = 'background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease';
    document.documentElement.style.transition = allEls;
    document.body.style.transition = allEls;
    // Apply a brief opacity dip on the root for a cinematic feel
    const root = document.getElementById('root');
    if (root) {
      root.style.transition = 'opacity 0.25s ease';
      root.style.opacity = '0.85';
    }
    toggleTheme();
    setTimeout(() => {
      if (root) { root.style.opacity = '1'; }
    }, 150);
    setTimeout(() => {
      setIsTransitioning(false);
      document.documentElement.style.transition = '';
      document.body.style.transition = '';
      if (root) { root.style.transition = ''; }
    }, 550);
  }, [toggleTheme]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleSound}
        className="h-9 w-9 rounded-full flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border/60 hover:bg-card shadow-sm transition-all duration-200"
        aria-label={soundEnabled ? 'Mute ambient sound' : 'Enable ambient sound'}
        title={soundEnabled ? 'Sound On' : 'Sound Off'}
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4 text-primary" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <button
        onClick={handleToggleTheme}
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border/60 hover:bg-card shadow-sm transition-all duration-200",
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
            <Sun className="h-4 w-4 text-warning" />
          ) : (
            <Moon className="h-4 w-4 text-foreground/70" />
          )}
        </div>
      </button>
    </div>
  );
}
