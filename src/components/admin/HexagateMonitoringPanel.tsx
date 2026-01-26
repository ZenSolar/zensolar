import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw,
  Shield,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

// Contract addresses for monitoring
const CONTRACTS = {
  ZSOLAR_TOKEN: '0x...', // Replace with actual deployed address
  ZENSOLAR_NFT: '0x...', // Replace with actual deployed address
  ZENSOLAR_MAIN: '0x...', // Replace with actual deployed address
};

interface MonitoringAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

interface OnChainMetrics {
  totalMints24h: number;
  uniqueWallets24h: number;
  largestMint24h: number;
  avgMintSize: number;
  gasUsed24h: string;
  lastActivityTime: Date | null;
}

export function HexagateMonitoringPanel() {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [metrics, setMetrics] = useState<OnChainMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Simulated metrics for development - replace with actual Hexagate API calls
  const fetchMetrics = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Integrate with Hexagate API when configured
      // For now, show placeholder data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        totalMints24h: 0,
        uniqueWallets24h: 0,
        largestMint24h: 0,
        avgMintSize: 0,
        gasUsed24h: '0 ETH',
        lastActivityTime: null,
      });
      
      setAlerts([
        {
          id: '1',
          type: 'info',
          title: 'Monitoring Not Configured',
          description: 'Configure Hexagate API key to enable real-time on-chain monitoring',
          timestamp: new Date(),
          resolved: false,
        }
      ]);
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('[Hexagate] Failed to fetch metrics:', error);
      toast.error('Failed to fetch monitoring data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <Activity className="h-4 w-4 text-blue-400" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/20 text-amber-400">Warning</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">On-Chain Monitoring</h3>
            <p className="text-sm text-muted-foreground">
              Real-time contract activity via Hexagate
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mints (24h)</p>
                <p className="text-2xl font-bold">{metrics?.totalMints24h ?? '-'}</p>
              </div>
              <Zap className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Wallets</p>
                <p className="text-2xl font-bold">{metrics?.uniqueWallets24h ?? '-'}</p>
              </div>
              <Wallet className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Mint Size</p>
                <p className="text-2xl font-bold">
                  {metrics?.avgMintSize ? `${metrics.avgMintSize.toLocaleString()} ZSOLAR` : '-'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Addresses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Monitored Contracts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">$ZSOLAR Token</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {CONTRACTS.ZSOLAR_TOKEN.slice(0, 10)}...
            </code>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">ZenSolar NFT</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {CONTRACTS.ZENSOLAR_NFT.slice(0, 10)}...
            </code>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">ZenSolar Main</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {CONTRACTS.ZENSOLAR_MAIN.slice(0, 10)}...
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No alerts - all systems operational
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{alert.title}</span>
                      {getAlertBadge(alert.type)}
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Setup Hexagate Monitoring</CardTitle>
          <CardDescription>
            Hexagate offers free monitoring for Base L2 builders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
            <li>Sign up at <a href="https://www.hexagate.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">hexagate.com</a></li>
            <li>Apply for Base builder free tier</li>
            <li>Add your contract addresses to the dashboard</li>
            <li>Configure alert thresholds (large transfers, unusual activity)</li>
            <li>Add API key to Lovable Cloud secrets</li>
          </ol>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <a 
              href="https://www.hexagate.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Hexagate Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
