import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BetaShell } from './BetaShell';

export default function BetaVerify() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEmail(localStorage.getItem('beta_signin_email') ?? '');
  }, []);

  const verify = async () => {
    const digits = code.replace(/\D/g, '');
    if (digits.length < 6) { toast.error('Enter the code from your email'); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: digits,
      type: 'email',
    });
    setBusy(false);
    if (error) { toast.error("That code didn't match — try again"); return; }

    // Attach invite token to profile if present
    const invite = localStorage.getItem('beta_invite_token');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const update: Record<string, unknown> = { beta_flow_step: 'home' };
      if (invite) update.beta_invite_token = invite;
      await supabase.from('profiles').update(update).eq('id', user.id);
      if (invite) {
        await supabase.from('beta_invites').update({ consumed_by: user.id, consumed_at: new Date().toISOString() }).eq('token', invite).is('consumed_by', null);
      }
    }
    navigate('/beta/home');
  };

  const resend = async () => {
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/beta/home` },
    });
    if (error) toast.error(error.message);
    else toast.success('New code sent');
  };

  return (
    <BetaShell eyebrow="Verify" onBack={() => navigate('/beta/signin')}>
      <h1 className="text-3xl font-semibold tracking-tight mb-3">Enter your code</h1>
      <p className="text-[15px] text-muted-foreground mb-6">
        We sent a 6-digit code to <span className="text-foreground">{email || 'your inbox'}</span>.
      </p>
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mb-4 h-14 text-center text-2xl tracking-[0.4em]"
        maxLength={6}
        onKeyDown={(e) => e.key === 'Enter' && verify()}
      />
      <Button size="lg" className="w-full mb-3" onClick={verify} disabled={busy}>
        {busy ? 'Verifying…' : 'Verify'}
      </Button>
      <button type="button" className="text-sm text-muted-foreground underline" onClick={resend}>
        Resend code
      </button>
    </BetaShell>
  );
}
