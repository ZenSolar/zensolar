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
import { Loader2, ArrowLeft, Users, RefreshCw, Zap, CheckCircle2, XCircle, AlertCircle, Key, Copy, ShieldX, Bell, Send, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FeedbackCard } from '@/components/admin/FeedbackCard';
import { SupportRequestsTab } from '@/components/admin/SupportRequestsTab';
import { NotificationTemplatesTab } from '@/components/admin/NotificationTemplatesTab';
import { NFTResetPanel } from '@/components/admin/NFTResetPanel';
import { AdminSkeleton } from '@/components/ui/loading-skeleton';
import zenIconOnly from '@/assets/zen-icon-only.png';

interface ProfileWithEmail {
  id: string;
  user_id: string;
  display_name: string | null;
  wallet_address: string | null;
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
  wallbox_connected: boolean;
  facebook_connected: boolean;
  instagram_connected: boolean;
  tiktok_connected: boolean;
  twitter_connected: boolean;
  linkedin_connected: boolean;
  created_at: string;
  updated_at: string;
}

interface UserKPIs {
  user_id: string;
  device_count: number;
  total_production_kwh: number;
  total_consumption_kwh: number;
  total_tokens: number;
  lifetime_solar_kwh: number;
  lifetime_ev_miles: number;
  lifetime_charging_kwh: number;
  lifetime_battery_kwh: number;
}

