import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, Award, Loader2, TrendingUp, Zap, Car, Battery, PlugZap } from 'lucide-react';
import { format } from 'date-fns';

interface MintRecord {
  id: string;
  reward_type: string;
  tokens_earned: number;
  energy_wh_basis: number;
  claimed: boolean;
  claimed_at: string | null;
  calculated_at: string;
  created_at: string;
}

interface PendingActivity {
  solarKwh: number;
  batteryKwh: number;
  evMiles: number;
  evChargingKwh: number;
  totalTokens: number;
}

export default function MintHistory() {
  const [mintedRecords, setMintedRecords] = useState<MintRecord[]>([]);
  const [pendingActivity, setPendingActivity] = useState<PendingActivity>({
    solarKwh: 0,
    batteryKwh: 0,
    evMiles: 0,
    evChargingKwh: 0,
    totalTokens: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);

  const fetchMintHistory = useCallback(async () => {
    try {
      // Only fetch claimed (minted) records
      const { data, error } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('claimed', true)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      setMintedRecords(data || []);
    } catch (error) {
      console.error('Error fetching mint history:', error);
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

      // Get user profile to check connections
      const { data: profile } = await supabase
        .from('profiles')
        .select('tesla_connected, enphase_connected')
        .eq('user_id', session.user.id)
        .maybeSingle();

      let pendingSolar = 0;
      let pendingBattery = 0;
      let pendingMiles = 0;
      let pendingEvCharging = 0;

      // Fetch Tesla pending data
      if (profile?.tesla_connected) {
        const response = await supabase.functions.invoke('tesla-data', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.data?.totals) {
          const totals = response.data.totals;
          pendingSolar += (totals.pending_solar_wh || 0) / 1000;
          pendingBattery += (totals.pending_battery_discharge_wh || 0) / 1000;
          pendingMiles += totals.pending_ev_miles || 0;
          pendingEvCharging += totals.pending_ev_charging_kwh || 0;
        }
      }

      // Fetch Enphase pending data
      if (profile?.enphase_connected) {
        const response = await supabase.functions.invoke('enphase-data', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.data?.totals) {
          const totals = response.data.totals;
          pendingSolar += (totals.pending_solar_wh || 0) / 1000;
        }
      }

      // Calculate total tokens: 1 per mile, 1 per kWh of each type
      const totalTokens = Math.floor(
        pendingMiles + pendingSolar + pendingBattery + pendingEvCharging
      );

      setPendingActivity({
        solarKwh: pendingSolar,
        batteryKwh: pendingBattery,
        evMiles: pendingMiles,
        evChargingKwh: pendingEvCharging,
        totalTokens,
      });
    } catch (error) {
      console.error('Error fetching pending activity:', error);
    } finally {
      setIsPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMintHistory();
    fetchPendingActivity();
  }, [fetchMintHistory, fetchPendingActivity]);

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'nft':
        return <Award className="h-4 w-4 text-primary" />;
      default:
        return <Coins className="h-4 w-4 text-primary" />;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'nft':
        return 'NFT Mint';
      case 'production':
        return '$ZSOLAR Tokens';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const totalMinted = mintedRecords.reduce((sum, r) => sum + Number(r.tokens_earned), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minting History</h1>
        <p className="text-muted-foreground">Track your token and NFT minting activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Minted</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              {totalMinted.toLocaleString()} $ZSOLAR
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Rewards</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-amber-600">
              <TrendingUp className="h-5 w-5" />
              {isPendingLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `${pendingActivity.totalTokens.toLocaleString()} $ZSOLAR`
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
            Pending Rewards
          </CardTitle>
          <CardDescription>Activity since your last mint (ready to claim)</CardDescription>
        </CardHeader>
        <CardContent>
          {isPendingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingActivity.totalTokens === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending rewards</p>
              <p className="text-sm">Connect your energy accounts and use clean energy to start earning!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Zap className="h-8 w-8 text-amber-500 mb-2" />
                <span className="text-2xl font-bold">{pendingActivity.solarKwh.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">Solar kWh</span>
                <span className="text-xs text-primary">+{Math.floor(pendingActivity.solarKwh)} tokens</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Battery className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-2xl font-bold">{pendingActivity.batteryKwh.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">Battery kWh</span>
                <span className="text-xs text-primary">+{Math.floor(pendingActivity.batteryKwh)} tokens</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Car className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-2xl font-bold">{pendingActivity.evMiles.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">EV Miles</span>
                <span className="text-xs text-primary">+{Math.floor(pendingActivity.evMiles)} tokens</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <PlugZap className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-2xl font-bold">{pendingActivity.evChargingKwh.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">EV Charging kWh</span>
                <span className="text-xs text-primary">+{Math.floor(pendingActivity.evChargingKwh)} tokens</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minting History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Minting History
          </CardTitle>
          <CardDescription>Tokens and NFTs you've minted to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : mintedRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No mints yet</p>
              <p className="text-sm">Click 'MINT $ZSOLAR TOKENS' on the dashboard to claim your rewards!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date Minted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mintedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRewardTypeIcon(record.reward_type)}
                        <span>{getRewardTypeLabel(record.reward_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.tokens_earned.toLocaleString()} $ZSOLAR
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.claimed_at 
                        ? format(new Date(record.claimed_at), 'MMM d, yyyy h:mm a')
                        : format(new Date(record.created_at), 'MMM d, yyyy h:mm a')
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
