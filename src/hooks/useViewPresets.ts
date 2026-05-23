import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ViewPreset<F = Record<string, unknown>> {
  id: string;
  name: string;
  filters: F;
  is_default: boolean;
  created_at: string;
}

/**
 * Pass D · #4 — saved view presets per page.
 *
 * Each page passes its own `viewKey` (e.g. "energy-log") and the shape of
 * filters it cares about. Presets persist to `public.user_view_presets`
 * with RLS keyed to auth.uid().
 */
export function useViewPresets<F extends Record<string, unknown>>(viewKey: string) {
  const [presets, setPresets] = useState<ViewPreset<F>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_view_presets")
        .select("id, name, filters, is_default, created_at")
        .eq("view_key", viewKey)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPresets((data ?? []) as ViewPreset<F>[]);
    } catch (err) {
      console.error("[useViewPresets] load failed:", err);
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  }, [viewKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const savePreset = useCallback(
    async (name: string, filters: F): Promise<ViewPreset<F> | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to save views");
      const payload = {
        user_id: user.id,
        view_key: viewKey,
        name: name.trim(),
        filters: filters as unknown as Record<string, unknown>,
      };
      const { data, error } = await supabase
        .from("user_view_presets")
        .upsert([payload], { onConflict: "user_id,view_key,name" })
        .select("id, name, filters, is_default, created_at")
        .single();
      if (error) throw error;
      await refresh();
      return data as ViewPreset<F>;
    },
    [viewKey, refresh],
  );

  const deletePreset = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("user_view_presets").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  return { presets, isLoading, savePreset, deletePreset, refresh };
}
