import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BetaShell } from './BetaShell';

export default function BetaInvite() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('beta_invite_token', token);
    (async () => {
      const { data } = await supabase.from('beta_invites').select('token, label').eq('token', token).maybeSingle();
      if (data) { setLabel(data.label ?? null); setStatus('ok'); }
      else setStatus('ok'); // permissive for beta — accept any token, log later
    })();
  }, [token]);

  if (status === 'checking') {
    return <BetaShell><p className="text-sm text-muted-foreground">Checking your invite…</p></BetaShell>;
  }

  return (
    <BetaShell eyebrow="ZenSolar Beta">
      <h1 className="text-3xl font-semibold tracking-tight mb-3">You're invited</h1>
      <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">
        {label ? `${label} — you're on the list. ` : ''}
        This takes about 3–5 minutes. We read data only — no control, and you can disconnect anytime.
      </p>
      <ul className="text-[14px] text-muted-foreground space-y-2 mb-8 list-disc pl-5">
        <li>Sign in with a code — no password.</li>
        <li>Tell us what you have at home.</li>
        <li>Connect Tesla, solar, or your charger.</li>
      </ul>
      <Button size="lg" className="w-full" onClick={() => navigate('/beta/signin')}>
        Get started
      </Button>
    </BetaShell>
  );
}
