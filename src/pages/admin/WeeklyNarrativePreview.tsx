import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Sparkles, Mail, Eye, Send } from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE_NARRATIVE = `Tuesday was the day, Michael. Your panels hit their stride right after lunch — **8.2 kW** flowing off the roof at the peak — and by evening you'd quietly stacked **47.3 kWh** for the day. That's the kind of number that used to require a small commercial array; you're doing it with a residential system.

Your Powerwall played a beautiful supporting role. Most nights it covered the **9 PM to 6 AM** window with zero grid draw, then refilled itself the next morning before you'd had your second coffee. The grid only saw your meter twice this week, and one of those was a brief evening top-off Thursday after the cloud cover rolled in.

On the road, the Model 3 logged **142 miles** across five days. Friday's run down to Waco was the standout — **22 minutes** at the Supercharger for **45 kWh**, **$7.49** all in. At today's gas prices that same drive would have cost you closer to **$18**. The car's never going to send you a thank-you note, but the math does.

All told, you earned **428.6 $ZSOLAR** and kept **21.4 kg of CO₂** out of the atmosphere. Next week's forecast says sun through Wednesday, then a system rolling in Thursday — so if you've been planning to charge the car all the way to 100%, do it before then.`;

const SAMPLE_DATA = {
  firstName: 'Michael',
  weekLabel: 'Mar 17 – Mar 23, 2026',
  totals: {
    tokens_earned_this_week: '428.6',
    tokens_lifetime: '12,418.2',
    co2_kg_this_week: '21.4',
  },
};

export default function WeeklyNarrativePreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ narrativeMd: string; id?: string; teaser?: string } | null>(null);

  const handleGenerate = async (dryRun: boolean) => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in');
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-weekly-narrative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dryRun }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Generation failed');
        return;
      }
      setResult({ narrativeMd: json.narrativeMd, id: json.id, teaser: json.teaser });
      toast.success(dryRun ? 'Narrative generated (not saved)' : 'Narrative saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setGenerating(false);
    }
  };

  const narrative = result?.narrativeMd || SAMPLE_NARRATIVE;
  const paragraphs = narrative.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Weekly Narrative Preview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hyper-personalized long-form story Deason writes for each user every week.
            This is the companion to the lightweight digest email.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
            <CardDescription>Generate a narrative from your real connected data, or preview the sample.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => handleGenerate(true)} disabled={generating} variant="outline">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Generate (dry run, don't save)
            </Button>
            <Button onClick={() => handleGenerate(false)} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Generate & save for me
            </Button>
            {result?.id && (
              <Button onClick={() => navigate(`/energy-insights/week/${result.id}`)} variant="secondary">
                View full reader page →
              </Button>
            )}
          </CardContent>
        </Card>

        {result?.teaser && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email teaser (first paragraph, ≤240 chars)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic text-muted-foreground">"{result.teaser}…"</p>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              {result ? 'Your narrative' : 'Sample narrative'}
            </CardTitle>
            <CardDescription>
              {result ? 'Generated from your real connected data' : 'Hand-crafted example showing the voice & format'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <div className="text-center mb-8">
                <div className="text-[10px] uppercase tracking-[0.2em] text-primary mb-2">Your week, decoded</div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">
                  A story for {result ? '(you)' : SAMPLE_DATA.firstName}
                </h2>
                <p className="text-xs text-muted-foreground">{SAMPLE_DATA.weekLabel}</p>
              </div>
              <article>
                {paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className={
                      i === 0
                        ? 'text-lg leading-relaxed text-foreground mb-5 font-light'
                        : 'text-[15px] leading-relaxed text-foreground/90 mb-4'
                    }
                  >
                    {para.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
                      seg.startsWith('**') && seg.endsWith('**')
                        ? <strong key={j} className="font-semibold text-foreground">{seg.slice(2, -2)}</strong>
                        : <span key={j}>{seg}</span>
                    )}
                  </p>
                ))}
              </article>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
