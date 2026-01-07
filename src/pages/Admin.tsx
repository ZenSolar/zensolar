import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import zenLogo from '@/assets/zen-logo.png';

interface ProfileWithEmail {
  id: string;
  user_id: string;
  display_name: string | null;
  wallet_address: string | null;
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
  facebook_connected: boolean;
  instagram_connected: boolean;
  tiktok_connected: boolean;
  twitter_connected: boolean;
  linkedin_connected: boolean;
  created_at: string;
}

// Admin user IDs - add your user ID here
const ADMIN_USER_IDS = [
  // Add admin user IDs here
];

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfiles = async () => {
    // For now, fetch all profiles using a service role or admin access
    // In production, you'd want to add proper admin RLS policies
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to fetch user profiles');
      return;
    }

    setProfiles(data || []);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      setIsLoading(true);
      fetchProfiles().finally(() => setIsLoading(false));
    }
  }, [user, authLoading, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfiles();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const formatAddress = (address: string | null) => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const countConnections = (profile: ProfileWithEmail) => {
    let count = 0;
    if (profile.tesla_connected) count++;
    if (profile.enphase_connected) count++;
    if (profile.solaredge_connected) count++;
    if (profile.facebook_connected) count++;
    if (profile.instagram_connected) count++;
    if (profile.tiktok_connected) count++;
    if (profile.twitter_connected) count++;
    if (profile.linkedin_connected) count++;
    return count;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={zenLogo} alt="ZenSolar" className="h-8" />
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Registered Users</h2>
            <Badge variant="secondary">{profiles.length} total</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Energy</TableHead>
                    <TableHead>Social</TableHead>
                    <TableHead>Connections</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No users registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.display_name || 'Anonymous'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatAddress(profile.wallet_address)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {profile.tesla_connected && (
                              <Badge variant="outline" className="text-xs">Tesla</Badge>
                            )}
                            {profile.enphase_connected && (
                              <Badge variant="outline" className="text-xs">Enphase</Badge>
                            )}
                            {profile.solaredge_connected && (
                              <Badge variant="outline" className="text-xs">SolarEdge</Badge>
                            )}
                            {!profile.tesla_connected && !profile.enphase_connected && !profile.solaredge_connected && (
                              <span className="text-muted-foreground text-xs">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {profile.facebook_connected && <Badge variant="secondary" className="text-xs">FB</Badge>}
                            {profile.instagram_connected && <Badge variant="secondary" className="text-xs">IG</Badge>}
                            {profile.tiktok_connected && <Badge variant="secondary" className="text-xs">TT</Badge>}
                            {profile.twitter_connected && <Badge variant="secondary" className="text-xs">X</Badge>}
                            {profile.linkedin_connected && <Badge variant="secondary" className="text-xs">LI</Badge>}
                            {!profile.facebook_connected && !profile.instagram_connected && 
                             !profile.tiktok_connected && !profile.twitter_connected && 
                             !profile.linkedin_connected && (
                              <span className="text-muted-foreground text-xs">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={countConnections(profile) > 0 ? 'default' : 'secondary'}>
                            {countConnections(profile)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(profile.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
