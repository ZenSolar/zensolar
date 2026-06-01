import { ArrowUpRight } from "lucide-react";
import type { ProfileCtx } from "@/hooks/useDeasonHub";

/**
 * Renders up to 3 short follow-up chips beneath a completed assistant message.
 * Priority: model-emitted `<followups>JSON</followups>` block → heuristic
 * ruleset → generic default trio.
 */
export function SuggestedFollowups({
  text,
  ctx,
  onPick,
}: {
  text: string;
  ctx?: ProfileCtx | null;
  onPick: (q: string) => void;
}) {
  const followups = pickFollowups(text, ctx);
  if (!followups.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {followups.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onPick(q)}
          className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/5 px-2.5 py-1 text-[11px] font-medium text-foreground/90 transition-colors hover:bg-amber-500/15 hover:text-foreground"
        >
          {q}
          <ArrowUpRight className="h-2.5 w-2.5 text-amber-500" />
        </button>
      ))}
    </div>
  );
}

/** Strips any `<followups>...</followups>` block from displayable text. */
export function stripFollowupsBlock(text: string): string {
  return text.replace(/<followups>[\s\S]*?<\/followups>/g, "").trimEnd();
}

function parseFollowupsBlock(text: string): string[] | null {
  const m = text.match(/<followups>([\s\S]*?)<\/followups>/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1].trim());
    if (Array.isArray(parsed)) {
      const out = parsed
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (out.length) return out;
    }
  } catch {
    /* fall through */
  }
  return null;
}

function pickFollowups(text: string, ctx?: ProfileCtx | null): string[] {
  const model = parseFollowupsBlock(text);
  if (model) return model;

  const lower = text.toLowerCase();
  const isTX = ctx?.state_code === "TX" || !!ctx?.esid;

  if (/(utility bill|rate plan|tou|peak rate|\$\/kwh|kwh|tier)/.test(lower)) {
    return isTX
      ? ["Compare REP buyback rates", "Find peak-hour savings", "Should I switch to free nights?"]
      : ["Compare rate plans", "Find peak-hour savings", "Email my utility"];
  }
  if (/(installer|contract|\$\/w|warranty|escalator|dealer)/.test(lower)) {
    return ["Flag risky clauses", "What's a fair $/W?", "Draft an email to my installer"];
  }
  if (/(ppa|lease|loan|apr|buyout|transfer)/.test(lower)) {
    return ["Walk through buyout math", "Is my APR competitive?", "What if I sell the home?"];
  }
  if (/(powerwall|battery|state of charge|soc|backup)/.test(lower)) {
    return ["Optimize my battery schedule", "How much backup do I have?", "Pre-cool before peak?"];
  }
  if (isTX) {
    return ["What can my ESID tell us?", "Shop a better REP plan", "Explain TDU delivery charges"];
  }
  return ["Analyze my latest bill", "How can I cut my bill more?", "Am I on the right rate plan?"];
}
