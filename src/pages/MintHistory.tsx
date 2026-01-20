import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Coins, Award, Loader2, TrendingUp, Zap, Car, Battery, ExternalLink, Hash, Sparkles, ChevronDown, ChevronUp, Sun, Clock, ArrowUpRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { PullToRefreshWrapper } from '@/components/ui/PullToRefreshWrapper';

interface MintTransaction {
  id: string;
  tx_hash: string;
  block_number: string | null;
  action: string;
  wallet_address: string;
  tokens_minted: number;
  nfts_minted: number[];
  nft_names: string[];
  status: string;
  created_at: string;
  gas_used: string | null;
}

interface PendingActivity {
  solarKwh: number;
  batteryKwh: number;
  evMiles: number;
  evChargingKwh: number;
  totalTokens: number;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; gradient: string; description: string }> = {
  'register': { label: 'Welcome NFT', icon: <Award className="h-4 w-4" />, gradient: 'from-amber-500 to-orange-600', description: 'Received welcome NFT for joining ZenSolar' },
  'mint-rewards': { label: 'Token Mint', icon: <Coins className="h-4 w-4" />, gradient: 'from-primary to-accent', description: 'Minted $ZSOLAR tokens from energy activity' },
  'mint-combos': { label: 'Combo NFTs', icon: <Sparkles className="h-4 w-4" />, gradient: 'from-purple-500 to-pink-600', description: 'Earned combo achievement NFTs' },
  'claim-milestone-nfts': { label: 'Milestone NFTs', icon: <Award className="h-4 w-4" />, gradient: 'from-emerald-500 to-teal-600', description: 'Claimed milestone achievement NFTs' },
};

