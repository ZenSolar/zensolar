import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { waitForServiceWorkerReady } from '@/lib/serviceWorker';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Users, RefreshCw, Zap, CheckCircle2, XCircle, AlertCircle, Key, Copy, ShieldX, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FeedbackCard } from '@/components/admin/FeedbackCard';
import { SupportRequestsTab } from '@/components/admin/SupportRequestsTab';
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

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminChecking } = useAdminCheck();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Tesla registration state
  const [teslaRegDomain, setTeslaRegDomain] = useState('');
  const [teslaRegStatus, setTeslaRegStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // VAPID keys state
  const [vapidKeys, setVapidKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [vapidStatus, setVapidStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [vapidMessage, setVapidMessage] = useState('');
  const [teslaRegMessage, setTeslaRegMessage] = useState('');
  
  // Push notification test state
  const [pushTestStatus, setPushTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pushTestMessage, setPushTestMessage] = useState('');
  
  // Clear subscriptions state
  const [clearSubsStatus, setClearSubsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [clearSubsMessage, setClearSubsMessage] = useState('');

  const fetchProfiles = async () => {
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
    if (!authLoading && !adminChecking) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      if (!isAdmin) {
        // Non-admin users should not access this page
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      fetchProfiles().finally(() => setIsLoading(false));
    }
  }, [user, authLoading, adminChecking, isAdmin, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfiles();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const normalizeTeslaDomain = (value: string) => {
    return value
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .toLowerCase()
      .trim();
  };

  const handleTeslaRegistration = async () => {
    const domain = normalizeTeslaDomain(teslaRegDomain);
    setTeslaRegDomain(domain);

    if (!domain) {
      toast.error('Please enter your app domain');
      return;
    }

    setTeslaRegStatus('loading');
    setTeslaRegMessage('Getting partner token...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Step 1: Get partner token
      const tokenResponse = await supabase.functions.invoke('tesla-register', {
        body: { action: 'get-partner-token' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (tokenResponse.error || !tokenResponse.data?.success) {
        throw new Error(tokenResponse.data?.error || tokenResponse.error?.message || 'Failed to get partner token');
      }

      const partnerToken = tokenResponse.data.partnerToken;
      setTeslaRegMessage('Registering with Tesla Fleet API...');

      // Step 2: Register with Tesla
      const registerResponse = await supabase.functions.invoke('tesla-register', {
        body: { action: 'register', partnerToken, domain },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (registerResponse.error || !registerResponse.data?.success) {
        throw new Error(registerResponse.data?.error || registerResponse.error?.message || 'Registration failed');
      }

      setTeslaRegStatus('success');
      setTeslaRegMessage('Successfully registered with Tesla Fleet API!');
      toast.success('Tesla Fleet API registration complete!');
    } catch (error) {
      console.error('Tesla registration error:', error);
      setTeslaRegStatus('error');
      setTeslaRegMessage(error instanceof Error ? error.message : 'Registration failed');
      toast.error('Tesla registration failed');
    }
  };

  const handleCheckRegistration = async () => {
    const domain = normalizeTeslaDomain(teslaRegDomain);
    setTeslaRegDomain(domain);

    if (!domain) {
      toast.error('Please enter your app domain');
      return;
    }

    setTeslaRegStatus('loading');
    setTeslaRegMessage('Checking registration status...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get partner token first
      const tokenResponse = await supabase.functions.invoke('tesla-register', {
        body: { action: 'get-partner-token' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (tokenResponse.error || !tokenResponse.data?.success) {
        throw new Error(tokenResponse.data?.error || 'Failed to get partner token');
      }

      // Check registration
      const checkResponse = await supabase.functions.invoke('tesla-register', {
        body: { action: 'check-registration', partnerToken: tokenResponse.data.partnerToken, domain },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (checkResponse.data?.registered) {
        setTeslaRegStatus('success');
        setTeslaRegMessage('Domain is registered with Tesla Fleet API');
        toast.success('Domain is registered!');
      } else {
        setTeslaRegStatus('error');
        setTeslaRegMessage('Domain is NOT registered with Tesla Fleet API');
        toast.error('Domain not registered');
      }
    } catch (error) {
      console.error('Check registration error:', error);
      setTeslaRegStatus('error');
      setTeslaRegMessage(error instanceof Error ? error.message : 'Check failed');
    }
  };

  const handleGenerateVapidKeys = async () => {
    setVapidStatus('loading');
    setVapidMessage('Generating VAPID keys...');
    setVapidKeys(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('generate-vapid-keys', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || response.error?.message || 'Failed to generate keys');
      }

      setVapidKeys(response.data.keys);
      setVapidStatus('success');
      setVapidMessage('VAPID keys generated! Copy them and add as secrets.');
      toast.success('VAPID keys generated successfully!');
    } catch (error) {
      console.error('VAPID generation error:', error);
      setVapidStatus('error');
      setVapidMessage(error instanceof Error ? error.message : 'Failed to generate keys');
      toast.error('Failed to generate VAPID keys');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Helper to ensure we have a valid push subscription for THIS device
  const ensurePushSubscription = async (): Promise<string | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      throw new Error('Push notifications not supported in this browser');
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        throw new Error('Notification permission denied');
      }
    } else if (Notification.permission === 'denied') {
      throw new Error('Notifications blocked. Enable in browser/iOS settings.');
    }

    // Register our custom SW (idempotent if already registered)
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Wait for it to be active
    await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Fetch VAPID public key
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-public-key');
      if (vapidError || !vapidData?.publicKey) {
        throw new Error('Push notifications not configured on server');
      }

      // Convert VAPID key
      const padding = '='.repeat((4 - (vapidData.publicKey.length % 4)) % 4);
      const base64 = (vapidData.publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const applicationServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        applicationServerKey[i] = rawData.charCodeAt(i);
      }

      // Subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys) {
      throw new Error('Invalid push subscription');
    }

    // Upsert to database (ensure it's fresh)
    const { error: dbError } = await supabase.from('push_subscriptions').upsert({
      user_id: user?.id,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
      platform: 'web',
      device_info: { userAgent: navigator.userAgent, language: navigator.language },
    }, { onConflict: 'endpoint' });

    if (dbError) {
      console.error('Failed to save subscription:', dbError);
      // Continue anyway - the subscription exists locally
    }

    return subJson.endpoint;
  };

  const handleTestPushNotification = async () => {
    setPushTestStatus('loading');
    setPushTestMessage('Ensuring subscription...');

    try {
      // Ensure we have a valid, fresh subscription for THIS device
      const currentEndpoint = await ensurePushSubscription();
      
      setPushTestMessage('Sending notification...');

      const response = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user?.id,
          endpoint: currentEndpoint,
          title: '🌞 ZenSolar Test',
          body: 'Push notifications are working! Your solar rewards await.',
          notification_type: 'test',
          url: '/',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send notification');
      }

      const data = response.data;
      if (data.sent > 0) {
        setPushTestStatus('success');
        setPushTestMessage('Notification sent to this device!');
        toast.success('Test notification sent!');
      } else {
        setPushTestStatus('error');
        setPushTestMessage('Push sent but no matching subscription found.');
      }
    } catch (error) {
      console.error('Push test error:', error);
      setPushTestStatus('error');
      setPushTestMessage(error instanceof Error ? error.message : 'Failed to send notification');
      toast.error(error instanceof Error ? error.message : 'Failed to send test notification');
    }
  };

  const handleClearOldSubscriptions = async () => {
    setClearSubsStatus('loading');
    setClearSubsMessage('Clearing old subscriptions...');

    try {
      // Get current device's endpoint (don't hang forever in iOS PWA)
      let currentEndpoint: string | undefined;
      try {
        const reg = await waitForServiceWorkerReady(1500);
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          currentEndpoint = sub?.endpoint;
        }
      } catch {
        // ignore
      }

      // Get all subscriptions for current user
      const { data: subs, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint')
        .eq('user_id', user?.id);

      if (fetchError) throw fetchError;

      if (!subs || subs.length === 0) {
        setClearSubsStatus('success');
        setClearSubsMessage('No subscriptions found.');
        return;
      }

      // Delete all except current endpoint
      const toDelete = currentEndpoint 
        ? subs.filter(s => s.endpoint !== currentEndpoint).map(s => s.id)
        : subs.map(s => s.id);

      if (toDelete.length === 0) {
        setClearSubsStatus('success');
        setClearSubsMessage('No old subscriptions to clear.');
        return;
      }

      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', toDelete);

      if (deleteError) throw deleteError;

      setClearSubsStatus('success');
      setClearSubsMessage(`Cleared ${toDelete.length} old subscription(s).`);
      toast.success(`Cleared ${toDelete.length} old subscription(s)`);
    } catch (error) {
      console.error('Clear subscriptions error:', error);
      setClearSubsStatus('error');
      setClearSubsMessage(error instanceof Error ? error.message : 'Failed to clear subscriptions');
      toast.error('Failed to clear old subscriptions');
    }
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

  if (authLoading || adminChecking || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied for non-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldX className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Sticky Page Title for mobile */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={zenLogo} alt="ZenSolar" className="h-7 w-7" />
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-4">
        {/* Tesla Fleet API Registration */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Tesla Fleet API Registration</CardTitle>
            </div>
            <CardDescription>
              Register your app with Tesla's Fleet API to enable device discovery. This is a one-time setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tesla-domain">App Domain (without https://)</Label>
              <Input
                id="tesla-domain"
                placeholder="e.g., c0faa0dc-7beb-49f0-bf08-77c8c4973435.lovableproject.com"
                value={teslaRegDomain}
                onChange={(e) => {
                  // Auto-strip https://, http://, and paths
                  let domain = e.target.value
                    .replace(/^https?:\/\//, '')
                    .split('/')[0]
                    .toLowerCase();
                  setTeslaRegDomain(domain);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Just the domain, no https:// or paths. Must match your Tesla Developer Portal's "Allowed Origins"
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTeslaRegistration} 
                disabled={teslaRegStatus === 'loading' || !teslaRegDomain}
              >
                {teslaRegStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Register with Tesla
              </Button>
              <Button 
                variant="outline"
                onClick={handleCheckRegistration} 
                disabled={teslaRegStatus === 'loading' || !teslaRegDomain}
              >
                Check Status
              </Button>
            </div>
            
            {teslaRegMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                teslaRegStatus === 'success' ? 'bg-green-500/10 text-green-600' :
                teslaRegStatus === 'error' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {teslaRegStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {teslaRegStatus === 'error' && <XCircle className="h-4 w-4" />}
                {teslaRegStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm">{teslaRegMessage}</span>
              </div>
            )}
            
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Important:</strong> Before registering, ensure you have:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Added <code>openid</code> and <code>offline_access</code> scopes in Tesla Developer Portal</li>
                    <li>Set your redirect URL to: <code>{window.location.origin}/oauth/callback</code></li>
                    <li>The domain entered above matches your "Allowed Origins" in Tesla</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VAPID Key Generation */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Push Notification Keys (VAPID)</CardTitle>
            </div>
            <CardDescription>
              Generate VAPID keys for web push notifications. After generating, add them as secrets in your backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGenerateVapidKeys} 
              disabled={vapidStatus === 'loading'}
            >
              {vapidStatus === 'loading' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Generate VAPID Keys
            </Button>
            
            {vapidMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                vapidStatus === 'success' ? 'bg-green-500/10 text-green-600' :
                vapidStatus === 'error' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {vapidStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {vapidStatus === 'error' && <XCircle className="h-4 w-4" />}
                {vapidStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm">{vapidMessage}</span>
              </div>
            )}
            
            {vapidKeys && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>VAPID_PUBLIC_KEY</Label>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={vapidKeys.publicKey} 
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(vapidKeys.publicKey, 'Public key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>VAPID_PRIVATE_KEY</Label>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={vapidKeys.privateKey} 
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(vapidKeys.privateKey, 'Private key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
                    <p className="text-xs text-muted-foreground">
                      <strong>Next step:</strong> Copy these keys and ask Lovable to add them as secrets named 
                      <code className="mx-1 px-1 bg-muted rounded">VAPID_PUBLIC_KEY</code> and 
                      <code className="mx-1 px-1 bg-muted rounded">VAPID_PRIVATE_KEY</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Push Notification Test */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Test Push Notification</CardTitle>
            </div>
            <CardDescription>
              Send a test notification to your own devices to verify push notifications are working.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleTestPushNotification} 
                disabled={pushTestStatus === 'loading'}
              >
                {pushTestStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Send Test Notification
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleClearOldSubscriptions} 
                disabled={clearSubsStatus === 'loading'}
              >
                {clearSubsStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Clear Old Subscriptions
              </Button>
            </div>
            
            {pushTestMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                pushTestStatus === 'success' ? 'bg-green-500/10 text-green-600' :
                pushTestStatus === 'error' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {pushTestStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {pushTestStatus === 'error' && <XCircle className="h-4 w-4" />}
                {pushTestStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm">{pushTestMessage}</span>
              </div>
            )}
            
            {clearSubsMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                clearSubsStatus === 'success' ? 'bg-green-500/10 text-green-600' :
                clearSubsStatus === 'error' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {clearSubsStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {clearSubsStatus === 'error' && <XCircle className="h-4 w-4" />}
                {clearSubsStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm">{clearSubsMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Support Requests */}
        <SupportRequestsTab />

        {/* Beta Feedback */}
        <FeedbackCard />
      </main>
    </div>
  );
}
