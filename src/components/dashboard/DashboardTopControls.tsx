import { Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { useThemeToggle } from '@/hooks/useThemeToggle';
import { useSoundPreference } from '@/hooks/useSoundPreference';

export function DashboardTopControls() {
  const { isDark, toggle: toggleTheme } = useThemeToggle();
  const { soundEnabled, toggleSound } = useSoundPreference();

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
        onClick={toggleTheme}
        className="h-8 w-8 rounded-full flex items-center justify-center bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-200"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light Mode' : 'Dark Mode'}
      >
        {isDark ? (
          <Sun className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-primary/80" />
        )}
      </button>
    </div>
  );
}