export default function MintHistory() {
  const { profile } = useProfile();
  const [transactions, setTransactions] = useState<MintTransaction[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [pendingActivity, setPendingActivity] = useState<PendingActivity>({
    solarKwh: 0, batteryKwh: 0, evMiles: 0, evChargingKwh: 0, totalTokens: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('mint_transactions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTransactions((data as MintTransaction[]) || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPendingActivity = useCallback(async () => {
    setIsPendingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsPendingLoading(false); return; }

      const { data: devices } = await supabase.from('connected_devices').select('device_type, baseline_data, lifetime_totals').eq('user_id', session.user.id);

      let solarKwh = 0, batteryKwh = 0, evMiles = 0, evChargingKwh = 0;

      for (const device of (devices || [])) {
        const baseline = device.baseline_data as Record<string, number> | null;
        const lifetime = device.lifetime_totals as Record<string, number> | null;
        if (!lifetime) continue;

        if (device.device_type === 'solar' || device.device_type === 'solar_system') {
          const lifetimeSolarWh = lifetime.solar_wh || lifetime.lifetime_solar_wh || 0;
          const baselineSolarWh = baseline?.solar_wh || baseline?.total_solar_produced_wh || 0;
          solarKwh += Math.max(0, (lifetimeSolarWh - baselineSolarWh) / 1000);
        } else if (device.device_type === 'powerwall' || device.device_type === 'battery') {
          const lifetimeBatteryWh = lifetime.battery_discharge_wh || lifetime.lifetime_battery_discharge_wh || 0;
          const baselineBatteryWh = baseline?.battery_discharge_wh || baseline?.total_energy_discharged_wh || 0;
          batteryKwh += Math.max(0, (lifetimeBatteryWh - baselineBatteryWh) / 1000);
        } else if (device.device_type === 'vehicle') {
          evMiles += Math.max(0, (lifetime.odometer || 0) - (baseline?.odometer || baseline?.last_known_odometer || 0));
          evChargingKwh += Math.max(0, (lifetime.charging_kwh || 0) - (baseline?.charging_kwh || baseline?.total_charge_energy_added_kwh || 0));
        } else if (device.device_type === 'wall_connector') {
          const lifetimeKwh = lifetime.charging_kwh || (lifetime.charging_wh ? lifetime.charging_wh / 1000 : 0) || 0;
          const baselineKwh = baseline?.charging_kwh || (baseline?.charging_wh ? baseline.charging_wh / 1000 : 0) || 0;
          evChargingKwh += Math.max(0, lifetimeKwh - baselineKwh);
        }
      }

      const totalActivityUnits = Math.floor(evMiles) + Math.floor(solarKwh) + Math.floor(batteryKwh) + Math.floor(evChargingKwh);
      setPendingActivity({ solarKwh, batteryKwh, evMiles, evChargingKwh, totalTokens: Math.floor(totalActivityUnits * 0.93) });
    } catch (error) {
      console.error('Error fetching pending activity:', error);
    } finally {
      setIsPendingLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); fetchPendingActivity(); }, [fetchTransactions, fetchPendingActivity]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchTransactions(), fetchPendingActivity()]);
    toast.success('Mint history updated');
  }, [fetchTransactions, fetchPendingActivity]);

  const getExplorerUrl = (txHash: string) => `https://sepolia.basescan.org/tx/${txHash}`;
  const totalTokensMinted = transactions.reduce((sum, t) => sum + Number(t.tokens_minted), 0);
  const totalNftsMinted = transactions.reduce((sum, t) => sum + (t.nfts_minted?.length || 0), 0);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Mint History</h1>
              <p className="text-muted-foreground text-sm">Complete breakdown of all minted tokens and NFTs</p>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tokens Received', value: totalTokensMinted, icon: Coins, gradient: 'from-primary to-accent', sub: '$ZSOLAR (93%)' },
            { label: 'NFTs Earned', value: totalNftsMinted, icon: Award, gradient: 'from-amber-500 to-orange-600', sub: 'Total NFTs' },
            { label: 'Transactions', value: transactions.length, icon: Hash, gradient: 'from-blue-500 to-indigo-600', sub: 'On-chain' },
            { label: 'Pending Tokens', value: pendingActivity.totalTokens, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600', sub: "You'll receive", loading: isPendingLoading },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-gradient-to-br from-card to-muted/30 border-0 shadow-lg overflow-hidden">
                <CardHeader className="pb-2 px-4">
                  <CardDescription className="text-xs">{stat.label}</CardDescription>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                    {stat.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : stat.value.toLocaleString()}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pending Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 via-background to-emerald-500/5 border-amber-500/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Pending Activity Breakdown
              </CardTitle>
              <CardDescription>Activity since last mint — you receive 93% as tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {isPendingLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : pendingActivity.totalTokens === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending activity</p>
                  <p className="text-sm">Connect your energy accounts to start earning!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Sun, label: 'Solar kWh', value: pendingActivity.solarKwh, gradient: 'from-amber-500 to-orange-600' },
                    { icon: Battery, label: 'Battery kWh', value: pendingActivity.batteryKwh, gradient: 'from-emerald-500 to-teal-600' },
                    { icon: Car, label: 'EV Miles', value: pendingActivity.evMiles, gradient: 'from-blue-500 to-indigo-600' },
                    { icon: Zap, label: 'EV Charging kWh', value: pendingActivity.evChargingKwh, gradient: 'from-purple-500 to-pink-600' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border border-border/50">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.gradient}`}>
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-xl font-bold block">{Math.floor(item.value).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hash className="h-5 w-5 text-primary" />
                  Transaction Details
                </CardTitle>
                {profile?.wallet_address && (
                  <a href={`https://sepolia.basescan.org/address/${profile.wallet_address}#tokentxns`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />View on BaseScan
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                transactions.map((tx) => {
                  const actionInfo = ACTION_LABELS[tx.action] || { label: tx.action, icon: <Coins className="h-4 w-4" />, gradient: 'from-muted to-muted', description: 'Transaction' };
                  const isExpanded = expandedTx === tx.id;
                  return (
                    <Collapsible key={tx.id} open={isExpanded} onOpenChange={() => setExpandedTx(isExpanded ? null : tx.id)}>
                      <div className="border rounded-xl overflow-hidden bg-card/50">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${actionInfo.gradient} text-white`}>{actionInfo.icon}</div>
                              <div className="text-left">
                                <p className="font-medium text-sm">{actionInfo.label}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                {tx.tokens_minted > 0 && <p className="font-semibold text-sm">{tx.tokens_minted.toLocaleString()} $ZSOLAR</p>}
                                {tx.nft_names?.length > 0 && <p className="text-xs text-muted-foreground">{tx.nft_names.length} NFT{tx.nft_names.length > 1 ? 's' : ''}</p>}
                              </div>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-0 border-t bg-muted/20 space-y-3">
                            <p className="text-xs text-muted-foreground pt-3">{actionInfo.description}</p>
                            {tx.nft_names?.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">NFTs Minted:</p>
                                <div className="flex flex-wrap gap-1.5">{tx.nft_names.map((name, i) => <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>)}</div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 bg-card rounded-lg"><span className="text-muted-foreground">Block:</span> <span className="font-mono">{tx.block_number || 'Pending'}</span></div>
                              <div className="p-2 bg-card rounded-lg"><span className="text-muted-foreground">Date:</span> {format(new Date(tx.created_at), 'MMM d, yyyy')}</div>
                            </div>
                            <a href={getExplorerUrl(tx.tx_hash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                              View on BaseScan <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PullToRefreshWrapper>
  );
}