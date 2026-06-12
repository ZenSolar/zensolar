import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Founder-only banner that flags this page as an internal/legacy
 * investor-narrative artifact and points to the canonical SSOT at
 * /investor/pitch (rendered via <ThreeRevenueEngines />). Any numbers,
 * raise amounts, launch prices, or splits on this page are NOT the
 * source of truth — /investor/pitch is.
 *
 * Drop this near the top of any founder page that mirrors or pre-dates
 * the current investor framing.
 */
export function FounderInvestorSsotBanner({
  note,
}: {
  note?: string;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3">
      <div className="rounded-xl border border-amber-400/40 bg-amber-400/[0.06] p-3 sm:p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-amber-400 font-semibold mb-1">
            Internal · Investor SSOT lives at /investor/pitch
          </p>
          <p className="text-xs text-foreground/85 leading-relaxed">
            {note ??
              "This page is a founder-only artifact. Any raise amounts, launch prices, mint splits or tier numbers below may be stale — the canonical investor narrative is /investor/pitch."}
          </p>
          <Link
            to="/investor/pitch"
            className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-amber-400 hover:text-amber-300 font-semibold"
          >
            Open canonical pitch <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FounderInvestorSsotBanner;
