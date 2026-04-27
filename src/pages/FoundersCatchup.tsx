import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Coffee,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Map as MapIcon,
  ScrollText,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";
import { toast } from "@/hooks/use-toast";

/**
 * /founders/catchup — Michael's async briefing room.
 *
 * Three jobs:
 *   1. Show what's new since his last visit (daily roll-up cadence)
 *   2. Surface decisions pending his input (👍 / 👎 / comment)
 *   3. Link out to the deeper sources of truth (changelog, master outline)
 */

interface DailyRollup {
  date: string;          // human readable (e.g. "April 27, 2026")
  iso: string;           // sortable
  highlights: string[];  // 3–6 bullets
  shipped?: string[];    // optional concrete deploys
  decisions?: string[];  // strategic locks
  links?: { label: string; url: string }[];
}

interface PendingDecision {
  id: string;
  title: string;
  context: string;
  options: string[];
  recommendation: string | null;
  status: string;
  created_at: string;
}

interface VoteRow {
  decision_id: string;
  user_id: string;
  vote: "up" | "down" | "abstain";
  choice: string | null;
  comment: string | null;
}

// ============ DAILY ROLL-UPS (newest first) ============
// New rule: one entry per DAY, not per session. Roll up the day's work.
const ROLLUPS: DailyRollup[] = [
  {
    date: "April 27, 2026",
    iso: "2026-04-27",
    highlights: [
      "Built /founders/catchup — Michael's async briefing room with diff-since-last-visit, daily roll-ups, and a pending-decisions block he can vote on.",
      "Floor-price projection ($0.10 → ~$10 at 1M users) now live across Lyndon V2, /transparency, and the in-app Home subscription panel.",
      "Documented the Emissions Wallet — treasury sponsors all user mint gas (zero out-of-pocket for users).",
    ],
    shipped: [
      "/founders/catchup (this page)",
      "Subscription Transparency Panel — Floor column + 'Floor @ 1M' stat",
      "founder_decisions + founder_decision_votes tables (RLS gated)",
    ],
    decisions: [
      "Cadence change: changelog rolls up DAILY, not per-session.",
      "Bitcoin-style halving deferred — floor-price math first.",
      "Subscriber income panel rejected as too speculative.",
    ],
    links: [
      { label: "Subscription Transparency", url: "https://beta.zen.solar/transparency" },
      { label: "Lyndon Pitch V2", url: "https://beta.zen.solar/founders/lyndon-pitch-v2" },
    ],
  },
  {
    date: "April 24, 2026",
    iso: "2026-04-24",
    highlights: [
      "Wallbox confirmed as 3rd verified-live OEM (Tesla, Enphase, Wallbox ✅ · SolarEdge ⏳).",
      "Proof-of-Genesis receipt: EV math fixed (1 token/mile), context-aware CO₂, vs-PoW comparison chip.",
    ],
    shipped: ["Updated Proof-of-Genesis receipt preview"],
    links: [
      { label: "Receipt preview", url: "https://beta.zen.solar/proof-of-genesis-receipt-preview" },
    ],
  },
];

const LAST_VISIT_KEY = "zen.catchup-last-visit";

function getLastVisit(userId: string | undefined): string | null {
  if (!userId || typeof window === "undefined") return null;
  try { return localStorage.getItem(`${LAST_VISIT_KEY}:${userId}`); } catch { return null; }
}
function setLastVisit(userId: string | undefined, iso: string) {
  if (!userId || typeof window === "undefined") return;
  try { localStorage.setItem(`${LAST_VISIT_KEY}:${userId}`, iso); } catch { /* ignore */ }
}

