import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Coins, Award, Loader2 } from 'lucide-react';
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

export default function MintHistory() {
  const [records, setRecords] = useState<MintRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMintHistory();
  }, []);

  const fetchMintHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching mint history:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const totalTokens = records.reduce((sum, r) => sum + Number(r.tokens_earned), 0);
  const totalClaimed = records.filter(r => r.claimed).reduce((sum, r) => sum + Number(r.tokens_earned), 0);
  const totalPending = totalTokens - totalClaimed;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minting History</h1>
        <p className="text-muted-foreground">Track your token and NFT minting activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              {totalTokens.toLocaleString()} $ZSOLAR
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Claimed</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {totalClaimed.toLocaleString()} $ZSOLAR
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {totalPending.toLocaleString()} $ZSOLAR
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>All your minting transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No minting activity yet</p>
              <p className="text-sm">Connect your energy accounts and start earning!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Energy Basis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
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
                      {(Number(record.energy_wh_basis) / 1000).toFixed(2)} kWh
                    </TableCell>
                    <TableCell>
                      {record.claimed ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Claimed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}
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
