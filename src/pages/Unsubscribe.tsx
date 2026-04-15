import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, MailX } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid === false && data.reason === 'already_unsubscribed') setStatus('already');
        else if (data.valid) setStatus('valid');
        else setStatus('invalid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (data?.success) setStatus('success');
      else if (data?.reason === 'already_unsubscribed') setStatus('already');
      else setStatus('error');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">ZenSolar</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Validating...</p>
          </div>
        )}

        {status === 'valid' && (
          <div className="space-y-4">
            <MailX className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-foreground">Would you like to unsubscribe from ZenSolar emails?</p>
            <Button onClick={handleUnsubscribe} disabled={submitting} className="w-full">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</> : 'Confirm Unsubscribe'}
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-secondary" />
            <p className="text-foreground font-medium">You've been unsubscribed.</p>
            <p className="text-sm text-muted-foreground">You will no longer receive emails from ZenSolar.</p>
          </div>
        )}

        {status === 'already' && (
          <div className="space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-foreground">You're already unsubscribed.</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="space-y-3">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-foreground">Invalid or expired unsubscribe link.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-foreground">Something went wrong. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
