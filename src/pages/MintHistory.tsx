import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Coins, Award, Loader2, TrendingUp, Zap, Car, Battery, PlugZap, ExternalLink, Hash, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';

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
}

interface PendingActivity {
  solarKwh: number;
  batteryKwh: number;
  evMiles: number;
  evChargingKwh: number;
  totalTokens: number;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'register': { label: 'Welcome NFT', icon: <Award className="h-4 w-4" />, color: 'bg-amber-500' },
  'mint-rewards': { label: 'Token Mint', icon: <Coins className="h-4 w-4" />, color: 'bg-primary' },
  'mint-combos': { label: 'Combo NFTs', icon: <Sparkles className="h-4 w-4" />, color: 'bg-purple-500' },
  'claim-milestone-nfts': { label: 'Milestone NFTs', icon: <Award className="h-4 w-4" />, color: 'bg-emerald-500' },
};

export default function MintHistory() {
  const { profile } = useProfile();
  const [transactions, setTransactions] = useState<MintTransaction[]>([]);
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('tesla_connected, enphase_connected, solaredge_connected')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const hasDedicatedSolarProvider = !!(profile?.enphase_connected || profile?.solaredge_connected);

      let solarKwh = 0;
      let batteryKwh = 0;
      let evMiles = 0;
      let evChargingKwh = 0;

      if (profile?.enphase_connected) {
        const response = await supabase.functions.invoke('enphase-data', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.data?.totals) {
          solarKwh = (response.data.totals.lifetime_solar_wh || 0) / 1000;
        }
      }

      if (profile?.tesla_connected) {
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Complete on-chain minting history with transaction hashes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tokens Minted</CardDescription>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{totalTokensMinted.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZSOLAR</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>NFTs Minted</CardDescription>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500 shrink-0" />
              <span className="truncate">{totalNftsMinted} NFTs</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Rewards</CardDescription>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-amber-600">
              <TrendingUp className="h-5 w-5 shrink-0" />
              {isPendingLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="truncate">{pendingActivity.totalTokens.toLocaleString()} $ZSOLAR</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Pending Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Pending Activity
          </CardTitle>
          <CardDescription className="text-sm">Current lifetime totals used for next mint calculation</CardDescription>
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
              <div className="flex flex-col items-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <Zap className="h-6 sm:h-8 w-6 sm:w-8 text-amber-500 mb-2" />
                <span className="text-lg sm:text-2xl font-bold">{pendingActivity.solarKwh.toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Solar kWh</span>
              </div>
              <div className="flex flex-col items-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <Battery className="h-6 sm:h-8 w-6 sm:w-8 text-green-500 mb-2" />
                <span className="text-lg sm:text-2xl font-bold">{pendingActivity.batteryKwh.toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Battery kWh</span>
              </div>
              <div className="flex flex-col items-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <Car className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500 mb-2" />
                <span className="text-lg sm:text-2xl font-bold">{pendingActivity.evMiles.toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">EV Miles</span>
              </div>
              <div className="flex flex-col items-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <PlugZap className="h-6 sm:h-8 w-6 sm:w-8 text-purple-500 mb-2" />
                <span className="text-lg sm:text-2xl font-bold">{pendingActivity.evChargingKwh.toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Charging kWh</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            On-Chain Transactions
          </CardTitle>
          <CardDescription>All minting transactions recorded on Base Sepolia</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="hidden md:table-cell">Transaction</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const actionInfo = ACTION_LABELS[tx.action] || { 
                      label: tx.action, 
                      icon: <Coins className="h-4 w-4" />,
                      color: 'bg-muted'
                    };
                    
                    return (
                      <TableRow key={tx.id} className="touch-target">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${actionInfo.color} text-white`}>
                              {actionInfo.icon}
                            </div>
                            <div className="hidden sm:block">
                              <span className="text-sm font-medium">{actionInfo.label}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {tx.tokens_minted > 0 && (
                              <div className="flex items-center gap-1">
                                <Coins className="h-3 w-3 text-primary" />
                                <span className="text-sm font-medium">
                                  {tx.tokens_minted.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZSOLAR
                                </span>
                              </div>
                            )}
                            {tx.nft_names && tx.nft_names.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {tx.nft_names.slice(0, 3).map((name, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                                {tx.nft_names.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{tx.nft_names.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                          </code>
                          {tx.block_number && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Block #{tx.block_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(tx.created_at), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs">
                            {format(new Date(tx.created_at), 'h:mm a')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={getExplorerUrl(tx.tx_hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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