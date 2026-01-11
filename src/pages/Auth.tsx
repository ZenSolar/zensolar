import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff, Sun, Zap, Leaf, ArrowLeft } from 'lucide-react';
import zenLogo from '@/assets/zen-logo.png';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

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

  useEffect(() => {
    if (isAuthenticated && mode !== 'reset') {
      navigate('/');
    }
  }, [isAuthenticated, navigate, mode]);

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
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a1628] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative z-10">
        <div className="max-w-md text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
            <img 
              src={zenLogo} 
              alt="ZenSolar" 
              className="h-32 w-auto object-contain mx-auto relative z-10 drop-shadow-2xl" 
            />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Power Your Future
          </h1>
          <p className="text-lg text-slate-300 mb-12 leading-relaxed">
            Track your solar production, earn rewards, and make a positive impact on the planet.
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-amber-400/20">
                <Sun className="w-7 h-7 text-amber-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Solar Tracking</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Token Rewards</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-secondary/20">
                <Leaf className="w-7 h-7 text-secondary" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Eco Impact</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <Card className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-2">
            {/* Mobile logo */}
            <div className="flex justify-center mb-4 lg:hidden">
              <img src={zenLogo} alt="ZenSolar" className="h-20 w-auto object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {mode === 'forgot' ? 'Reset Password' : mode === 'reset' ? 'New Password' : 'Welcome'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {mode === 'forgot' 
                ? "Enter your email to receive a reset link"
                : mode === 'reset'
                ? "Enter your new password"
                : "Sign in to your account or create a new one"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Forgot Password Form */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-300">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40" 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Reset Link
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full text-slate-400 hover:text-white"
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
                  <Label htmlFor="new-password" className="text-slate-300">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-300">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40" 
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
                  <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400"
                    >
                      Log In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup"
                      className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-slate-300">Password</Label>
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
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40" 
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Log In
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="mt-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-slate-300">Display Name (optional)</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Your name"
                          value={signupDisplayName}
                          onChange={(e) => setSignupDisplayName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-slate-300">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-slate-300">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referral-code" className="text-slate-300">Referral Code (optional)</Label>
                        <Input
                          id="referral-code"
                          type="text"
                          placeholder="Enter referral code"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          maxLength={8}
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary uppercase"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40" 
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Button 
                    variant="outline" 
                    className="w-full bg-transparent border-white/20 text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/30" 
                    onClick={() => navigate('/demo')}
                  >
                    Try Demo Mode
                  </Button>
                  <p className="text-xs text-slate-500 text-center mt-2">
                    Explore the app without creating an account
                  </p>
                </div>
                
                {/* Legal links footer */}
                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-500">
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
  );
}