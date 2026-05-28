import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, Calendar, Zap, Leaf } from 'lucide-react';
import { toast } from 'sonner';

interface WeeklyNarrative {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  narrative_md: string;
  teaser: string | null;
  data_snapshot: any;
  generated_at: string;
}

/**
 * Minimal markdown renderer for narrative prose.
 * Supports: paragraphs, **bold**, *italic*. No headings or lists by design —
 * Deason writes flowing prose only (see SYSTEM_PROMPT).
 */
function renderInline(text: string) {
  // Split on bold/italic markers, preserve them
  const parts: Array<{ type: 'text' | 'bold' | 'italic'; value: string }> = [];
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end > -1) {
        parts.push({ type: 'bold', value: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '*' && text[i - 1] !== '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end > -1) {
        parts.push({ type: 'italic', value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // accumulate plain text until next marker
    let j = i;
    while (j < text.length && !text.startsWith('**', j) && text[j] !== '*') j++;
    parts.push({ type: 'text', value: text.slice(i, j) });
    i = j;
  }
  return parts.map((p, idx) => {
    if (p.type === 'bold') return <strong key={idx} className="text-foreground font-semibold">{p.value}</strong>;
    if (p.type === 'italic') return <em key={idx}>{p.value}</em>;
    return <span key={idx}>{p.value}</span>;
  });
}

export default function WeeklyNarrative() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [narrative, setNarrative] = useState<WeeklyNarrative | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('weekly_narratives')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error('Could not load narrative');
        console.error(error);
      }
      setNarrative(data as WeeklyNarrative | null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!narrative) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">No narrative found</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          This story may have been removed, or you may not have permission to view it.
        </p>
        <Button onClick={() => navigate(-1)} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go back
        </Button>
      </div>
    );
  }

  const paragraphs = narrative.narrative_md.split(/\n\n+/).filter(Boolean);
  const co2 = narrative.data_snapshot?.totals?.co2_kg_this_week;
  const tokens = narrative.data_snapshot?.totals?.tokens_earned_this_week;
  const weekLabel = narrative.data_snapshot?.weekLabel;
  const firstName = narrative.data_snapshot?.firstName;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="text-muted-foreground -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Link to="/dashboard" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition">
            Dashboard
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary mb-4">
            <Sparkles className="h-3 w-3" />
            Your week, decoded
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-3">
            {firstName ? `A story for ${firstName}` : 'Your weekly story'}
          </h1>
          {weekLabel && (
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {weekLabel}
            </p>
          )}
        </div>

        {/* Highlight cards */}
        {(co2 || tokens) && (
          <div className="grid grid-cols-2 gap-3 mb-10">
            {co2 && (
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  <Leaf className="h-3 w-3" /> CO₂ avoided
                </div>
                <div className="text-2xl font-bold tabular-nums">{co2} <span className="text-sm text-muted-foreground font-normal">kg</span></div>
              </div>
            )}
            {tokens && (
              <div className="rounded-xl border border-primary/40 bg-card p-4 text-center" style={{ boxShadow: '0 0 24px rgba(249,115,22,0.15)' }}>
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary mb-2">
                  <Zap className="h-3 w-3" /> $ZSOLAR earned
                </div>
                <div className="text-2xl font-bold tabular-nums text-primary">{tokens}</div>
              </div>
            )}
          </div>
        )}

        {/* Narrative */}
        <article className="prose-narrative">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'text-lg sm:text-xl leading-relaxed text-foreground mb-6 font-light first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.85] first-letter:mt-1 first-letter:text-primary'
                  : 'text-base sm:text-[17px] leading-relaxed text-foreground/90 mb-5'
              }
            >
              {renderInline(para)}
            </p>
          ))}
        </article>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Written by Deason from your verified energy data ·{' '}
            <span className="text-muted-foreground/70">
              Generated {new Date(narrative.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </p>
          <Link to="/dashboard" className="inline-block mt-4 text-xs text-primary hover:underline">
            See live data on your dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
