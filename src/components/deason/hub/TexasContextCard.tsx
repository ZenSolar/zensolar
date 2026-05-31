import { MapPin, Zap, ShieldCheck } from "lucide-react";

export interface TexasContext {
  state_code: string | null;
  esid: string | null;
  utility_name: string | null;
}

/**
 * Texas-aware context strip. Renders only when the user is in TX or has an
 * ESID/REP/TDU on file. Surfaces the assumptions Deason is using so the
 * homeowner can correct them at any time.
 */
export function TexasContextCard({ ctx, onEdit }: { ctx: TexasContext; onEdit?: () => void }) {
  const isTexas = ctx.state_code === "TX" || !!ctx.esid;
  if (!isTexas) return null;

  const tdu = inferTduFromEsid(ctx.esid);
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="h-4 w-4 text-amber-500" /> Texas grid context
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-[11px] text-amber-500 hover:underline">
            Edit
          </button>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <Row label="ESID" value={ctx.esid ?? "—"} />
        <Row label="REP (retailer)" value={ctx.utility_name ?? "Add your REP"} />
        <Row label="TDU (poles & wires)" value={tdu ?? "Inferred from ESID"} />
        <Row label="Market" value="ERCOT — deregulated" />
      </dl>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-background/60 px-2.5 py-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
        <span>
          Deason assumes a deregulated ERCOT plan with separate REP energy charges and TDU delivery
          charges. Solar buyback / net-metering rules are <em>per-REP</em> (not statewide). If your
          plan or TDU is wrong, edit above so insights stay accurate.
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Zap className="h-3 w-3 text-amber-500" /> Texas-aware insights are tagged
        <span className="ml-1 rounded bg-amber-500/15 px-1 py-0.5 text-amber-500">TX</span>
        in your feed.
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </>
  );
}

/** Rough TDU inference from ESID prefix. Texas ESIDs are 17 or 22 digits;
 *  the leading digits identify the TDU. Source: PUCT public ESID schema. */
function inferTduFromEsid(esid: string | null): string | null {
  if (!esid) return null;
  const digits = esid.replace(/\D/g, "");
  if (digits.length < 5) return null;
  const p = digits.slice(0, 5);
  if (p.startsWith("1008901")) return "Oncor";
  if (p.startsWith("10089")) return "Oncor";
  if (p.startsWith("10204")) return "CenterPoint";
  if (p.startsWith("1044372")) return "AEP Texas Central";
  if (p.startsWith("10404")) return "AEP Texas North";
  if (p.startsWith("1017699")) return "TNMP";
  return null;
}
