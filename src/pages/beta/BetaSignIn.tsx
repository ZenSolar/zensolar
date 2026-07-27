import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { BetaShell } from './BetaShell';
import { QCButton, QCInput } from '@/components/onboarding/quiet/QuietCurrent';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'signup' | 'forgot' | 'verify';

/**
 * Primary auth surface for /onboarding/signin (and legacy /beta/signin).
 * Email + password is the default. Optional Google / Apple via the Lovable
 * managed OAuth helper. OTP / magic-link is intentionally not offered here —
 * the "Secure your account" passkey step later in onboarding is a separate
 * wallet activation, not a login method.
 */
export default function BetaSignIn() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleLogin = async () => {
    if (!emailValid) return toast.error('Enter a valid email');
    if (password.length < 6) return toast.error('Enter your password');
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      const code = (error as any)?.code ?? '';
      if (code === 'email_not_confirmed' || msg.includes('not confirmed') || msg.includes('confirm')) {
        // Auto-route: unconfirmed account → jump to code screen and resend
        setOtpCode('');
        setMode('verify');
        toast.message('Almost there — confirm your email', {
          description: 'We just sent a fresh code. Enter it below.',
        });
        supabase.auth.resend({ type: 'signup', email: email.trim() }).catch(() => {});
        return;
      }
      return toast.error(error.message ?? 'Sign in failed');
    }
    navigate('/onboarding');
  };


  const handleSignup = async () => {
    if (!emailValid) return toast.error('Enter a valid email');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setBusy(true);
    const { data, error } = await signUp(email.trim(), password, displayName.trim() || undefined);
    setBusy(false);
    if (error) return toast.error(error.message ?? 'Sign up failed');
    // If email confirmation is required, session will be null.
    if (data?.session) {
      navigate('/onboarding');
    } else {
      toast.success("We emailed you a code. Enter it below to confirm.");
      setOtpCode('');
      setMode('verify');
    }
  };

  const handleVerify = async () => {
    const token = otpCode.replace(/\D/g, '');
    if (token.length < 6) return toast.error('Enter the code from your email');
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'signup',
    });
    setBusy(false);
    if (error) return toast.error(error.message ?? 'Invalid or expired code');
    if (data?.session) {
      navigate('/onboarding');
    } else {
      toast.success('Email confirmed. Please log in.');
      setMode('login');
    }
  };

  const handleResendCode = async () => {
    if (!emailValid) return toast.error('Enter your email first');
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setBusy(false);
    if (error) return toast.error(error.message ?? 'Could not resend code');
    toast.success('New code sent.');
  };

  const handleForgot = async () => {
    if (!emailValid) return toast.error('Enter your email');
    setBusy(true);
    const { error } = await resetPassword(email.trim());
    setBusy(false);
    if (error) return toast.error(error.message ?? 'Could not send reset email');
    toast.success('Password reset email sent.');
    setMode('login');
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + '/onboarding',
      });
      if (result?.error) {
        toast.error(result.error.message ?? `${provider} sign in failed`);
        setBusy(false);
        return;
      }
      if (result?.redirected) return; // browser redirects away
      navigate('/onboarding');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sign in failed');
      setBusy(false);
    }
  };

  const submit = () => {
    if (mode === 'login') return handleLogin();
    if (mode === 'signup') return handleSignup();
    if (mode === 'verify') return handleVerify();
    return handleForgot();
  };

  const eyebrow =
    mode === 'forgot' ? 'Reset password'
      : mode === 'verify' ? 'Confirm email'
      : mode === 'signup' ? 'Sign up' : 'Sign in';

  return (
    <BetaShell
      eyebrow={eyebrow}
      onBack={() => (mode === 'login' ? navigate(-1) : setMode(mode === 'verify' ? 'signup' : 'login'))}
    >
      {(mode === 'login' || mode === 'signup') && (
        <div className="flex items-center gap-1 p-1 rounded-xl qc-elevated border qc-border mb-6 w-fit">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all',
                mode === m ? 'qc-current-border qc-text' : 'qc-muted hover:qc-text'
              )}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>
      )}

      <h1 className="text-[28px] leading-tight font-semibold qc-text tracking-tight mb-2">
        {mode === 'forgot' ? 'Reset your password'
          : mode === 'verify' ? 'Enter your code'
          : mode === 'signup' ? 'Create your account'
          : 'Welcome back'}
      </h1>
      <p className="text-[14px] qc-muted mb-8">
        {mode === 'forgot' ? "We'll email you a link to set a new password."
          : mode === 'verify' ? `We sent a code to ${email || 'your email'}. Enter it below to confirm your account.`
          : mode === 'signup' ? 'Use your email and a password to get started.'
          : 'Sign in with your email and password.'}
      </p>

      {mode === 'verify' ? (
        <>
          <div className="space-y-3 mb-4">
            <QCInput
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="12345678"
              maxLength={10}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          <QCButton onClick={submit} disabled={busy}>
            {busy ? 'Please wait…' : 'Confirm email'}
          </QCButton>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={busy}
              className="text-[13px] qc-muted hover:qc-text transition-colors"
            >
              Resend code
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            <QCInput
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            {mode === 'signup' && (
              <QCInput
                type="text"
                autoComplete="name"
                placeholder="Display name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            )}
            {mode !== 'forgot' && (
              <QCInput
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            )}
          </div>

          <QCButton onClick={submit} disabled={busy}>
            {busy ? 'Please wait…'
              : mode === 'forgot' ? 'Send reset link'
              : mode === 'signup' ? 'Create account'
              : 'Log in'}
          </QCButton>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-[13px] qc-muted hover:qc-text transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}


          {mode !== 'forgot' && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px qc-border border-t" />
                <span className="text-[11px] uppercase tracking-[0.2em] qc-muted">or</span>
                <div className="flex-1 h-px qc-border border-t" />
              </div>

              <div className="space-y-3">
                <QCButton variant="ghost" onClick={() => handleOAuth('google')} disabled={busy}>
                  {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
                </QCButton>
                <QCButton variant="ghost" onClick={() => handleOAuth('apple')} disabled={busy}>
                  {mode === 'signup' ? 'Sign up with Apple' : 'Continue with Apple'}
                </QCButton>
              </div>
            </>
          )}
        </>
      )}
    </BetaShell>
  );
}
