import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DeasonThread {
  id: string;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

/** Sort: pinned first, then most-recent updated. */
function sortThreads(list: DeasonThread[]): DeasonThread[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updated_at.localeCompare(a.updated_at);
  });
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
      .select("id,title,pinned,created_at,updated_at")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
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
        .select("id,title,pinned,created_at,updated_at")
        .single();
      if (error || !data) return null;
      setThreads((prev) => sortThreads([data as DeasonThread, ...prev]));
      return data as DeasonThread;
    },
    [user]
  );

  const renameThread = useCallback(async (id: string, title: string) => {
    const trimmed = title.trim().slice(0, 80) || "Untitled";
    const { error } = await supabase.from("deason_threads").update({ title: trimmed }).eq("id", id);
    if (!error) {
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t)));
    }
    return !error;
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const current = (await supabase
      .from("deason_threads")
      .select("pinned")
      .eq("id", id)
      .single()).data?.pinned ?? false;
    const next = !current;
    const { error } = await supabase.from("deason_threads").update({ pinned: next }).eq("id", id);
    if (!error) {
      setThreads((prev) => sortThreads(prev.map((t) => (t.id === id ? { ...t, pinned: next } : t))));
    }
  }, []);

  const deleteThread = useCallback(async (id: string) => {
    // FK has ON DELETE CASCADE; deleting the thread cleans up messages.
    const { error } = await supabase.from("deason_threads").delete().eq("id", id);
    if (!error) setThreads((prev) => prev.filter((t) => t.id !== id));
    return !error;
  }, []);

  const touchThread = useCallback((id: string) => {
    setThreads((prev) =>
      sortThreads(
        prev.map((t) => (t.id === id ? { ...t, updated_at: new Date().toISOString() } : t))
      )
    );
  }, []);

  return { threads, loading, refresh, createThread, renameThread, deleteThread, togglePin, touchThread };
}
