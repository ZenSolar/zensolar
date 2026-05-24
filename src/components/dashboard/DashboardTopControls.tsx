import { Volume2, VolumeX } from 'lucide-react';
import { useSoundPreference } from '@/hooks/useSoundPreference';

/**
 * Light-mode toggle removed — ZenSolar is dark-only (Tesla-style).
 * Only the ambient sound control remains here.
 */
export function DashboardTopControls() {
  const { soundEnabled, toggleSound } = useSoundPreference();

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
    </div>
  );
}
