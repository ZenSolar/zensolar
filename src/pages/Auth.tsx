import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff, Sun, Zap, Leaf, ArrowLeft } from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { lovable } from '@/integrations/lovable/index';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const TAGLINE_TEXT_SHADOW =
  '0 0 4px hsl(0 0% 100% / 0.65), 0 0 10px hsl(0 0% 100% / 0.40), 0 0 18px hsl(0 0% 100% / 0.25), 0 0 24px hsl(var(--secondary) / 0.22)';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, resetPassword, updatePassword, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Turnstile CAPTCHA state
  const turnstileTokenRef = useRef<string | null>(null);
  const [turnstileVerified, setTurnstileVerified] = useState(false);

  const handleTurnstileVerify = (token: string) => {
    turnstileTokenRef.current = token;
    setTurnstileVerified(true);
  };

  const handleTurnstileExpire = () => {
    turnstileTokenRef.current = null;
    setTurnstileVerified(false);
  };

  const verifyTurnstileToken = async (): Promise<boolean> => {
    const token = turnstileTokenRef.current;
    if (!token) {
      // In development without a configured key, allow through
      console.log('[Auth] No turnstile token, allowing in development');
      return true;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token },
      });

      if (error) {
        console.error('[Auth] Turnstile verification error:', error);
        return false;
      }

      return data?.success === true;
    } catch (err) {
      console.error('[Auth] Turnstile verification failed:', err);
      return false;
    }
  };

  useEffect(() => {
    // Check if coming back from password reset email
    if (searchParams.get('mode') === 'reset') {
      setMode('reset');
    }
    // Pre-fill referral code from URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setMode('signup');
    }
  }, [searchParams]);

  // Auth should feel like a single-screen "native" surface on mobile.
  // Lock document scrolling while this page is mounted.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const onTouchMove = (e: TouchEvent) => {
      // Prevent iOS rubber-band scroll on the Auth screen.
      // Allow normal interaction inside form controls.
      const target = e.target;
      if (target instanceof Element) {
        const allow = target.closest(
          'input, textarea, select, [contenteditable="true"], [data-allow-scroll="true"]',
        );
        if (allow) return;
      }
      e.preventDefault();
    };

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.removeEventListener('touchmove', onTouchMove as EventListener);
    };
  }, []);

  useEffect(() => {
    // IMPORTANT: Don't auto-redirect during signup.
    // Signup has its own post-success navigation to /onboarding.
    if (isAuthenticated && (mode === 'login' || mode === 'forgot')) navigate('/');
  }, [isAuthenticated, navigate, mode]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error("Failed to sign in with Apple");
      setIsLoading(false);
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    
    // Verify Turnstile CAPTCHA
    const captchaValid = await verifyTurnstileToken();
    if (!captchaValid) {
      toast.error('Security verification failed. Please try again.');
      setIsLoading(false);
      return;
    }
    
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.error(error.message);
      }
    } else {
      // Fetch profile to get display name for personalized greeting
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', userData.user.id)
          .maybeSingle();
        
        const firstName = profile?.display_name?.trim().split(/\s+/)[0];
        if (firstName) {
          toast.success(`Welcome back, ${firstName}!`);
        } else {
          toast.success('Welcome back!');
        }
      } else {
        toast.success('Welcome back!');
      }
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    
    // Verify Turnstile CAPTCHA
    const captchaValid = await verifyTurnstileToken();
    if (!captchaValid) {
      toast.error('Security verification failed. Please try again.');
      setIsLoading(false);
      return;
    }
    
    const { data, error } = await signUp(signupEmail, signupPassword, signupDisplayName, referralCode || undefined);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please log in instead.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created! Welcome to ZenSolar.');
      
      // Process referral if a code was provided
      if (referralCode && data?.session) {
        try {
          const { error: refError } = await supabase.functions.invoke('process-referral', {
            body: { referral_code: referralCode },
          });
          if (refError) {
            console.error('Referral processing error:', refError);
          } else {
            toast.success('Referral bonus applied! You earned 1,000 $ZSOLAR.');
          }
        } catch (err) {
          console.error('Failed to process referral:', err);
        }
      }
      
      navigate('/onboarding');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(forgotEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await resetPassword(forgotEmail);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent! Check your inbox.');
      setMode('login');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await updatePassword(newPassword);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      navigate('/');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              `linear-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.06) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col lg:flex-row pt-safe pb-safe px-safe">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
          <div className="max-w-md text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
            <img 
              src={zenLogo} 
              alt="ZenSolar" 
              fetchPriority="high"
              className="h-16 w-auto object-contain mx-auto relative z-10 drop-shadow-2xl" 
            />
          </div>
          
          <div 
            className="mb-6"
            style={{ 
              textShadow: TAGLINE_TEXT_SHADOW,
            }}
          >
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-semibold mb-2">
              The World's First
            </p>
            <h1 className="text-2xl font-bold text-primary mb-2 tracking-tight">
              One-Tap, Mint-on-Proof
            </h1>
            <h2 className="text-xl font-semibold text-primary">
              Web3 Clean Energy Platform
            </h2>
          </div>
          <p className="text-base text-muted-foreground mb-12 leading-relaxed">
            Track your solar production, earn $ZSOLAR tokens, and make a positive impact on the planet.
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-solar/20 to-solar/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-solar/20">
                <Sun className="w-7 h-7 text-solar" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Solar Tracking</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-energy/20 to-energy/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-energy/20">
                <Zap className="w-7 h-7 text-energy" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Token Rewards</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-eco/20 to-eco/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-eco/20">
                <Leaf className="w-7 h-7 text-eco" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Eco Impact</span>
            </div>
          </div>
        </div>
      </div>

        {/* Right side - Auth form */}
        <div className="flex w-full flex-1 items-center justify-center lg:w-1/2 px-3 sm:px-6">
          <Card className="w-full max-w-md bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-3 pt-5">
            {/* Mobile logo */}
            <div className="flex justify-center lg:hidden">
              <img 
                src={zenLogo} 
                alt="ZenSolar" 
                fetchPriority="high" 
                className="h-8 w-auto object-contain animate-logo-glow" 
              />
            </div>
            
            {/* Mobile tagline - compact */}
            <div className="mt-3 mb-3 lg:hidden">
              <p 
                className="text-[9px] uppercase tracking-[0.15em] text-primary font-semibold leading-snug"
                style={{ 
                  textShadow: TAGLINE_TEXT_SHADOW,
                }}
              >
                <span className="block">The World's First</span>
                <span className="block">One-Tap, Mint-on-Proof</span>
                <span className="block">Web3 Clean Energy Platform</span>
              </p>
            </div>
            
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-2 mb-3 lg:hidden">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
              <Zap className="h-2.5 w-2.5 text-primary/60" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
            </div>
            
            <CardTitle className="text-xl font-bold text-foreground">
              {mode === 'forgot' ? 'Reset Password' : mode === 'reset' ? 'New Password' : 'Welcome'}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1 text-sm">
              {mode === 'forgot' 
                ? "Enter your email to receive a reset link"
                : mode === 'reset'
                ? "Enter your new password"
                : "Sign in to earn $ZSOLAR blockchain rewards"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Forgot Password Form */}
            {mode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-muted-foreground">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                      className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button 
                  type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40" 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Reset Link
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                    className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setMode('login')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </form>
            )}

            {/* Reset Password Form */}
            {mode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-muted-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-muted-foreground">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40" 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Password
                </Button>
              </form>
            )}

            {/* Login/Signup Tabs */}
            {(mode === 'login' || mode === 'signup') && (
              <>
                <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/30 border border-border/50">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
                    >
                      Log In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-4">
                    <form onSubmit={handleLogin} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-muted-foreground">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-muted-foreground">Password</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                            onClick={() => setMode('forgot')}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Turnstile CAPTCHA - invisible widget */}
                      <TurnstileWidget 
                        onVerify={handleTurnstileVerify}
                        onExpire={handleTurnstileExpire}
                        size="invisible"
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40" 
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Log In
                      </Button>
                      
                      {/* Social Login Divider */}
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                        </div>
                      </div>
                      
                      {/* Social Sign In Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-card/30 border-border/60 text-foreground hover:bg-card/45 hover:text-foreground"
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          Google
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-card/30 border-border/60 text-foreground hover:bg-card/45 hover:text-foreground"
                          onClick={handleAppleSignIn}
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                          </svg>
                          Apple
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="mt-4">
                    <form onSubmit={handleSignup} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-muted-foreground">Display Name (optional)</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Your name"
                          value={signupDisplayName}
                          onChange={(e) => setSignupDisplayName(e.target.value)}
                          className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-muted-foreground">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-muted-foreground">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                            className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referral-code" className="text-muted-foreground">Referral Code (optional)</Label>
                        <Input
                          id="referral-code"
                          type="text"
                          placeholder="Enter referral code"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          maxLength={8}
                          className="h-9 bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground uppercase"
                        />
                      </div>
                      
                      {/* Turnstile CAPTCHA - invisible widget */}
                      <TurnstileWidget 
                        onVerify={handleTurnstileVerify}
                        onExpire={handleTurnstileExpire}
                        size="invisible"
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40" 
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Account
                      </Button>
                      
                      {/* Social Login Divider */}
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                        </div>
                      </div>
                      
                      {/* Social Sign In Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-card/30 border-border/60 text-foreground hover:bg-card/45 hover:text-foreground"
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          Google
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-card/30 border-border/60 text-foreground hover:bg-card/45 hover:text-foreground"
                          onClick={handleAppleSignIn}
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                          </svg>
                          Apple
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-4 pt-3 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate('/demo')}
                  >
                    Try Demo Mode
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Explore the app without creating an account
                  </p>
                </div>
                
                {/* Legal links footer */}
                <div className="mt-6 pt-4 border-t border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">
                    By signing up, you agree to our{' '}
                    <Link to="/terms" className="text-primary hover:text-primary/80 underline underline-offset-2">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-primary hover:text-primary/80 underline underline-offset-2">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </main>
  );
}