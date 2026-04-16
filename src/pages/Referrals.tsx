import { useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Loader2, Users, Gift, TrendingUp, CheckCircle2, Share2, Link2, Coins, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";
import { PullToRefreshWrapper } from "@/components/ui/PullToRefreshWrapper";

export default function Referrals() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();

  // Fetch referral stats
  const { data: referrals, isLoading: referralsLoading, refetch: refetchReferrals } = useQuery({
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

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchProfile(), refetchReferrals()]);
    toast.success('Referrals updated');
  }, [refetchProfile, refetchReferrals]);

  const isLoading = profileLoading || referralsLoading;
  const totalReferrals = referrals?.length || 0;
  const totalTokensEarned = referrals?.reduce((sum, r) => sum + Number(r.tokens_rewarded), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-sm text-muted-foreground">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-purple-500" />
            <h1 className="text-xl font-bold text-foreground">Referral Program</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Invite friends and earn <span className="text-primary font-semibold">1,000 $ZSOLAR</span> per signup
          </p>
        </motion.div>

        {/* Share Your Code - Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <ReferralCard />
        </motion.div>

        {/* Stats Row — compact */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3 grid-cols-3"
        >
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-center">
            <p className="text-2xl font-bold">{totalReferrals}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Referrals</p>
          </div>
          
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-center">
            <p className="text-2xl font-bold">{totalTokensEarned.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">$ZSOLAR Earned</p>
          </div>

          <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/15 text-center">
            <p className="text-2xl font-bold">1,000</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Per Referral</p>
          </div>
        </motion.div>

        {/* How It Works — compact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">How It Works</p>
              <div className="flex gap-3">
                <StepPill number={1} label="Share Code" />
                <StepPill number={2} label="Friend Signs Up" />
                <StepPill number={3} label="Both Earn" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <div className="flex items-center justify-between p-4 pb-2">
              <p className="text-sm font-semibold">Referral History</p>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                {totalReferrals} total
              </Badge>
            </div>
            <CardContent className="px-4 pb-4">
              {referrals && referrals.length > 0 ? (
                <div className="space-y-2">
                  {referrals.map((referral, index) => (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between py-2.5 px-1 border-b border-border/30 last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">New User Referred</p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(referral.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-primary">
                        +{Number(referral.tokens_rewarded).toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No referrals yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    Share your code above to start earning
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PullToRefreshWrapper>
  );
}

function StepPill({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex-1 flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30">
      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
        {number}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}