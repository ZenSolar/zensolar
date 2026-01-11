import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { Copy, Share2, Check, Users, Gift } from 'lucide-react';
import { toast } from 'sonner';

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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ZenSolar',
          text: `Join ZenSolar and start earning $ZSOLAR tokens for your solar energy! Use my referral code: ${referralCode}`,
          url: referralLink,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy(referralLink, 'link');
    }
  };

  if (isLoading || !referralCode) {
    return null;
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