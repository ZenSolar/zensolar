import { useProfile } from "@/hooks/useProfile";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Gift, TrendingUp, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function Referrals() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  // Fetch referral stats
  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || referralsLoading;
  const totalReferrals = referrals?.length || 0;
  const totalTokensEarned = referrals?.reduce((sum, r) => sum + Number(r.tokens_rewarded), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referral Program</h1>
        <p className="text-muted-foreground mt-1">
          Invite friends and earn 1,000 $ZSOLAR for each successful signup
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Gift className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTokensEarned.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">$ZSOLAR Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">1,000</p>
                <p className="text-xs text-muted-foreground">Per Referral</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Your Code */}
      <ReferralCard />

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
          <CardDescription>Share your code and earn rewards in 3 simple steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">1</span>
              </div>
              <h4 className="font-medium mb-1">Share Your Code</h4>
              <p className="text-sm text-muted-foreground">
                Copy your unique referral code or link and share it with friends
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">2</span>
              </div>
              <h4 className="font-medium mb-1">Friend Signs Up</h4>
              <p className="text-sm text-muted-foreground">
                They enter your code during signup to link their account
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <span className="text-primary font-bold">3</span>
              </div>
              <h4 className="font-medium mb-1">Both Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">
                You both receive 1,000 $ZSOLAR tokens instantly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Referral History</CardTitle>
          <CardDescription>Your successful referrals</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div 
                  key={referral.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New User Referred</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    +{Number(referral.tokens_rewarded).toLocaleString()} $ZSOLAR
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm mt-1">Share your code to start earning!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
