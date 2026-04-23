import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { Copy, Share2, Check, Users, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/hooks/useGoogleAnalytics';

export function ReferralCard() {
  const { profile, isLoading } = useProfile();
  const [copied, setCopied] = useState(false);

  const referralCode = profile?.referral_code || '';
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`Referral ${type} copied!`);
      // Analytics: measure how often users copy their code vs the full link
      trackEvent('referral_copy', {
        copy_type: type,
        has_referral_code: !!referralCode,
        event_category: 'referral',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
      trackEvent('referral_copy_failed', { copy_type: type, event_category: 'referral' });
    }
  };

  const handleShare = async () => {
    // Analytics: track every share attempt so we can measure virality
    trackEvent('referral_share_click', {
      method: typeof navigator !== 'undefined' && (navigator as Navigator).share ? 'native_share' : 'copy_fallback',
      has_referral_code: !!referralCode,
      event_category: 'referral',
    });
    if (typeof navigator !== 'undefined' && (navigator as Navigator).share) {
      try {
        await navigator.share({
          title: 'Join ZenSolar',
          text: `Join ZenSolar and start earning $ZSOLAR tokens for your solar energy! Use my referral code: ${referralCode}`,
          url: referralLink,
        });
        trackEvent('referral_share_success', { event_category: 'referral' });
      } catch {
        trackEvent('referral_share_cancelled', { event_category: 'referral' });
      }
    } else {
      handleCopy(referralLink, 'link');
    }
  };

  // P0 audit fix: never render nothing — show loading skeleton instead so the
  // primary CTA on /referrals doesn't silently vanish while the profile fetches.
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Refer Friends & Earn</CardTitle>
              <CardDescription>Get 1,000 $ZSOLAR for each friend who joins</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 rounded-md bg-muted/40 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 rounded-md bg-muted/40 animate-pulse" />
            <div className="h-10 flex-1 rounded-md bg-muted/30 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!referralCode) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Refer Friends & Earn</CardTitle>
              <CardDescription>Your referral code is being generated…</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Refresh in a moment to grab your code and start earning 1,000 $ZSOLAR per signup.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Refer Friends & Earn</CardTitle>
            <CardDescription>Get 1,000 $ZSOLAR for each friend who joins</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Your Referral Code</label>
          <div className="flex gap-2">
            <Input 
              value={referralCode} 
              readOnly 
              className="font-mono text-lg font-bold tracking-wider bg-background/50"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(referralCode, 'code')}
              className="shrink-0"
              aria-label="Copy referral code"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Invite
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => handleCopy(referralLink, 'link')}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              How it works
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Share your code with friends. When they sign up and connect their solar system, you both earn 1,000 $ZSOLAR tokens!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}