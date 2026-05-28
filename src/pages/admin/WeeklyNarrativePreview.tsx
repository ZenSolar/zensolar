import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsFounder } from '@/hooks/useIsFounder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Sparkles, Mail, Eye, Send, LogIn } from 'lucide-react';
import { toast } from 'sonner';

type UserOption = { id: string; email: string | null; device_count?: number; providers?: string[]; device_types?: string[] };

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
  const { user, session } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ narrativeMd: string; id?: string; teaser?: string } | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (ready && !isFounder) {
      toast.error('Founders only');
      navigate('/');
    }
  }, [isFounder, ready, navigate]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-user-emails', {
          body: { withDevices: true },
        });
        if (error) throw error;
        if (cancelled) return;
        const list: UserOption[] = (data?.users || []).filter((u: UserOption) => !!u.email);
        setUsers(list);
        if (user && list.some((u) => u.id === user.id)) setTargetUserId(user.id);
        else if (list[0]) setTargetUserId(list[0].id);
      } catch (e: any) {
        toast.error(e.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, user]);

  const selectedUser = users.find((u) => u.id === targetUserId);
  const selectedLabel = selectedUser?.email || (result ? 'selected beta user' : SAMPLE_DATA.firstName);

  const handleGenerate = async (dryRun: boolean) => {
    if (!session) {
      toast.error('Please sign in');
      return;
    }
    if (!targetUserId) {
      toast.error('Select a beta user first');
      return;
    }
    setGenerating(true);
    try {
      const { data: json, error } = await supabase.functions.invoke('generate-weekly-narrative', {
        body: { dryRun, userId: targetUserId },
      });
      if (error) throw new Error(await readFnError(error));
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

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

        {!session && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-6">
              <div className="flex-1 text-sm">
                Sign in to generate a weekly narrative for registered beta users.
              </div>
              <Button onClick={() => navigate('/auth')} size="sm">
                <LogIn className="h-4 w-4 mr-2" /> Sign in
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
            <CardDescription>Pick any registered beta user and generate from their connected weekly data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={targetUserId}
              onValueChange={setTargetUserId}
              disabled={!session || loadingUsers || users.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={
                  loadingUsers ? 'Loading users…'
                  : users.length === 0 ? 'No registered users'
                  : 'Select a beta user'
                } />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => {
                  const provs = (u.providers || []).join(', ');
                  const tag = u.device_count
                    ? (provs ? ` · ${provs}` : '')
                    : ' · no device';
                  return (
                    <SelectItem key={u.id} value={u.id}>
                      {u.email}{user?.id === u.id ? ' (you)' : ''}{tag}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground">
              Generating for: <span className="font-mono">{selectedUser?.email || '—'}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => handleGenerate(true)} disabled={!session || generating || !targetUserId} variant="outline" className="w-full sm:w-auto">
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                Generate preview
              </Button>
              <Button onClick={() => handleGenerate(false)} disabled={!session || generating || !targetUserId} className="w-full sm:w-auto">
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Generate & save for selected user
              </Button>
            </div>
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
                  A story for {selectedLabel}
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
