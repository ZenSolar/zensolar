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
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
            <Users className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Referral Program</h1>
            <p className="text-muted-foreground">
              Invite friends and earn <span className="text-primary font-semibold">1,000 $ZSOLAR</span> for each signup
            </p>
          </div>
        </motion.div>

        {/* Share Your Code - Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <ReferralCard />
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 grid-cols-1 sm:grid-cols-3"
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 shadow-inner">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{totalReferrals}</p>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-inner">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{totalTokensEarned.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">$ZSOLAR Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg hover:shadow-secondary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 shadow-inner">
                  <Gift className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">1,000</p>
                  <p className="text-sm text-muted-foreground">Per Referral</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Sparkles className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">How It Works</CardTitle>
                  <CardDescription>Share your code and earn rewards in 3 simple steps</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StepCard
                  number={1}
                  icon={<Share2 className="h-5 w-5" />}
                  title="Share Your Code"
                  description="Copy your unique referral code or link and share it with friends"
                  gradient="from-purple-500/10 to-purple-600/5"
                  iconBg="from-purple-500 to-purple-600"
                />
                <StepCard
                  number={2}
                  icon={<Link2 className="h-5 w-5" />}
                  title="Friend Signs Up"
                  description="They enter your code during signup to link their account"
                  gradient="from-primary/10 to-primary/5"
                  iconBg="from-primary to-blue-600"
                />
                <StepCard
                  number={3}
                  icon={<Gift className="h-5 w-5" />}
                  title="Both Earn Rewards"
                  description="You both receive 1,000 $ZSOLAR tokens instantly"
                  gradient="from-secondary/10 to-secondary/5"
                  iconBg="from-secondary to-green-600"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Referral History</CardTitle>
                    <CardDescription>Your successful referrals</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30">
                  {totalReferrals} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {referrals && referrals.length > 0 ? (
                <div className="space-y-3">
                  {referrals.map((referral, index) => (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 hover:border-primary/30 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 shadow-inner">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">New User Referred</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(referral.created_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge className="font-mono bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-sm px-3 py-1">
                        +{Number(referral.tokens_rewarded).toLocaleString()} $ZSOLAR
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative p-4 rounded-full bg-gradient-to-br from-muted to-muted/50">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-lg font-medium">No referrals yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share your code above to start earning!
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

function StepCard({
  number,
  icon,
  title,
  description,
  gradient,
  iconBg
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className={`relative flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br ${gradient} border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group`}>
      {/* Step number badge */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg`}>
        <span className="text-white font-bold text-sm">{number}</span>
      </div>
      
      <div className={`p-3 rounded-xl bg-gradient-to-br ${iconBg} text-white shadow-lg mt-3 mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}