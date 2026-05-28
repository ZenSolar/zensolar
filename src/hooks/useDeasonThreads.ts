import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DeasonThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/** List + manage the current user's saved Deason conversations. */
export function useDeasonThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<DeasonThread[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("deason_threads")
      .select("id,title,created_at,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (!error && data) setThreads(data as DeasonThread[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createThread = useCallback(
    async (title = "New conversation"): Promise<DeasonThread | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("deason_threads")
        .insert({ user_id: user.id, title })
        .select("id,title,created_at,updated_at")
        .single();
      if (error || !data) return null;
      setThreads((prev) => [data as DeasonThread, ...prev]);
      return data as DeasonThread;
    },
    [user]
  );

  const renameThread = useCallback(async (id: string, title: string) => {
    const { error } = await supabase.from("deason_threads").update({ title }).eq("id", id);
    if (!error) {
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    }
  }, []);

  const deleteThread = useCallback(async (id: string) => {
    const { error } = await supabase.from("deason_threads").delete().eq("id", id);
    if (!error) setThreads((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const touchThread = useCallback((id: string) => {
    setThreads((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const updated = { ...prev[idx], updated_at: new Date().toISOString() };
      return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, []);

  return { threads, loading, refresh, createThread, renameThread, deleteThread, touchThread };
}
