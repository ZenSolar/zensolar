import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Wallet, CheckCircle2, XCircle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface FunnelStats {
  totalSignups: number;
  usersWithWallet: number;
  usersWithEnergy: number;
  usersFullyOnboarded: number;
  signupToWalletRate: number;
  walletToEnergyRate: number;
  overallConversionRate: number;
}

interface OnboardingFunnelCardProps {
  profiles: { 
    user_id: string; 
    wallet_address: string | null; 
    tesla_connected: boolean;
    enphase_connected: boolean;
    solaredge_connected: boolean;
    wallbox_connected: boolean;
  }[];
}

export function OnboardingFunnelCard({ profiles }: OnboardingFunnelCardProps) {
  const [stats, setStats] = useState<FunnelStats>({
    totalSignups: 0,
    usersWithWallet: 0,
    usersWithEnergy: 0,
    usersFullyOnboarded: 0,
    signupToWalletRate: 0,
    walletToEnergyRate: 0,
    overallConversionRate: 0,
  });

  useEffect(() => {
    if (!profiles.length) return;

    const totalSignups = profiles.length;
    const usersWithWallet = profiles.filter(p => !!p.wallet_address).length;
    const usersWithEnergy = profiles.filter(p => 
      p.tesla_connected || p.enphase_connected || p.solaredge_connected || p.wallbox_connected
    ).length;
    const usersFullyOnboarded = profiles.filter(p => 
      !!p.wallet_address && 
      (p.tesla_connected || p.enphase_connected || p.solaredge_connected || p.wallbox_connected)
    ).length;

    const signupToWalletRate = totalSignups > 0 ? (usersWithWallet / totalSignups) * 100 : 0;
    const walletToEnergyRate = usersWithWallet > 0 ? (usersFullyOnboarded / usersWithWallet) * 100 : 0;
    const overallConversionRate = totalSignups > 0 ? (usersFullyOnboarded / totalSignups) * 100 : 0;

    setStats({
      totalSignups,
      usersWithWallet,
      usersWithEnergy,
      usersFullyOnboarded,
      signupToWalletRate,
      walletToEnergyRate,
      overallConversionRate,
    });
  }, [profiles]);

  const funnelSteps = [
    { 
      label: 'Signups', 
      count: stats.totalSignups, 
      icon: Users,
      color: 'bg-blue-500',
      description: 'Total user accounts'
    },
    { 
      label: 'Wallet Connected', 
      count: stats.usersWithWallet, 
      icon: Wallet,
      color: 'bg-primary',
      description: 'Users with wallet address',
      rate: stats.signupToWalletRate,
      dropoff: stats.totalSignups - stats.usersWithWallet
    },
    { 
      label: 'Fully Onboarded', 
      count: stats.usersFullyOnboarded, 
      icon: CheckCircle2,
      color: 'bg-secondary',
      description: 'Wallet + Energy connected',
      rate: stats.walletToEnergyRate,
      dropoff: stats.usersWithWallet - stats.usersFullyOnboarded
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Onboarding Funnel
            </CardTitle>
            <CardDescription>User conversion from signup to fully onboarded</CardDescription>
          </div>
          <Badge 
            variant={stats.overallConversionRate >= 50 ? 'default' : 'secondary'}
            className={stats.overallConversionRate >= 50 ? 'bg-primary' : ''}
          >
            {stats.overallConversionRate.toFixed(1)}% overall
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Funnel visualization */}
        <div className="space-y-4">
          {funnelSteps.map((step, index) => {
            const Icon = step.icon;
            const widthPercent = stats.totalSignups > 0 
              ? Math.max(20, (step.count / stats.totalSignups) * 100) 
              : 100;
            
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${step.color}/10`}>
                      <Icon className={`h-4 w-4 ${step.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{step.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {step.description}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {step.rate !== undefined && (
                      <span className={`text-xs ${step.rate >= 50 ? 'text-primary' : 'text-orange-500'}`}>
                        {step.rate.toFixed(1)}%
                      </span>
                    )}
                    <span className="font-bold text-lg">{step.count}</span>
                  </div>
                </div>
                
                {/* Funnel bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-8 ${step.color} rounded-lg flex items-center justify-center relative overflow-hidden`}
                  style={{ minWidth: '80px' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </motion.div>
                
                {/* Drop-off indicator */}
                {step.dropoff !== undefined && step.dropoff > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <TrendingDown className="h-3 w-3 text-red-400" />
                    <span className="text-red-400">{step.dropoff} dropped</span>
                  </div>
                )}
                
                {/* Arrow between steps */}
                {index < funnelSteps.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.signupToWalletRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Signup → Wallet</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">{stats.walletToEnergyRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Wallet → Energy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.overallConversionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Full Conversion</p>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
          {stats.signupToWalletRate < 50 ? (
            <p className="text-orange-500 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Low wallet connection rate. Consider improving onboarding flow.
            </p>
          ) : stats.walletToEnergyRate < 50 ? (
            <p className="text-orange-500 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Users connect wallets but drop off at energy setup.
            </p>
          ) : (
            <p className="text-primary flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Healthy conversion funnel! Keep it up.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
