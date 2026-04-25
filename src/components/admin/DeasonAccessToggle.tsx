import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin-only toggle to grant a user uncapped Deason ("inner-circle") access.
 * Reads/writes `public.deason_inner_circle`. RLS only allows admins to mutate.
 */
export function DeasonAccessToggle({
  userId,
  displayName,
}: {
  userId: string;
  displayName?: string | null;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("deason_inner_circle")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled) setEnabled(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = async (next: boolean) => {
    setBusy(true);
    const prev = enabled;
    setEnabled(next); // optimistic
    try {
      if (next) {
        const { error } = await supabase
          .from("deason_inner_circle")
          .insert({ user_id: userId });
        if (error) throw error;
        toast.success(`Deason inner-circle enabled for ${displayName || "user"}`);
      } else {
        const { error } = await supabase
          .from("deason_inner_circle")
          .delete()
          .eq("user_id", userId);
        if (error) throw error;
        toast.success(`Deason inner-circle removed for ${displayName || "user"}`);
      }
    } catch (e: any) {
      setEnabled(prev);
      toast.error(e?.message || "Failed to update Deason access");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <div>
          <div className="text-sm font-medium">Deason inner-circle access</div>
          <div className="text-xs text-muted-foreground">
            Uncapped messages + strategic co-pilot persona.
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {(enabled === null || busy) && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
        <Switch
          checked={!!enabled}
          disabled={enabled === null || busy}
          onCheckedChange={toggle}
          aria-label="Toggle Deason inner-circle access"
        />
      </div>
    </div>
  );
}