function FoundersCatchupInner() {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<PendingDecision[]>([]);
  const [votes, setVotes] = useState<Record<string, VoteRow>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lastVisitISO] = useState<string | null>(() => getLastVisit(user?.id));

  // Stamp visit on mount (so the NEXT visit shows the diff since now)
  useEffect(() => {
    if (user?.id) setLastVisit(user.id, new Date().toISOString());
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: dRows }, { data: vRows }] = await Promise.all([
        supabase
          .from("founder_decisions")
          .select("id,title,context,options,recommendation,status,created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("founder_decision_votes")
          .select("decision_id,user_id,vote,choice,comment")
          .eq("user_id", user?.id ?? ""),
      ]);
      if (cancelled) return;
      const parsed: PendingDecision[] = (dRows ?? []).map((r: any) => ({
        ...r,
        options: Array.isArray(r.options) ? r.options : [],
      }));
      setDecisions(parsed);
      const vMap: Record<string, VoteRow> = {};
      (vRows ?? []).forEach((v: any) => { vMap[v.decision_id] = v; });
      setVotes(vMap);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const newRollups = useMemo(() => {
    if (!lastVisitISO) return ROLLUPS.slice(0, 1);
    return ROLLUPS.filter((r) => r.iso > lastVisitISO.slice(0, 10));
  }, [lastVisitISO]);

  async function castVote(decisionId: string, vote: "up" | "down", commentOverride?: string) {
    if (!user?.id) return;
    setSavingId(decisionId);
    const existing = votes[decisionId];
    const payload = {
      decision_id: decisionId,
      user_id: user.id,
      vote,
      comment: commentOverride ?? existing?.comment ?? null,
      choice: existing?.choice ?? null,
    };
    const { error } = await supabase
      .from("founder_decision_votes")
      .upsert(payload, { onConflict: "decision_id,user_id" });
    setSavingId(null);
    if (error) {
      toast({ title: "Couldn't save vote", description: error.message, variant: "destructive" });
      return;
    }
    setVotes((m) => ({ ...m, [decisionId]: payload as VoteRow }));
    toast({ title: vote === "up" ? "👍 Recorded" : "👎 Recorded" });
  }

  async function saveComment(decisionId: string, comment: string) {
    if (!user?.id) return;
    setSavingId(decisionId);
    const existing = votes[decisionId];
    const payload = {
      decision_id: decisionId,
      user_id: user.id,
      vote: existing?.vote ?? "abstain",
      choice: existing?.choice ?? null,
      comment,
    };
    const { error } = await supabase
      .from("founder_decision_votes")
      .upsert(payload, { onConflict: "decision_id,user_id" });
    setSavingId(null);
    if (error) {
      toast({ title: "Couldn't save comment", description: error.message, variant: "destructive" });
      return;
    }
    setVotes((m) => ({ ...m, [decisionId]: payload as VoteRow }));
    toast({ title: "Comment saved" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">
        {/* Header */}
        <Link
          to="/founders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Vault
        </Link>

        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Coffee className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              Catchup
            </h1>
            <p className="text-sm text-muted-foreground">
              Your async briefing room.{" "}
              {lastVisitISO ? (
                <>Last seen <span className="text-foreground/80">{new Date(lastVisitISO).toLocaleDateString()}</span>.</>
              ) : (
                <>First visit — showing the latest day.</>
              )}
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Link to="/founders/changelog" className="rounded-xl border border-border bg-card/50 p-3 text-xs hover:bg-card">
            <div className="flex items-center gap-1.5 font-medium"><ScrollText className="h-3.5 w-3.5" /> Changelog</div>
            <div className="mt-0.5 text-muted-foreground">Per-session history</div>
          </Link>
          <Link to="/founders/master-outline" className="rounded-xl border border-border bg-card/50 p-3 text-xs hover:bg-card">
            <div className="flex items-center gap-1.5 font-medium"><MapIcon className="h-3.5 w-3.5" /> Master Outline</div>
            <div className="mt-0.5 text-muted-foreground">Current state of everything</div>
          </Link>
          <Link to="/transparency" className="rounded-xl border border-border bg-card/50 p-3 text-xs hover:bg-card">
            <div className="flex items-center gap-1.5 font-medium"><Sparkles className="h-3.5 w-3.5" /> Transparency</div>
            <div className="mt-0.5 text-muted-foreground">Live floor-price model</div>
          </Link>
        </div>

        {/* Since your last visit */}
        <section className="mt-7">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {lastVisitISO ? "Since your last visit" : "Latest"}
          </h2>
          {newRollups.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
              You're all caught up. ✨ Nothing new since {new Date(lastVisitISO!).toLocaleDateString()}.
            </div>
          ) : (
            <div className="space-y-3">
              {newRollups.map((r) => (
                <article key={r.iso} className="rounded-xl border border-border bg-card/60 p-4">
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold">{r.date}</h3>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Daily roll-up</span>
                  </div>
                  <ul className="space-y-1.5 text-sm leading-relaxed text-foreground/90">
                    {r.highlights.map((h, i) => (
                      <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{h}</span></li>
                    ))}
                  </ul>
                  {r.shipped && r.shipped.length > 0 && (
                    <div className="mt-3 rounded-lg bg-primary/5 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">Shipped</div>
                      <ul className="mt-1 space-y-0.5 text-xs text-foreground/85">
                        {r.shipped.map((s, i) => <li key={i}>· {s}</li>)}
                      </ul>
                    </div>
                  )}
                  {r.decisions && r.decisions.length > 0 && (
                    <div className="mt-2 rounded-lg bg-amber-500/5 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-500/90">Decisions locked</div>
                      <ul className="mt-1 space-y-0.5 text-xs text-foreground/85">
                        {r.decisions.map((d, i) => <li key={i}>· {d}</li>)}
                      </ul>
                    </div>
                  )}
                  {r.links && r.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:bg-card"
                        >
                          {l.label} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Decisions pending */}
        <section className="mt-8">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Decisions pending your input
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : decisions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> No open decisions. You're clear.
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((d) => {
                const myVote = votes[d.id];
                return (
                  <article key={d.id} className="rounded-xl border border-border bg-card/60 p-4">
                    <h3 className="text-sm font-semibold leading-snug">{d.title}</h3>
                    <p className="mt-1 text-sm text-foreground/85 leading-relaxed">{d.context}</p>

                    {d.options.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {d.options.map((o, i) => <li key={i}>· {o}</li>)}
                      </ul>
                    )}

                    {d.recommendation && (
                      <div className="mt-3 rounded-lg bg-primary/5 p-2.5 text-xs">
                        <span className="font-semibold text-primary">Joseph's lean:</span>{" "}
                        <span className="text-foreground/85">{d.recommendation}</span>
                      </div>
                    )}

                    {/* Vote row */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => castVote(d.id, "up")}
                        disabled={savingId === d.id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          myVote?.vote === "up"
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-background hover:bg-card"
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => castVote(d.id, "down")}
                        disabled={savingId === d.id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          myVote?.vote === "down"
                            ? "border-destructive bg-destructive/15 text-destructive"
                            : "border-border bg-background hover:bg-card"
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" /> Push back
                      </button>
                      {myVote && (
                        <span className="text-[11px] text-muted-foreground">
                          Your vote saved · {new Date().toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Comment */}
                    <CommentBox
                      key={`${d.id}-${myVote?.comment ?? ""}`}
                      initial={myVote?.comment ?? ""}
                      onSave={(text) => saveComment(d.id, text)}
                      saving={savingId === d.id}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-10 text-center text-[11px] text-muted-foreground">
          Daily roll-ups · async approval · weekly Friday email nudge.
        </p>
      </div>
    </div>
  );
}

function CommentBox({
  initial,
  onSave,
  saving,
}: {
  initial: string;
  onSave: (text: string) => void;
  saving: boolean;
}) {
  const [text, setText] = useState(initial);
  const dirty = text.trim() !== initial.trim();
  return (
    <div className="mt-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment for Joseph (optional)…"
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      {dirty && (
        <button
          onClick={() => onSave(text.trim())}
          disabled={saving}
          className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
          Save comment
        </button>
      )}
    </div>
  );
}

export default function FoundersCatchup() {
  return (
    <VaultPinGate>
      <FoundersCatchupInner />
    </VaultPinGate>
  );
}
