import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check, AlertTriangle, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsFounder } from "@/hooks/useIsFounder";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { summarizeModel } from "@/lib/subscriptionSplitModel";

/**
 * One-click Cheetah export.
 *  - Computes the local model summary (same source as the panel above).
 *  - Sends summary to the edge function for server-side verification.
 *  - On success: copies share link to clipboard AND triggers download.
 *  - Visible to founders/admins only.
 */
export function CheetahExportButton() {
  const { isFounder } = useIsFounder();
  const { isAdmin } = useAdminCheck();
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");

  if (!isFounder && !isAdmin) return null;

  const handleExport = async () => {
    setState("loading");
    try {
      const clientSummary = summarizeModel();
      const { data, error } = await supabase.functions.invoke("cheetah-export", {
        body: { clientSummary },
      });

      if (error) throw new Error(error.message);
      if (!data?.ok) {
        if (data?.error === "verification_failed") {
          toast({
            title: "Export blocked — verification failed",
            description:
              "Numbers in this build don't match the canonical model. " +
              (data.issues?.[0] ?? "See console for details."),
            variant: "destructive",
          });
          // eslint-disable-next-line no-console
          console.warn("[cheetah-export] verification mismatch", data);
          setState("err");
          return;
        }
        throw new Error(data?.error ?? "unknown");
      }

      // Success: copy + download
      const url: string = data.shareUrl;
      try {
        await navigator.clipboard.writeText(url);
      } catch { /* clipboard may fail in some embeds */ }

      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast({
        title: "PDF exported & link copied",
        description: "Shareable link is in your clipboard. Download started.",
      });
      setState("ok");
      setTimeout(() => setState("idle"), 2400);
    } catch (e) {
      toast({
        title: "Export failed",
        description: String(e instanceof Error ? e.message : e),
        variant: "destructive",
      });
      setState("err");
      setTimeout(() => setState("idle"), 2400);
    }
  };

  const Icon =
    state === "loading" ? Loader2 :
    state === "ok"      ? Check   :
    state === "err"     ? AlertTriangle : Download;

  return (
    <div className="flex items-center justify-center mt-4 gap-2">
      <Button
        onClick={handleExport}
        disabled={state === "loading"}
        size="sm"
        variant="outline"
        className="gap-2 border-eco/40 text-eco hover:bg-eco/10 hover:text-eco"
      >
        <Icon className={`h-3.5 w-3.5 ${state === "loading" ? "animate-spin" : ""}`} />
        {state === "loading" ? "Verifying & generating…"
          : state === "ok"   ? "Link copied · downloading"
          : state === "err"  ? "Try again"
          : "Export PDF for Cheetah"}
      </Button>
      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Link2 className="h-3 w-3" /> shareable link + download
      </span>
    </div>
  );
}
