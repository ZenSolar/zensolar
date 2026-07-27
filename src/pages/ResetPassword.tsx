import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BetaShell } from './beta/BetaShell';
import { QCButton, QCInput } from '@/components/onboarding/quiet/QuietCurrent';

/**
 * Public /reset-password page.
 * Supabase drops the user here after they click the reset link with a
 * recovery session already established. We just collect a new password.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Recovery flow: Supabase sets the session from the URL fragment.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) return toast.error(error.message ?? 'Could not update password');
    toast.success('Password updated.');
    navigate('/onboarding');
  };

  return (
    <BetaShell eyebrow="Reset password">
      <h1 className="text-[28px] leading-tight font-semibold qc-text tracking-tight mb-2">
        Set a new password
      </h1>
      <p className="text-[14px] qc-muted mb-8">
        {ready
          ? 'Choose a new password for your ZenSolar account.'
          : 'Open this page from the reset link in your email.'}
      </p>

      <div className="space-y-3 mb-4">
        <QCInput
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!ready}
        />
        <QCInput
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={!ready}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>

      <QCButton onClick={submit} disabled={!ready || busy}>
        {busy ? 'Updating…' : 'Update password'}
      </QCButton>
    </BetaShell>
  );
}
