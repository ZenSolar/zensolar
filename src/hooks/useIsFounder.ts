import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isPreviewMode } from "@/lib/previewMode";

/**
 * Returns whether the current user is a founder or admin.
 * Used to gate Deason + Founders Vault UI.
 *
 * In preview mode (dev / Lovable editor / localhost) this always returns true
 * so Joseph can deep-link to founder-only pages without signing in.
 */
export function useIsFounder() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (isPreviewMode()) {
      setIsFounder(true);
      return;
    }
    if (!user) {
      setIsFounder(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set((data ?? []).map((r) => r.role));
      setIsFounder(set.has("founder") || set.has("admin"));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isFounder: !!isFounder, ready: !authLoading && isFounder !== null };
}
