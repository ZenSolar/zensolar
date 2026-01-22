import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, BarChart3, TrendingUp, Users, Zap, 
  Wallet, Award, Globe, RefreshCw,
  Activity, Target, Clock, ExternalLink, MapPin, Smartphone, Monitor, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ExportButtons } from '@/components/admin/ExportButtons';

// Types for our analytics data
interface DailyMetric {
  date: string;
  users: number;
  walletConnections: number;
  nftMints: number;
  tokenClaims: number;
}

interface DeviceBreakdown {
  name: string;
  value: number;
  fill: string;
}

interface ProviderBreakdown {
  provider: string;
  count: number;
  fill: string;
}

interface UserGrowth {
  date: string;
  totalUsers: number;
  newUsers: number;
}

interface TopPerformers {
  userId: string;
  displayName: string;
  solarKwh: number;
  evMiles: number;
  chargingKwh: number;
  nftsOwned: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminChecking } = useAdminCheck();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Analytics state
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalWallets, setTotalWallets] = useState(0);
  const [totalNFTsMinted, setTotalNFTsMinted] = useState(0);
  const [totalTokensMinted, setTotalTokensMinted] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);
  
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyMetric[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([]);
  const [providerBreakdown, setProviderBreakdown] = useState<ProviderBreakdown[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformers[]>([]);
  
  // Time range state
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = async () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), days);
    
    try {
      // Parallel fetch all data
      const [
        profilesResult,
        devicesResult,
        mintTxResult,
        rewardsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id, user_id, created_at, wallet_address, display_name, tesla_connected, enphase_connected, solaredge_connected, wallbox_connected'),
        supabase.from('connected_devices').select('id, user_id, provider, device_type, created_at, lifetime_totals'),
        supabase.from('mint_transactions').select('id, user_id, created_at, action, tokens_minted, nfts_minted'),
        supabase.from('user_rewards').select('id, user_id, tokens_earned, created_at'),
      ]);

      const profiles = profilesResult.data || [];
      const devices = devicesResult.data || [];
      const mintTx = mintTxResult.data || [];
      const rewards = rewardsResult.data || [];

      // Calculate totals
      setTotalUsers(profiles.length);
      setTotalWallets(profiles.filter(p => p.wallet_address).length);
      setTotalDevices(devices.length);
      
      // Active users (those with devices or recent activity)
      const activeUserIds = new Set([
        ...devices.map(d => d.user_id),
        ...mintTx.filter(tx => new Date(tx.created_at) >= startDate).map(tx => tx.user_id)
      ]);
      setActiveUsers(activeUserIds.size);
      
      // Total NFTs and tokens minted
      const totalNFTs = mintTx.reduce((sum, tx) => sum + (tx.nfts_minted?.length || 0), 0);
      const totalTokens = mintTx.reduce((sum, tx) => sum + (tx.tokens_minted || 0), 0);
      setTotalNFTsMinted(totalNFTs);
      setTotalTokensMinted(totalTokens);

      // User growth over time
      const growthData: UserGrowth[] = [];
      for (let i = days; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const dateStr = format(date, 'yyyy-MM-dd');
        const usersOnDate = profiles.filter(p => new Date(p.created_at) <= date).length;
        const newOnDate = profiles.filter(p => format(new Date(p.created_at), 'yyyy-MM-dd') === dateStr).length;
        growthData.push({
          date: format(date, 'MMM dd'),
          totalUsers: usersOnDate,
          newUsers: newOnDate,
        });
      }
      setUserGrowth(growthData);

      // Daily activity (simplified - in production you'd get this from GA)
      const activityData: DailyMetric[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const newUsers = profiles.filter(p => format(new Date(p.created_at), 'yyyy-MM-dd') === dateStr).length;
        const walletsLinked = profiles.filter(p => p.wallet_address && format(new Date(p.created_at), 'yyyy-MM-dd') === dateStr).length;
        const nftMints = mintTx.filter(tx => 
          format(new Date(tx.created_at), 'yyyy-MM-dd') === dateStr && 
          (tx.nfts_minted?.length || 0) > 0
        ).length;
        const tokenClaims = mintTx.filter(tx => 
          format(new Date(tx.created_at), 'yyyy-MM-dd') === dateStr && 
          tx.action === 'mint-rewards'
        ).length;
        
        activityData.push({
          date: format(date, 'MMM dd'),
          users: newUsers,
          walletConnections: walletsLinked,
          nftMints,
          tokenClaims,
        });
      }
      setDailyActivity(activityData);

      // Device breakdown
      const deviceTypes: Record<string, number> = {};
      devices.forEach(d => {
        const type = d.device_type || 'Unknown';
        deviceTypes[type] = (deviceTypes[type] || 0) + 1;
      });
      setDeviceBreakdown(
        Object.entries(deviceTypes).map(([name, value], i) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          fill: COLORS[i % COLORS.length],
        }))
      );

      // Provider breakdown
      const providers: Record<string, number> = {};
      devices.forEach(d => {
        const provider = d.provider || 'Unknown';
        providers[provider] = (providers[provider] || 0) + 1;
      });
      setProviderBreakdown(
        Object.entries(providers).map(([provider, count], i) => ({
          provider: provider.charAt(0).toUpperCase() + provider.slice(1),
          count,
          fill: COLORS[i % COLORS.length],
        }))
      );

      // Top performers (by energy production)
      const userStats: Record<string, TopPerformers> = {};
      devices.forEach(d => {
        if (!userStats[d.user_id]) {
          const profile = profiles.find(p => p.user_id === d.user_id);
          userStats[d.user_id] = {
            userId: d.user_id,
            displayName: profile?.display_name || 'Anonymous',
            solarKwh: 0,
            evMiles: 0,
            chargingKwh: 0,
            nftsOwned: 0,
          };
        }
        
        const totals = d.lifetime_totals as Record<string, number> | null;
        if (totals) {
          const solarWh = totals.solar_wh || totals.lifetime_solar_wh || 0;
          userStats[d.user_id].solarKwh += solarWh / 1000;
          userStats[d.user_id].evMiles += totals.odometer || totals.ev_miles || 0;
          const chargingKwh = totals.charging_kwh || totals.lifetime_charging_kwh || 0;
          userStats[d.user_id].chargingKwh += chargingKwh > 10000 ? chargingKwh / 1000 : chargingKwh;
        }
      });
      
      // Count NFTs per user
      mintTx.forEach(tx => {
        if (userStats[tx.user_id]) {
          userStats[tx.user_id].nftsOwned += tx.nfts_minted?.length || 0;
        }
      });
      
      const sortedPerformers = Object.values(userStats)
        .sort((a, b) => b.solarKwh - a.solarKwh)
        .slice(0, 10);
      setTopPerformers(sortedPerformers);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    }
  };

  useEffect(() => {
    if (!authLoading && !adminChecking) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!isAdmin) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      fetchAnalytics().finally(() => setIsLoading(false));
    }
  }, [user, authLoading, adminChecking, isAdmin, navigate, timeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
    toast.success('Analytics refreshed');
  };

  if (authLoading || adminChecking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Export data helper
  const getExportData = () => [
    { section: "KPIs", metric: "Total Users", value: totalUsers },
    { section: "KPIs", metric: "Active Users", value: activeUsers },
    { section: "KPIs", metric: "Wallets Connected", value: totalWallets },
    { section: "KPIs", metric: "Total Devices", value: totalDevices },
    { section: "KPIs", metric: "NFTs Minted", value: totalNFTsMinted },
    { section: "KPIs", metric: "Tokens Minted", value: totalTokensMinted },
    ...userGrowth.map(d => ({ section: "User Growth", date: d.date, totalUsers: d.totalUsers, newUsers: d.newUsers })),
    ...deviceBreakdown.map(d => ({ section: "Devices", type: d.name, count: d.value })),
    ...providerBreakdown.map(d => ({ section: "Providers", provider: d.provider, count: d.count })),
  ];

  return (
    <div className="container max-w-7xl mx-auto px-4 pt-4 pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="text-primary border-primary">
            <BarChart3 className="h-3 w-3 mr-1" />
            Analytics
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time insights into user engagement, conversions, and energy data
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons pageTitle="Analytics" getData={getExportData} />
          <div className="flex border rounded-lg overflow-hidden">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="rounded-none"
              >
                {range === '7d' ? '7D' : range === '30d' ? '30D' : '90D'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-500" />
              <Badge variant="secondary" className="text-xs">Total</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(totalUsers)}</p>
            <p className="text-xs text-muted-foreground">Registered Users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-green-500" />
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(activeUsers)}</p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Wallet className="h-5 w-5 text-purple-500" />
              <Badge variant="secondary" className="text-xs">Linked</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(totalWallets)}</p>
            <p className="text-xs text-muted-foreground">Wallets Connected</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-yellow-500" />
              <Badge variant="secondary" className="text-xs">Devices</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(totalDevices)}</p>
            <p className="text-xs text-muted-foreground">Connected Devices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Award className="h-5 w-5 text-amber-500" />
              <Badge variant="secondary" className="text-xs">NFTs</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(totalNFTsMinted)}</p>
            <p className="text-xs text-muted-foreground">NFTs Minted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-xs">Tokens</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(totalTokensMinted)}</p>
            <p className="text-xs text-muted-foreground">$ZSOLAR Minted</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1 p-1 bg-muted/50">
          <TabsTrigger value="overview" className="px-3 py-2 data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="engagement" className="px-3 py-2 data-[state=active]:bg-background">Engagement</TabsTrigger>
          <TabsTrigger value="devices" className="px-3 py-2 data-[state=active]:bg-background">Devices</TabsTrigger>
          <TabsTrigger value="geographic" className="px-3 py-2 data-[state=active]:bg-background">Geographic</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  User Growth
                </CardTitle>
                <CardDescription>Total and new user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowth}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalUsers" 
                        stroke="#22c55e" 
                        fillOpacity={1} 
                        fill="url(#colorUsers)" 
                        name="Total Users"
                      />
                      <Bar dataKey="newUsers" fill="#3b82f6" name="New Users" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Daily Activity
                </CardTitle>
                <CardDescription>Key actions per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" name="New Users" strokeWidth={2} />
                      <Line type="monotone" dataKey="walletConnections" stroke="#8b5cf6" name="Wallets" strokeWidth={2} />
                      <Line type="monotone" dataKey="nftMints" stroke="#f59e0b" name="NFT Mints" strokeWidth={2} />
                      <Line type="monotone" dataKey="tokenClaims" stroke="#22c55e" name="Token Claims" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Top Energy Producers
              </CardTitle>
              <CardDescription>Users with the highest lifetime energy metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium">#</th>
                      <th className="text-left py-2 px-2 font-medium">User</th>
                      <th className="text-right py-2 px-2 font-medium">Solar (kWh)</th>
                      <th className="text-right py-2 px-2 font-medium">EV Miles</th>
                      <th className="text-right py-2 px-2 font-medium">Charging (kWh)</th>
                      <th className="text-right py-2 px-2 font-medium">NFTs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((performer, i) => (
                      <tr key={performer.userId} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 px-2 font-medium">{performer.displayName}</td>
                        <td className="py-2 px-2 text-right text-primary">{formatNumber(performer.solarKwh)}</td>
                        <td className="py-2 px-2 text-right text-blue-500">{formatNumber(performer.evMiles)}</td>
                        <td className="py-2 px-2 text-right text-green-500">{formatNumber(performer.chargingKwh)}</td>
                        <td className="py-2 px-2 text-right">
                          <Badge variant="secondary">{performer.nftsOwned}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>User journey through key milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Registered</span>
                      <span className="text-sm font-medium">{totalUsers}</span>
                    </div>
                    <div className="h-3 bg-primary rounded-full w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Wallet Connected</span>
                      <span className="text-sm font-medium">{totalWallets} ({totalUsers > 0 ? Math.round((totalWallets / totalUsers) * 100) : 0}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ width: `${totalUsers > 0 ? (totalWallets / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Device Connected</span>
                      <span className="text-sm font-medium">{activeUsers} ({totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%)</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full">
                      <div 
                        className="h-full bg-yellow-500 rounded-full" 
                        style={{ width: `${totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Minted NFT/Token</span>
                      <span className="text-sm font-medium">
                        {totalNFTsMinted > 0 || totalTokensMinted > 0 ? 'Active' : '0'} 
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${totalUsers > 0 && (totalNFTsMinted > 0 || totalTokensMinted > 0) ? Math.min(30, (activeUsers / totalUsers) * 50) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats - Link to GA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Session Analytics
                </CardTitle>
                <CardDescription>Detailed session data from Google Analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    View detailed session metrics, bounce rates, and engagement data in your Google Analytics dashboard.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://analytics.google.com/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Google Analytics
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Avg. Session</p>
                    <p className="font-medium">View in GA</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Bounce Rate</p>
                    <p className="font-medium">View in GA</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Pages/Session</p>
                    <p className="font-medium">View in GA</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Returning Users</p>
                    <p className="font-medium">View in GA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custom Events Tracked */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Custom Events Being Tracked
              </CardTitle>
              <CardDescription>These events are automatically sent to Google Analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <Wallet className="h-6 w-6 text-purple-500 mb-2" />
                  <p className="font-medium">wallet_connect</p>
                  <p className="text-xs text-muted-foreground">When a user connects their wallet</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Wallet className="h-6 w-6 text-green-500 mb-2" />
                  <p className="font-medium">wallet_linked</p>
                  <p className="text-xs text-muted-foreground">When wallet is saved to profile</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Award className="h-6 w-6 text-amber-500 mb-2" />
                  <p className="font-medium">nft_mint</p>
                  <p className="text-xs text-muted-foreground">When an NFT is successfully minted</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Zap className="h-6 w-6 text-primary mb-2" />
                  <p className="font-medium">token_claim</p>
                  <p className="text-xs text-muted-foreground">When $ZSOLAR tokens are claimed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Device Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Device Types
                </CardTitle>
                <CardDescription>Connected devices by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Provider Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Energy Providers
                </CardTitle>
                <CardDescription>Connected devices by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={providerBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="provider" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" name="Devices">
                        {providerBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-500" />
                Geographic Data
              </CardTitle>
              <CardDescription>User location insights from Google Analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Cities & States Data in Google Analytics</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Google Analytics 4 automatically collects geographic data including:
                    </p>
                    <ul className="text-sm space-y-2 mb-4">
                      <li className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span><strong>City</strong> - The city where users access your app</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span><strong>Region/State</strong> - State or province level data</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span><strong>Country</strong> - Country-level geographic breakdown</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span><strong>Device Type</strong> - Mobile, Desktop, Tablet breakdown</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-primary" />
                        <span><strong>Platform</strong> - iOS, Android, Windows, macOS, etc.</span>
                      </li>
                    </ul>
                    <Button 
                      onClick={() => window.open('https://analytics.google.com/', '_blank')}
                      className="mt-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Geographic Reports in GA4
                    </Button>
                  </div>
                </div>
              </div>

              {/* How to Access */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    View by Location
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    In GA4, go to <strong>Reports → User Attributes → Demographics</strong> to see geographic breakdown.
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open Google Analytics</li>
                    <li>Select "Reports" from the left menu</li>
                    <li>Click "Demographics" → "Overview"</li>
                    <li>View users by Country, City, State</li>
                  </ol>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-purple-500" />
                    PWA vs Web Users
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Track PWA installations and usage patterns in <strong>Reports → Tech → Tech Overview</strong>.
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Look at "Platform" dimension</li>
                    <li>Compare Mobile vs Desktop</li>
                    <li>Check "Browser" breakdown</li>
                    <li>View "Operating System" data</li>
                  </ol>
                </div>
              </div>

              {/* Note about data */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Geographic data in GA4 is based on IP address geolocation and may not be 100% accurate. 
                  Users with VPNs or proxy servers will show their VPN exit location instead of actual location. 
                  For privacy compliance, GA4 does not collect precise location data by default.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
