import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Coins, Award, Loader2, TrendingUp, Zap, Car, BatteryFull, ExternalLink, Hash, Sparkles, ChevronDown, ChevronUp, Sun, Clock, ArrowUpRight, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { PullToRefreshWrapper } from '@/components/ui/PullToRefreshWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_NFT_ADDRESS } from '@/lib/wagmi';
import { isPreviewMode } from '@/lib/previewMode';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/PageShell';
import { PageTransition } from '@/components/layout/PageTransition';
import { JargonTip } from '@/components/ui/jargon-tip';

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
  'register': { label: 'Welcome NFT', icon: <Award className="h-4 w-4" />, gradient: 'from-accent-warm to-accent-warm/70', description: 'Received welcome NFT for joining ZenSolar' },
  'mint-rewards': { label: 'Token Mint', icon: <Coins className="h-4 w-4" />, gradient: 'from-primary to-primary/70', description: 'Minted $ZSOLAR tokens from energy activity' },
  'mint-combos': { label: 'Combo NFTs', icon: <Sparkles className="h-4 w-4" />, gradient: 'from-accent-rare to-accent-rare/70', description: 'Earned combo achievement NFTs' },
  'claim-milestone-nfts': { label: 'Milestone NFTs', icon: <Award className="h-4 w-4" />, gradient: 'from-primary to-primary/70', description: 'Claimed milestone achievement NFTs' },
};

