import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsFounder } from '@/hooks/useIsFounder';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function WeeklyDigestPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    if (ready && !isFounder) {
      toast.error('Founders only');
      navigate('/');
    }
  }, [isFounder, ready, navigate]);

  const handlePreview = async () => {
    setPreviewing(true);
    setPayload(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-digest', {
        body: { dryRun: true },
      });
      if (error) throw error;
      setPayload(data);
      toast.success('Preview generated');
    } catch (e: any) {
      toast.error(e.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    if (!confirm(`Send the weekly digest to ${user?.email}?`)) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-digest', {
        body: {},
      });
      if (error) throw error;
      setPayload(data);
      toast.success(`Digest queued for ${data?.recipient}`);
    } catch (e: any) {
      toast.error(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Weekly Digest (beta)
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate this week's energy digest for your own account. Founders only.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run for yourself</CardTitle>
          <CardDescription>
            Recipient: <span className="font-mono">{user?.email || '—'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handlePreview} disabled={previewing || sending} variant="outline">
            {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
            Preview data (no email)
          </Button>
          <Button onClick={handleSend} disabled={sending || previewing}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send to me now
          </Button>
        </CardContent>
      </Card>

      {payload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generated payload</CardTitle>
            <CardDescription>
              {payload.dryRun ? 'Dry run — nothing was sent.' : `Queued to ${payload.recipient}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg border bg-muted p-4 text-xs whitespace-pre-wrap break-words max-h-[600px] overflow-auto">
              {JSON.stringify(payload.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
