import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  display_name: string | null;
  tesla_connected: boolean;
  enphase_connected: boolean;
  solaredge_connected: boolean;
  wallbox_connected: boolean;
}

interface ProviderResyncPanelProps {
  profiles: Profile[];
}

type Provider = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';

interface ResyncResult {
  provider: Provider;
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  data?: any;
}

export function ProviderResyncPanel({ profiles }: ProviderResyncPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [resyncResults, setResyncResults] = useState<Record<Provider, ResyncResult>>({
    tesla: { provider: 'tesla', status: 'idle' },
    enphase: { provider: 'enphase', status: 'idle' },
    solaredge: { provider: 'solaredge', status: 'idle' },
    wallbox: { provider: 'wallbox', status: 'idle' },
  });

  const selectedProfile = profiles.find(p => p.user_id === selectedUserId);

  const providerConfig: Record<Provider, { name: string; function: string; connected: boolean }> = {
    tesla: { 
      name: 'Tesla', 
      function: 'tesla-data',
      connected: selectedProfile?.tesla_connected || false,
    },
    enphase: { 
      name: 'Enphase', 
      function: 'enphase-data',
      connected: selectedProfile?.enphase_connected || false,
    },
    solaredge: { 
      name: 'SolarEdge', 
      function: 'solaredge-data',
      connected: selectedProfile?.solaredge_connected || false,
    },
    wallbox: { 
      name: 'Wallbox', 
      function: 'wallbox-data',
      connected: selectedProfile?.wallbox_connected || false,
    },
  };

  const handleResync = async (provider: Provider) => {
    if (!selectedUserId) {
      toast.error('Please select a user first');
      return;
    }

    const config = providerConfig[provider];
    if (!config.connected) {
      toast.error(`${config.name} is not connected for this user`);
      return;
    }

    setResyncResults(prev => ({
      ...prev,
      [provider]: { provider, status: 'loading' },
    }));

    try {
      // Get admin session to call the function on behalf of the user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get the user's token to make the API call on their behalf
      const { data: tokenData, error: tokenError } = await supabase
        .from('energy_tokens')
        .select('access_token')
        .eq('user_id', selectedUserId)
        .eq('provider', provider)
        .single();

      if (tokenError || !tokenData) {
        throw new Error(`No ${config.name} token found for this user`);
      }

      // For admin resync, we need to use a service call approach
      // Call the edge function with the target user's context
      const response = await supabase.functions.invoke(config.function, {
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'X-Target-User-Id': selectedUserId, // Custom header for admin override
        },
      });

      if (response.error) {
        throw new Error(response.error.message || `Failed to sync ${config.name}`);
      }

      // Fetch updated device data
      const { data: deviceData } = await supabase
        .from('connected_devices')
        .select('lifetime_totals, device_name, updated_at')
        .eq('user_id', selectedUserId)
        .eq('provider', provider)
        .maybeSingle();

      setResyncResults(prev => ({
        ...prev,
        [provider]: { 
          provider, 
          status: 'success', 
          message: 'Synced successfully',
          data: {
            response: response.data,
            device: deviceData,
          },
        },
      }));

      toast.success(`${config.name} data synced successfully`);
    } catch (error) {
      console.error(`Resync error for ${provider}:`, error);
      setResyncResults(prev => ({
        ...prev,
        [provider]: { 
          provider, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Sync failed',
        },
      }));
      toast.error(`Failed to sync ${config.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleResyncAll = async () => {
    if (!selectedProfile) {
      toast.error('Please select a user first');
      return;
    }

    const connectedProviders = (Object.keys(providerConfig) as Provider[])
      .filter(p => providerConfig[p].connected);

    if (connectedProviders.length === 0) {
      toast.error('No connected providers for this user');
      return;
    }

    for (const provider of connectedProviders) {
      await handleResync(provider);
    }
  };

  const getStatusIcon = (status: ResyncResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const formatLifetimeTotals = (data: any) => {
    if (!data?.device?.lifetime_totals) return null;
    const totals = data.device.lifetime_totals;
    const parts: string[] = [];
    
    if (totals.solar_wh || totals.lifetime_solar_wh) {
      parts.push(`Solar: ${((totals.solar_wh || totals.lifetime_solar_wh) / 1000).toFixed(1)} kWh`);
    }
    if (totals.odometer) {
      parts.push(`Miles: ${totals.odometer.toFixed(0)}`);
    }
    if (totals.charging_kwh || totals.lifetime_charging_kwh) {
      parts.push(`Charging: ${(totals.charging_kwh || totals.lifetime_charging_kwh).toFixed(1)} kWh`);
    }
    if (totals.battery_discharge_wh) {
      parts.push(`Battery: ${(totals.battery_discharge_wh / 1000).toFixed(1)} kWh`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Provider Data Resync
        </CardTitle>
        <CardDescription>
          Manually trigger data sync for any user's connected providers. This will fetch the latest
          data from each provider's API and update the connected_devices table.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a user..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map(profile => (
                <SelectItem key={profile.user_id} value={profile.user_id}>
                  {profile.display_name || profile.user_id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleResyncAll}
            disabled={!selectedUserId}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resync All
          </Button>
        </div>

        {selectedProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {(Object.keys(providerConfig) as Provider[]).map(provider => {
              const config = providerConfig[provider];
              const result = resyncResults[provider];
              
              return (
                <div 
                  key={provider}
                  className={`p-4 border rounded-lg ${config.connected ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.name}</span>
                      <Badge variant={config.connected ? 'default' : 'secondary'}>
                        {config.connected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleResync(provider)}
                      disabled={!config.connected || result.status === 'loading'}
                    >
                      {getStatusIcon(result.status)}
                    </Button>
                  </div>
                  
                  {result.message && (
                    <p className={`text-sm ${result.status === 'error' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {result.message}
                    </p>
                  )}
                  
                  {result.status === 'success' && result.data && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {formatLifetimeTotals(result.data) && (
                        <p>{formatLifetimeTotals(result.data)}</p>
                      )}
                      {result.data.device?.updated_at && (
                        <p>Updated: {new Date(result.data.device.updated_at).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