export default function MintHistory() {
  const navigate = useNavigate();
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
      // Get current session to ensure we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, cannot fetch transactions');
        setIsLoading(false);
        return;
      }
      
      // RLS will filter to only show current user's transactions
      const { data, error } = await supabase
        .from('mint_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching mint transactions:', error);
        throw error;
      }
      
      console.log('Fetched mint transactions:', data?.length || 0, 'records');
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
      // Apply Live Beta multiplier (10x or 1x) then 75% user share
      const { getRewardMultiplier } = await import('@/lib/tokenomics');
      const multiplier = getRewardMultiplier();
      const totalTokens = Math.floor(totalActivityUnits * multiplier * 0.75);
      setPendingActivity({ solarKwh, batteryKwh, evMiles, evChargingKwh, totalTokens });
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
  const getTokenContractUrl = () => `https://sepolia.basescan.org/token/${ZSOLAR_TOKEN_ADDRESS}`;
  const getNftContractUrl = () => `https://sepolia.basescan.org/token/${ZSOLAR_NFT_ADDRESS}`;
  const getNftTokenUrl = (tokenId: number) => `https://sepolia.basescan.org/token/${ZSOLAR_NFT_ADDRESS}?a=${tokenId}`;
  const getTokenTransferUrl = (txHash: string) => `https://sepolia.basescan.org/tx/${txHash}#tokentxns`;
  const previewMode = isPreviewMode();
  const totalTokensMinted = transactions.reduce((sum, t) => sum + Number(t.tokens_minted), 0);
  const totalNftsMinted = transactions.reduce((sum, t) => sum + (t.nfts_minted?.length || 0), 0);

  return (
    <PageTransition>
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <PageShell
        title="Mint History"
        description="Every $ZSOLAR and NFT you've earned, with on-chain proof."
        icon={Clock}
        width="4xl"
      >
        <div className="space-y-5 sm:space-y-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            { label: 'Tokens Received', value: totalTokensMinted, icon: Coins, gradient: 'from-primary to-primary/60', iconFg: 'text-primary-foreground', sub: '$ZSOLAR (75%)' },
            { label: 'NFTs Earned', value: totalNftsMinted, icon: Award, gradient: 'from-accent-warm to-accent-warm/60', iconFg: 'text-accent-warm-foreground', sub: 'Total NFTs' },
            { label: 'Transactions', value: transactions.length, icon: Hash, gradient: 'from-accent-cool to-accent-cool/60', iconFg: 'text-accent-cool-foreground', sub: 'On-chain' },
            { label: 'Pending Tokens', value: pendingActivity.totalTokens, icon: TrendingUp, gradient: 'from-primary to-primary/60', iconFg: 'text-primary-foreground', sub: "You'll receive", loading: isPendingLoading },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-gradient-to-br from-card to-muted/30 border-0 border-l-2 border-l-primary/60 shadow-lg overflow-hidden h-full">
                <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardDescription className="text-[10px] sm:text-xs leading-tight">{stat.label}</CardDescription>
                  <CardTitle className="text-base sm:text-xl flex items-center gap-1.5 sm:gap-2 tracking-tight tabular-nums min-w-0">
                    <div className={`p-1 sm:p-1.5 rounded-lg bg-gradient-to-br ${stat.gradient} shrink-0`}>
                      <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.iconFg}`} />
                    </div>
                    <span className="truncate">{stat.loading ? <Skeleton className="h-5 w-10 sm:h-6 sm:w-12" /> : stat.value.toLocaleString()}</span>
                  </CardTitle>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{stat.sub}</p>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pending Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-accent-warm/10 via-background to-primary/5 border-accent-warm/20 shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-5 w-5 text-accent-warm shrink-0" />
                Pending Activity Breakdown
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm leading-relaxed">
                Activity since your last <JargonTip term="mint">mint</JargonTip> — you receive 75% as <JargonTip term="zsolar">$ZSOLAR</JargonTip> (20% burn).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPendingLoading ? (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  {[0,1,2,3].map(i => <Skeleton key={i} className="h-[68px] sm:h-20 w-full rounded-xl" />)}
                </div>
              ) : pendingActivity.totalTokens === 0 ? (
                <EmptyState
                  icon={Coins}
                  title="No pending activity"
                  description="Connect your energy accounts to start earning $ZSOLAR rewards on every kWh."
                  className="py-8"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  {[
                    { icon: Sun, label: 'Solar kWh', value: pendingActivity.solarKwh, gradient: 'from-accent-warm to-accent-warm/60', iconFg: 'text-accent-warm-foreground' },
                    { icon: BatteryFull, label: 'Battery kWh', value: pendingActivity.batteryKwh, gradient: 'from-primary to-primary/60', iconFg: 'text-primary-foreground' },
                    { icon: Car, label: 'EV Miles', value: pendingActivity.evMiles, gradient: 'from-accent-cool to-accent-cool/60', iconFg: 'text-accent-cool-foreground' },
                    { icon: Zap, label: 'Charging kWh', value: pendingActivity.evChargingKwh, gradient: 'from-accent-rare to-accent-rare/60', iconFg: 'text-accent-rare-foreground' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-card/50 rounded-xl border border-border/50 min-w-0">
                      <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${item.gradient} shrink-0`}>
                        <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.iconFg}`} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-lg sm:text-xl font-bold tracking-tight tabular-nums block leading-none">{Math.floor(item.value).toLocaleString()}</span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground block mt-1 truncate">{item.label}</span>
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
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Hash className="h-5 w-5 text-primary shrink-0" />
                  Transaction Details
                </CardTitle>
                {profile?.wallet_address && (
                  <a href={`https://sepolia.basescan.org/address/${profile.wallet_address}#tokentxns`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-primary hover:underline touch-target px-1 -mx-1">
                    <ExternalLink className="h-3.5 w-3.5" />BaseScan
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon={Coins}
                  title="Start Your Journey"
                  description="Every kWh of clean energy you generate or mile you drive earns $ZSOLAR. Tap below to connect your devices and mint your first rewards."
                  action={{ label: "Start earning $ZSOLAR today", onClick: () => navigate('/dashboard') }}
                  className="py-10"
                />
              ) : (
                transactions.map((tx) => {
                  const actionInfo = ACTION_LABELS[tx.action] || { label: tx.action, icon: <Coins className="h-4 w-4" />, gradient: 'from-muted to-muted', description: 'Transaction' };
                  const isExpanded = expandedTx === tx.id;
                  return (
                    <Collapsible key={tx.id} open={isExpanded} onOpenChange={() => setExpandedTx(isExpanded ? null : tx.id)}>
                      <div className="border rounded-xl overflow-hidden bg-card/50">
                        <CollapsibleTrigger className="w-full touch-target">
                          <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/30 active:bg-muted/40 transition-colors gap-3">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${actionInfo.gradient} text-primary-foreground shrink-0`}>{actionInfo.icon}</div>
                              <div className="text-left min-w-0">
                                <p className="font-medium text-sm truncate">{actionInfo.label}</p>
                                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              <div className="text-right">
                                {tx.tokens_minted > 0 && <p className="font-semibold text-xs sm:text-sm tabular-nums">{tx.tokens_minted.toLocaleString()}<span className="text-muted-foreground font-normal ml-1">$ZSOLAR</span></p>}
                                {tx.nft_names?.length > 0 && <p className="text-[11px] sm:text-xs text-muted-foreground">{tx.nft_names.length} NFT{tx.nft_names.length > 1 ? 's' : ''}</p>}
                              </div>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-0 border-t bg-muted/20 space-y-4">
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

                            {/* On-chain proof links */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                <p className="text-xs font-medium text-foreground">On-Chain Proof</p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <a
                                  href={getExplorerUrl(tx.tx_hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-2 p-2.5 bg-card rounded-lg border border-border/50 hover:border-primary/40 transition-colors group"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Hash className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transaction</p>
                                      <p className="text-xs font-mono truncate">{tx.tx_hash.slice(0, 10)}…{tx.tx_hash.slice(-6)}</p>
                                    </div>
                                  </div>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                                </a>

                                {tx.tokens_minted > 0 && (
                                  <a
                                    href={getTokenTransferUrl(tx.tx_hash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 p-2.5 bg-card rounded-lg border border-border/50 hover:border-primary/40 transition-colors group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Coins className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ERC-20 Transfer</p>
                                        <p className="text-xs truncate">{tx.tokens_minted.toLocaleString()} $ZSOLAR</p>
                                      </div>
                                    </div>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                                  </a>
                                )}

                                <a
                                  href={getTokenContractUrl()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-2 p-2.5 bg-card rounded-lg border border-border/50 hover:border-primary/40 transition-colors group"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">$ZSOLAR Contract</p>
                                      <p className="text-xs font-mono truncate">{ZSOLAR_TOKEN_ADDRESS.slice(0, 8)}…{ZSOLAR_TOKEN_ADDRESS.slice(-4)}</p>
                                    </div>
                                  </div>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                                </a>

                                {tx.nfts_minted?.length > 0 && (
                                  <a
                                    href={getNftContractUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 p-2.5 bg-card rounded-lg border border-border/50 hover:border-primary/40 transition-colors group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <ImageIcon className="h-3.5 w-3.5 text-accent-rare flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">NFT Contract</p>
                                        <p className="text-xs font-mono truncate">{ZSOLAR_NFT_ADDRESS.slice(0, 8)}…{ZSOLAR_NFT_ADDRESS.slice(-4)}</p>
                                      </div>
                                    </div>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                                  </a>
                                )}
                              </div>

                              {/* Per-NFT token-id links */}
                              {tx.nfts_minted?.length > 0 && (
                                <div className="pt-1">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">NFT Token IDs & Metadata</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {tx.nfts_minted.map((tokenId, i) => (
                                      <a
                                        key={`${tokenId}-${i}`}
                                        href={getNftTokenUrl(tokenId)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-card border border-border/50 hover:border-accent-rare/40 text-xs font-mono transition-colors"
                                        title={tx.nft_names?.[i] || `NFT #${tokenId}`}
                                      >
                                        #{tokenId}
                                        <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Proof of Genesis link — preview only */}
                              {previewMode && (
                                <Link
                                  to="/proof-of-genesis-receipt-preview"
                                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-accent-warm/10 border border-primary/30 hover:border-primary/60 transition-colors group"
                                >
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    <div>
                                      <p className="text-xs font-medium">Proof of Genesis Receipt</p>
                                      <p className="text-[10px] text-muted-foreground">Verified kWh → tokens → CO₂ offset</p>
                                    </div>
                                  </div>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Link>
                              )}
                            </div>
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
      </PageShell>
    </PullToRefreshWrapper>
    </PageTransition>
  );
}