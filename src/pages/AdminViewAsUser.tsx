import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useViewAsUser } from '@/contexts/ViewAsUserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Eye, ArrowLeft, Users, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  wallet_address: string | null;
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
  wallbox_connected: boolean;
  created_at: string;
}

interface UserEmail {
  id: string;
  email: string;
}

export default function AdminViewAsUser() {
  const navigate = useNavigate();
  const { isAdmin, isChecking } = useAdminCheck();
  const { startViewingAs, isViewingAsOther } = useViewAsUser();
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userEmails, setUserEmails] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch emails via edge function (admin only)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: emailsData } = await supabase.functions.invoke('admin-get-user-emails', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        
        if (emailsData?.users) {
          const emailMap = new Map<string, string>();
          emailsData.users.forEach((u: UserEmail) => {
            emailMap.set(u.id, u.email);
          });
          setUserEmails(emailMap);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    if (!isChecking && isAdmin) {
      setIsLoading(true);
      fetchUsers().finally(() => setIsLoading(false));
    }
  }, [isChecking, isAdmin]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
    toast.success('User list refreshed');
  };

  const handleViewAs = (profile: UserProfile) => {
    const email = userEmails.get(profile.user_id) || null;
    startViewingAs(profile.user_id, profile.display_name, email);
    toast.success(`Now viewing as ${profile.display_name || email || 'user'}`);
    navigate('/');
  };

  // Filter profiles based on search
  const filteredProfiles = profiles.filter(profile => {
    const email = userEmails.get(profile.user_id) || '';
    const name = profile.display_name || '';
    const search = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      profile.user_id.toLowerCase().includes(search)
    );
  });

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              View as User
            </h1>
            <p className="text-sm text-muted-foreground">
              Select a user to see their dashboard exactly as they see it
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Active View Banner */}
      {isViewingAsOther && (
        <Card className="border-solar bg-solar/10">
          <CardContent className="py-4">
            <p className="text-sm text-solar font-medium">
              ⚠️ You are currently viewing as another user. Navigate to the dashboard to see their view.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({profiles.length})
          </CardTitle>
          <CardDescription>
            Search by name, email, or user ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Connections</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((profile) => {
                      const email = userEmails.get(profile.user_id);
                      const hasConnections = profile.tesla_connected || profile.enphase_connected || 
                        profile.solaredge_connected || profile.wallbox_connected;
                      
                      return (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {profile.display_name || 'No name'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {email || profile.user_id.slice(0, 8) + '...'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {profile.tesla_connected && (
                                <Badge variant="outline" className="text-xs">Tesla</Badge>
                              )}
                              {profile.enphase_connected && (
                                <Badge variant="outline" className="text-xs">Enphase</Badge>
                              )}
                              {profile.solaredge_connected && (
                                <Badge variant="outline" className="text-xs">SolarEdge</Badge>
                              )}
                              {profile.wallbox_connected && (
                                <Badge variant="outline" className="text-xs">Wallbox</Badge>
                              )}
                              {!hasConnections && (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {profile.wallet_address ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(profile.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleViewAs(profile)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View As
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