interface UserPushStatus {
  user_id: string;
  has_push: boolean;
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking: adminChecking } = useAdminCheck();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [userKPIs, setUserKPIs] = useState<Map<string, UserKPIs>>(new Map());
  const [pushStatuses, setPushStatuses] = useState<Map<string, boolean>>(new Map());
  const [aggregateKPIs, setAggregateKPIs] = useState({
    totalUsers: 0,
    usersWithEnergy: 0,
    totalDevices: 0,
    totalProductionKwh: 0,
    totalTokens: 0,
  });
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
  
  // Send reminder state
  const [reminderStatus, setReminderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reminderMessage, setReminderMessage] = useState('');
  
  // Clear subscriptions state
  const [clearSubsStatus, setClearSubsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [clearSubsMessage, setClearSubsMessage] = useState('');

  const fetchProfiles = async () => {
    // Fetch profiles
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

    // Fetch push subscription status, devices (with lifetime_totals), production, and rewards in parallel
    const [pushResult, devicesResult, productionResult, rewardsResult] = await Promise.all([
      supabase.from('push_subscriptions').select('user_id'),
      supabase.from('connected_devices').select('user_id, id, provider, device_type, lifetime_totals'),
      supabase.from('energy_production').select('user_id, production_wh, consumption_wh'),
      supabase.from('user_rewards').select('user_id, tokens_earned'),
    ]);

    // Process push statuses
    if (!pushResult.error && pushResult.data) {
      const statusMap = new Map<string, boolean>();
      pushResult.data.forEach(sub => {
        statusMap.set(sub.user_id, true);
      });
      setPushStatuses(statusMap);
    }

    // Aggregate KPIs per user
    const kpiMap = new Map<string, UserKPIs>();
    
    // Initialize for all users
    (data || []).forEach(profile => {
      kpiMap.set(profile.user_id, {
        user_id: profile.user_id,
        device_count: 0,
        total_production_kwh: 0,
        total_consumption_kwh: 0,
        total_tokens: 0,
        lifetime_solar_kwh: 0,
        lifetime_ev_miles: 0,
        lifetime_charging_kwh: 0,
        lifetime_battery_kwh: 0,
      });
    });

    // Count devices per user AND extract lifetime totals
    if (!devicesResult.error && devicesResult.data) {
      devicesResult.data.forEach((device: any) => {
        const existing = kpiMap.get(device.user_id);
        if (existing) {
          existing.device_count++;
          
          // Extract lifetime totals from device data
          const totals = device.lifetime_totals as Record<string, number> | null;
          if (totals) {
            // Solar (from Enphase, SolarEdge, Tesla solar)
            const solarWh = totals.solar_wh || totals.lifetime_solar_wh || totals.total_solar_produced_wh || 0;
            existing.lifetime_solar_kwh += solarWh / 1000;
            
            // EV miles (from Tesla vehicles)
            const evMiles = totals.odometer || totals.ev_miles || 0;
            existing.lifetime_ev_miles += evMiles;
            
            // Charging kWh (from Wallbox, Tesla Supercharger)
            const chargingWh = totals.charging_kwh || totals.lifetime_charging_kwh || totals.total_energy_kwh || 0;
            // Some providers store in kWh, others in Wh - normalize
            existing.lifetime_charging_kwh += chargingWh > 10000 ? chargingWh / 1000 : chargingWh;
            
            // Battery discharge (from Tesla Powerwall)
            const batteryWh = totals.battery_discharge_wh || totals.lifetime_battery_wh || 0;
            existing.lifetime_battery_kwh += batteryWh / 1000;
          }
        }
      });
    }

    // Sum production per user (daily increments - for reference, but lifetime_totals is more accurate)
    if (!productionResult.error && productionResult.data) {
      productionResult.data.forEach(prod => {
        const existing = kpiMap.get(prod.user_id);
        if (existing) {
          existing.total_production_kwh += (Number(prod.production_wh) || 0) / 1000;
          existing.total_consumption_kwh += (Number(prod.consumption_wh) || 0) / 1000;
        }
      });
    }

    // Sum tokens per user
    if (!rewardsResult.error && rewardsResult.data) {
      rewardsResult.data.forEach(reward => {
        const existing = kpiMap.get(reward.user_id);
        if (existing) {
          existing.total_tokens += Number(reward.tokens_earned) || 0;
        }
      });
    }

    setUserKPIs(kpiMap);

    // Calculate aggregate KPIs
    let totalDevices = 0;
    let totalProductionKwh = 0;
    let totalLifetimeSolarKwh = 0;
    let totalTokens = 0;
    let usersWithEnergy = 0;

    kpiMap.forEach((kpi) => {
      totalDevices += kpi.device_count;
      totalProductionKwh += kpi.total_production_kwh;
      totalLifetimeSolarKwh += kpi.lifetime_solar_kwh;
      totalTokens += kpi.total_tokens;
      // Use lifetime solar if available, otherwise fall back to production records
      const userEnergy = kpi.lifetime_solar_kwh > 0 ? kpi.lifetime_solar_kwh : kpi.total_production_kwh;
      if (kpi.device_count > 0 || userEnergy > 0) {
        usersWithEnergy++;
      }
    });

    setAggregateKPIs({
      totalUsers: data?.length || 0,
      usersWithEnergy,
      totalDevices,
      // Use lifetime solar totals as the primary metric
      totalProductionKwh: totalLifetimeSolarKwh > 0 ? totalLifetimeSolarKwh : totalProductionKwh,
      totalTokens,
    });
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

  // Stable per-device id so publishing updates doesn't create endless duplicate subscriptions
  const getOrCreateDeviceId = () => {
    const key = 'zensolar_device_id';
    try {
      const existing = window.localStorage.getItem(key);
      if (existing) return existing;

      const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      window.localStorage.setItem(key, id);
      return id;
    } catch {
      return 'unknown-device';
    }
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

    if (!user?.id) {
      throw new Error('Not authenticated');
    }

    const deviceId = getOrCreateDeviceId();

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
      user_id: user.id,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
      platform: 'web',
      device_info: {
        deviceId,
        userAgent: navigator.userAgent,
        language: navigator.language,
      },
    }, { onConflict: 'endpoint' });

    if (dbError) {
      console.error('Failed to save subscription:', dbError);
      // Continue anyway - the subscription exists locally
    }

    // Auto-cleanup older subscriptions for this same device (common after publishes / iOS SW updates)
    try {
      const { error: cleanupError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', 'web')
        .eq('device_info->>deviceId', deviceId)
        .neq('endpoint', subJson.endpoint);

      if (cleanupError) {
        console.warn('Failed to cleanup old subscriptions for this device:', cleanupError);
      }
    } catch (e) {
      console.warn('Subscription cleanup failed:', e);
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

  const handleSendReminderNotifications = async () => {
    setReminderStatus('loading');
    setReminderMessage('Checking for users to notify...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('send-reminder-notifications', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send reminders');
      }

      const data = response.data;
      setReminderStatus('success');
      if (data.notified > 0) {
        setReminderMessage(`Sent ${data.notified} reminder notification(s)`);
        toast.success(`Sent ${data.notified} reminder(s)!`);
      } else {
        setReminderMessage(data.message || 'No users needed reminders');
      }
    } catch (error) {
      console.error('Send reminder error:', error);
      setReminderStatus('error');
      setReminderMessage(error instanceof Error ? error.message : 'Failed to send reminders');
      toast.error('Failed to send reminders');
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(dateString);
    }
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
    return <AdminSkeleton />;
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
    <div className="min-h-screen bg-background pb-safe overflow-x-hidden">
      {/* Sticky Page Title for mobile */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={zenIconOnly} alt="ZenSolar" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-4 overflow-x-hidden">
        {/* Quick Links */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/contracts')}>
            <FileCode2 className="h-4 w-4 mr-2" />
            Smart Contracts
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/ev-api-reference')}>
            <Zap className="h-4 w-4 mr-2" />
            EV API Reference
          </Button>
        </div>

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
                      aria-label="Copy public key"
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
                      aria-label="Copy private key"
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
                variant="secondary"
                onClick={handleSendReminderNotifications} 
                disabled={reminderStatus === 'loading'}
              >
                {reminderStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send 24h Reminders Now
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
            
            {reminderMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                reminderStatus === 'success' ? 'bg-green-500/10 text-green-600' :
                reminderStatus === 'error' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {reminderStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {reminderStatus === 'error' && <XCircle className="h-4 w-4" />}
                {reminderStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm">{reminderMessage}</span>
              </div>
            )}
            
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

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              Total Users
            </div>
            <div className="text-2xl font-bold">{aggregateKPIs.totalUsers}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3.5 w-3.5" />
              With Energy
            </div>
            <div className="text-2xl font-bold text-secondary">{aggregateKPIs.usersWithEnergy}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3.5 w-3.5" />
              Devices
            </div>
            <div className="text-2xl font-bold">{aggregateKPIs.totalDevices}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3.5 w-3.5" />
              Production
            </div>
            <div className="text-2xl font-bold text-primary">
              {aggregateKPIs.totalProductionKwh >= 1000000 
                ? `${(aggregateKPIs.totalProductionKwh / 1000000).toFixed(1)}M kWh`
                : aggregateKPIs.totalProductionKwh >= 1000
                ? `${(aggregateKPIs.totalProductionKwh / 1000).toFixed(1)}k kWh`
                : `${aggregateKPIs.totalProductionKwh.toFixed(0)} kWh`
              }
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3.5 w-3.5" />
              Tokens Earned
            </div>
            <div className="text-2xl font-bold text-amber-500">
              {aggregateKPIs.totalTokens >= 1000000 
                ? `${(aggregateKPIs.totalTokens / 1000000).toFixed(1)}M`
                : aggregateKPIs.totalTokens >= 1000
                ? `${(aggregateKPIs.totalTokens / 1000).toFixed(1)}k`
                : aggregateKPIs.totalTokens.toLocaleString()
              }
            </div>
          </Card>
        </div>

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
            <CardDescription>Energy production data, devices, and tokens earned per user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Energy Accounts</TableHead>
                    <TableHead className="text-right">Devices</TableHead>
                    <TableHead className="text-right">Solar (kWh)</TableHead>
                    <TableHead className="text-right">EV Miles</TableHead>
                    <TableHead className="text-right">Charging (kWh)</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead>Push</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No users registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => {
                      const kpi = userKPIs.get(profile.user_id);
                      return (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            {profile.display_name || 'Anonymous'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatAddress(profile.wallet_address)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
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
                              {!profile.tesla_connected && !profile.enphase_connected && 
                               !profile.solaredge_connected && !profile.wallbox_connected && (
                                <span className="text-muted-foreground text-xs">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={kpi?.device_count ? 'default' : 'secondary'}>
                              {kpi?.device_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {kpi && kpi.lifetime_solar_kwh > 0 ? (
                              <span className="font-medium text-primary">
                                {kpi.lifetime_solar_kwh >= 1000000 
                                  ? `${(kpi.lifetime_solar_kwh / 1000000).toFixed(1)}M`
                                  : kpi.lifetime_solar_kwh >= 1000
                                  ? `${(kpi.lifetime_solar_kwh / 1000).toFixed(1)}k`
                                  : kpi.lifetime_solar_kwh.toFixed(0)
                                }
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {kpi && kpi.lifetime_ev_miles > 0 ? (
                              <span className="font-medium text-blue-500">
                                {kpi.lifetime_ev_miles >= 1000000 
                                  ? `${(kpi.lifetime_ev_miles / 1000000).toFixed(1)}M`
                                  : kpi.lifetime_ev_miles >= 1000
                                  ? `${(kpi.lifetime_ev_miles / 1000).toFixed(1)}k`
                                  : kpi.lifetime_ev_miles.toFixed(0)
                                }
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {kpi && kpi.lifetime_charging_kwh > 0 ? (
                              <span className="font-medium text-green-500">
                                {kpi.lifetime_charging_kwh >= 1000000 
                                  ? `${(kpi.lifetime_charging_kwh / 1000000).toFixed(1)}M`
                                  : kpi.lifetime_charging_kwh >= 1000
                                  ? `${(kpi.lifetime_charging_kwh / 1000).toFixed(1)}k`
                                  : kpi.lifetime_charging_kwh.toFixed(0)
                                }
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {kpi && kpi.total_tokens > 0 ? (
                              <span className="font-medium text-amber-500">
                                {kpi.total_tokens >= 1000000 
                                  ? `${(kpi.total_tokens / 1000000).toFixed(1)}M`
                                  : kpi.total_tokens >= 1000
                                  ? `${(kpi.total_tokens / 1000).toFixed(1)}k`
                                  : kpi.total_tokens.toLocaleString()
                                }
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pushStatuses.get(profile.user_id) ? (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                <Bell className="h-3 w-3 mr-1" />
                                On
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Off
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(profile.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Support Requests */}
        <SupportRequestsTab />

        {/* Notification Templates */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Push Notification Templates</CardTitle>
            </div>
            <CardDescription>
              Manage and customize push notification templates for referral rewards, milestones, and system messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationTemplatesTab />
          </CardContent>
        </Card>

        {/* Beta Feedback */}
        <FeedbackCard />
      </main>
    </div>
  );
}
