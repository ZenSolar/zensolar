import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Award, Loader2, TrendingUp, Zap, Car, Battery, ExternalLink, Hash, Sparkles, ChevronDown, ChevronUp, Sun, Fuel } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  'register': { label: 'Welcome NFT', icon: <Award className="h-4 w-4" />, color: 'bg-amber-500', description: 'Received welcome NFT for joining ZenSolar' },
  'mint-rewards': { label: 'Token Mint', icon: <Coins className="h-4 w-4" />, color: 'bg-primary', description: 'Minted $ZSOLAR tokens from energy activity' },
  'mint-combos': { label: 'Combo NFTs', icon: <Sparkles className="h-4 w-4" />, color: 'bg-purple-500', description: 'Earned combo achievement NFTs' },
  'claim-milestone-nfts': { label: 'Milestone NFTs', icon: <Award className="h-4 w-4" />, color: 'bg-emerald-500', description: 'Claimed milestone achievement NFTs' },
};

export default function MintHistory() {
  const { profile } = useProfile();
  const [transactions, setTransactions] = useState<MintTransaction[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [pendingActivity, setPendingActivity] = useState<PendingActivity>({
    solarKwh: 0,
    batteryKwh: 0,
    evMiles: 0,
    evChargingKwh: 0,
    totalTokens: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mint_transactions')
        .select('*')
        .order('created_at', { ascending: false });

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
      if (!session) {
        setIsPendingLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('tesla_connected, enphase_connected, solaredge_connected')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const hasDedicatedSolarProvider = !!(profileData?.enphase_connected || profileData?.solaredge_connected);

      let solarKwh = 0;
      let batteryKwh = 0;
      let evMiles = 0;
      let evChargingKwh = 0;

      if (profileData?.enphase_connected) {
        const response = await supabase.functions.invoke('enphase-data', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.data?.totals) {
          solarKwh = (response.data.totals.lifetime_solar_wh || 0) / 1000;
        }
      }

      if (profileData?.tesla_connected) {
        const response = await supabase.functions.invoke('tesla-data', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.data?.totals) {
          const totals = response.data.totals;
          batteryKwh = (totals.battery_discharge_wh || 0) / 1000;
          evMiles = totals.ev_miles || 0;
          evChargingKwh = totals.ev_charging_kwh || 0;

          if (!hasDedicatedSolarProvider) {
            solarKwh += (totals.solar_production_wh || 0) / 1000;
          }
        }
      }

      const totalTokens =
        Math.floor(evMiles) +
        Math.floor(solarKwh) +
        Math.floor(batteryKwh) +
        Math.floor(evChargingKwh);

      setPendingActivity({
        solarKwh,
        batteryKwh,
        evMiles,
        evChargingKwh,
        totalTokens,
      });
    } catch (error) {
      console.error('Error fetching pending activity:', error);
    } finally {
      setIsPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchPendingActivity();
  }, [fetchTransactions, fetchPendingActivity]);

  const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  const totalTokensMinted = transactions.reduce((sum, t) => sum + Number(t.tokens_minted), 0);
  const totalNftsMinted = transactions.reduce((sum, t) => sum + (t.nfts_minted?.length || 0), 0);
  const totalTransactions = transactions.length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mint History</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Complete breakdown of all minted tokens and NFTs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardDescription className="text-xs sm:text-sm">Lifetime Minted</CardDescription>
            <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
              <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <span className="truncate">{totalTokensMinted.toLocaleString()}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">$ZSOLAR</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardDescription className="text-xs sm:text-sm">NFTs Earned</CardDescription>
            <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
              <span className="truncate">{totalNftsMinted}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Total NFTs</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardDescription className="text-xs sm:text-sm">Transactions</CardDescription>
            <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
              <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
              <span className="truncate">{totalTransactions}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">On-chain</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardDescription className="text-xs sm:text-sm">Pending</CardDescription>
            <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 text-amber-600">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              {isPendingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="truncate">{pendingActivity.totalTokens.toLocaleString()}</span>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Ready to mint</p>
          </CardHeader>
        </Card>
      </div>

      {/* Pending Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Pending Activity Breakdown
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Activity since last mint — will reset after minting</CardDescription>
        </CardHeader>
        <CardContent>
          {isPendingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingActivity.totalTokens === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending activity</p>
              <p className="text-sm">Connect your energy accounts to start earning!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <Sun className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-bold block">{Math.floor(pendingActivity.solarKwh).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Solar kWh</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Battery className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-bold block">{Math.floor(pendingActivity.batteryKwh).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Battery kWh</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Car className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-bold block">{Math.floor(pendingActivity.evMiles).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">EV Miles</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-bold block">{Math.floor(pendingActivity.evChargingKwh).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">EV Charging kWh</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History - Card-based for mobile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Hash className="h-5 w-5 text-primary" />
            Transaction Details
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">All minting transactions recorded on Base Sepolia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Mint tokens or NFTs to see them here!</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const actionInfo = ACTION_LABELS[tx.action] || { 
                label: tx.action, 
                icon: <Coins className="h-4 w-4" />,
                color: 'bg-muted',
                description: 'Minting transaction'
              };
              const isExpanded = expandedTx === tx.id;
              
              return (
                <Collapsible key={tx.id} open={isExpanded} onOpenChange={() => setExpandedTx(isExpanded ? null : tx.id)}>
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${actionInfo.color} text-white`}>
                            {actionInfo.icon}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">{actionInfo.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {tx.tokens_minted > 0 && (
                              <p className="font-semibold text-sm">{tx.tokens_minted.toLocaleString()} $ZSOLAR</p>
                            )}
                            {tx.nft_names && tx.nft_names.length > 0 && (
                              <p className="text-xs text-muted-foreground">{tx.nft_names.length} NFT{tx.nft_names.length > 1 ? 's' : ''}</p>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0 border-t bg-muted/30 space-y-3">
                        {/* Description */}
                        <p className="text-xs text-muted-foreground pt-3">{actionInfo.description}</p>
                        
                        {/* NFT Names */}
                        {tx.nft_names && tx.nft_names.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">NFTs Minted:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {tx.nft_names.map((name, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Transaction Details Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Transaction Hash</p>
                            <code className="bg-background px-2 py-1 rounded font-mono block truncate">
                              {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                            </code>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Block Number</p>
                            <p className="font-medium">{tx.block_number || 'Pending'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Date & Time</p>
                            <p className="font-medium">{format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Status</p>
                            <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                              {tx.status === 'confirmed' ? '✓ Confirmed' : tx.status}
                            </Badge>
                          </div>
                          {tx.gas_used && (
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Gas Used</p>
                              <div className="flex items-center gap-1">
                                <Fuel className="h-3 w-3" />
                                <span className="font-medium">{Number(tx.gas_used).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* View on Explorer */}
                        <a
                          href={getExplorerUrl(tx.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View on BaseScan
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

      {/* Wallet Info */}
      {profile?.wallet_address && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Connected Wallet</div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                  {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
                </code>
                <a
                  href={`https://sepolia.basescan.org/address/${profile.wallet_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
