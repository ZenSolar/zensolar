/**
 * NewLocationPrompt — Phase B friendly banner.
 *
 * Surfaces once per unfamiliar charging lat/lon (rounded to ~11 m) with
 * three calm choices: set as primary Home, mark as Temporary stay, or
 * ignore (kWh still credits as "AC away"). Calm by default: no sound, no
 * haptic, animates in with a gentle fade/slide.
 */
import { useState } from 'react';
import { MapPin, Sparkles, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNewLocationPrompt } from '@/hooks/useNewLocationPrompt';
import { useAddHomeLocation } from '@/hooks/useHomeLocations';

function shortCoords(lat: number, lon: number) {
  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}

function defaultLabelForCoords(lat: number, lon: number) {
  // No reverse-geocode here (no extra deps). Show coords as the default name;
  // the user can rename in Profile → Home Addresses.
  return `New home (${shortCoords(lat, lon)})`;
}

export function NewLocationPrompt() {
  const { data: candidate, dismissFingerprint, isLoading } = useNewLocationPrompt();
  const addHome = useAddHomeLocation();
  const [busy, setBusy] = useState<null | 'home' | 'temp'>(null);

  if (isLoading || !candidate) return null;

  const handleSetHome = async () => {
    setBusy('home');
    try {
      await addHome.mutateAsync({
        label: defaultLabelForCoords(candidate.lat, candidate.lon),
        lat: candidate.lat,
        lon: candidate.lon,
        setPrimary: true,
      });
      toast.success('Saved as your primary Home');
      dismissFingerprint(candidate.fingerprint);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(null);
    }
  };

  const handleTemp = async () => {
    setBusy('temp');
    try {
      await addHome.mutateAsync({
        label: `Temporary stay (${shortCoords(candidate.lat, candidate.lon)})`,
        lat: candidate.lat,
        lon: candidate.lon,
        setPrimary: false,
      });
      toast.success('Saved as a temporary stay');
      dismissFingerprint(candidate.fingerprint);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(null);
    }
  };

  const handleIgnore = () => {
    dismissFingerprint(candidate.fingerprint);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-1 mb-3 rounded-xl border border-border/40 bg-card/70 px-3 py-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-1 duration-500"
    >
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium leading-snug text-foreground">
            New charging location detected
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="tabular-nums">{shortCoords(candidate.lat, candidate.lon)}</span>
            <span aria-hidden="true">·</span>
            <span>kWh is already counting</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleIgnore}
          aria-label="Dismiss"
          className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={handleSetHome}
          disabled={!!busy}
          className="flex items-center justify-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-2 text-[11px] font-medium text-foreground transition hover:bg-primary/15 disabled:opacity-50"
        >
          {busy === 'home' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Yes — Set as Home
        </button>
        <button
          type="button"
          onClick={handleTemp}
          disabled={!!busy}
          className="flex items-center justify-center gap-1 rounded-md border border-border/60 bg-card/60 px-2 py-2 text-[11px] font-medium text-foreground/90 transition hover:bg-card disabled:opacity-50"
        >
          {busy === 'temp' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Temporary stay
        </button>
        <button
          type="button"
          onClick={handleIgnore}
          className="flex items-center justify-center rounded-md border border-border/40 bg-transparent px-2 py-2 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          AC away, ignore
        </button>
      </div>
    </div>
  );
}
