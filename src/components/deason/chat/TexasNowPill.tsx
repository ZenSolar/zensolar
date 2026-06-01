import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileCtx } from "@/hooks/useDeasonHub";

/**
 * Compact single-row "Texas grid · TDU · REP" pill rendered above the chat
 * messages. Only appears when the user has TX or an ESID on file. Tap to
 * expand a small assumptions accordion (the same shape as the hub card).
 */
export function TexasNowPill({ ctx }: { ctx: ProfileCtx | null }) {
  const [open, setOpen] = useState(false);
  if (!ctx) return null;
  const isTexas = ctx.state_code === "TX" || !!ctx.esid;
  if (!isTexas) return null;

  const tdu = inferTduFromEsid(ctx.esid);

  return (
    <div className="mb-2 rounded-xl border border-amber-500/30 bg-amber-500/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-[11px]"
      >
        <span className="flex min-w-0 items-center gap-1.5 text-amber-400">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate font-medium">Texas grid</span>
          <span className="text-amber-500/60">·</span>
          <span className="truncate">{tdu ?? "TDU pending"}</span>
          <span className="text-amber-500/60">·</span>
          <span className="truncate">{ctx.utility_name ?? "Add REP"}</span>
        </span>
        <ChevronDown className={cn("h-3 w-3 text-amber-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-amber-500/20 px-2.5 py-2 text-[11px] text-muted-foreground">
          <div className="flex flex-col gap-1">
            <Row k="ESID" v={ctx.esid ?? "—"} />
            <Row k="TDU" v={tdu ?? "Inferred from ESID"} />
            <Row k="REP" v={ctx.utility_name ?? "Not set"} />
            <Row k="Market" v="ERCOT · deregulated" />
          </div>
          <p className="mt-1.5 leading-snug">
            Buyback rules are <em>per-REP</em>, not statewide. Deason ranges any number where the
            REP or TDU is missing.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate font-medium text-foreground/90">{v}</span>
    </div>
  );
}

function inferTduFromEsid(esid: string | null): string | null {
  if (!esid) return null;
  const digits = esid.replace(/\D/g, "");
  if (digits.length < 5) return null;
  if (digits.startsWith("10089")) return "Oncor";
  if (digits.startsWith("10204")) return "CenterPoint";
  if (digits.startsWith("1044372")) return "AEP Texas Central";
  if (digits.startsWith("10404")) return "AEP Texas North";
  if (digits.startsWith("1017699")) return "TNMP";
  return null;
}
