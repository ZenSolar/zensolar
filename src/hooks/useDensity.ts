import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Density = "comfortable" | "compact";

const STORAGE_KEY = "zs_ui_density";

function readLocal(): Density {
  if (typeof window === "undefined") return "comfortable";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "compact" ? "compact" : "comfortable";
}

function writeLocal(d: Density) {
  try {
    localStorage.setItem(STORAGE_KEY, d);
  } catch {}
}

/**
 * Phase 4 — UI density preference.
 *
 * Persists to `profiles.ui_density` for authed users, falling back to
 * localStorage for guests / pre-auth / demo. Cross-tab sync via `storage` event.
 *
 * The current density is also written to `<html data-density="...">` so the
 * preference can drive CSS in `index.css` regardless of which subtree mounted it.
 */
export function useDensity() {
  const { user } = useAuth();
  const [density, setDensityState] = useState<Density>(readLocal);

  // Hydrate from profile when we have a user.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("ui_density")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data as any)?.ui_density as Density | undefined;
      if (remote && remote !== density) {
        setDensityState(remote);
        writeLocal(remote);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Reflect to <html> for global CSS hooks.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  // Cross-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "compact" || e.newValue === "comfortable")) {
        setDensityState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setDensity = useCallback(
    async (next: Density) => {
      setDensityState(next);
      writeLocal(next);
      if (user) {
        await supabase
          .from("profiles")
          .update({ ui_density: next })
          .eq("user_id", user.id);
      }
    },
    [user]
  );

  const toggle = useCallback(
    () => setDensity(density === "compact" ? "comfortable" : "compact"),
    [density, setDensity]
  );

  return { density, setDensity, toggle };
}
