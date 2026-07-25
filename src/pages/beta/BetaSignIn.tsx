import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BetaShell } from './BetaShell';

export default function BetaSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!email.includes('@')) { toast.error('Enter a valid email'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/beta/home`, shouldCreateUser: true },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    localStorage.setItem('beta_signin_email', email.trim());
    navigate('/beta/verify');
  };

  return (
    <BetaShell eyebrow="Sign in" onBack={() => navigate(-1)}>
      <h1 className="text-3xl font-semibold tracking-tight mb-3">What's your email?</h1>
      <p className="text-[15px] text-muted-foreground mb-6">
        We'll email you a one-time code. No password required.
      </p>
      <Input
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 h-12 text-base"
        onKeyDown={(e) => e.key === 'Enter' && send()}
      />
      <Button size="lg" className="w-full" onClick={send} disabled={busy}>
        {busy ? 'Sending…' : 'Send code'}
      </Button>
    </BetaShell>
  );
}
