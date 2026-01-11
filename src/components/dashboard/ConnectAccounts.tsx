import { useState } from 'react';
import { ConnectedAccount } from '@/types/dashboard';
import { ConnectAccountButton } from './ConnectAccountButton';
import { EnphaseCodeDialog } from './EnphaseCodeDialog';
import { SolarEdgeConnectDialog } from './SolarEdgeConnectDialog';
import { WallboxConnectDialog } from './WallboxConnectDialog';
import { DeviceSelectionDialog } from './DeviceSelectionDialog';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConnectAccountsProps {
  accounts: ConnectedAccount[];
  onConnect: (service: ConnectedAccount['service']) => void;
  onDisconnect?: (service: ConnectedAccount['service']) => void;
}

export function ConnectAccounts({ accounts, onConnect, onDisconnect }: ConnectAccountsProps) {
  const { startTeslaOAuth, startEnphaseOAuth, exchangeEnphaseCode, connectSolarEdge, connectWallbox } = useEnergyOAuth();
  const [enphaseDialogOpen, setEnphaseDialogOpen] = useState(false);
  const [solarEdgeDialogOpen, setSolarEdgeDialogOpen] = useState(false);
  const [wallboxDialogOpen, setWallboxDialogOpen] = useState(false);
  const [deviceSelectionOpen, setDeviceSelectionOpen] = useState(false);
  const [deviceSelectionProvider, setDeviceSelectionProvider] = useState<'tesla' | 'enphase'>('tesla');

  const handleConnect = async (service: ConnectedAccount['service']) => {
    if (service === 'tesla') {
      await startTeslaOAuth();
    } else if (service === 'enphase') {
      const result = await startEnphaseOAuth();
      if (result?.useManualCode) {
        setEnphaseDialogOpen(true);
      }
    } else if (service === 'solaredge') {
      setSolarEdgeDialogOpen(true);
    } else if (service === 'wallbox') {
      setWallboxDialogOpen(true);
    } else {
      toast.info('Integration coming soon!');
      onConnect(service);
    }
  };

  const handleDisconnect = async (service: ConnectedAccount['service']) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in first');
        return;
      }

      // Delete tokens from database
      await supabase
        .from('energy_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', service);

      // Delete connected devices
      await supabase
        .from('connected_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', service);

      // Update profile to mark as disconnected
      await supabase
        .from('profiles')
        .update({ [`${service}_connected`]: false })
        .eq('user_id', user.id);

      toast.success(`${service.charAt(0).toUpperCase() + service.slice(1)} disconnected`);
      onDisconnect?.(service);
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect account');
    }
  };

  const handleEnphaseCodeSubmit = async (code: string): Promise<boolean> => {
    const success = await exchangeEnphaseCode(code);
    if (success) {
      // After successful auth, show device selection
      setDeviceSelectionProvider('enphase');
      setDeviceSelectionOpen(true);
    }
    return success;
  };

  const handleSolarEdgeSubmit = async (apiKey: string, siteId: string): Promise<boolean> => {
    const success = await connectSolarEdge(apiKey, siteId);
    if (success) {
      onConnect('solaredge');
    }
    return success;
  };

  const handleWallboxSubmit = async (email: string, password: string): Promise<boolean> => {
    const success = await connectWallbox(email, password);
    if (success) {
      onConnect('wallbox');
    }
    return success;
  };

  const handleDeviceSelectionComplete = () => {
    onConnect(deviceSelectionProvider);
  };

  // Check for Tesla OAuth callback and show device selection
  const openTeslaDeviceSelection = () => {
    setDeviceSelectionProvider('tesla');
    setDeviceSelectionOpen(true);
  };

  const connectedAccounts = accounts.filter(acc => acc.connected);
  const disconnectedAccounts = accounts.filter(acc => !acc.connected);

  return (
    <>
      {/* Show connected accounts with disconnect option */}
      {connectedAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Connected Accounts</h2>
          <div className="space-y-3">
            {connectedAccounts.map((account) => (
              <ConnectAccountButton
                key={account.service}
                service={account.service}
                label={account.label}
                connected={account.connected}
                onConnect={() => handleConnect(account.service)}
                onDisconnect={() => handleDisconnect(account.service)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Show disconnected accounts */}
      {disconnectedAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Connect Energy Accounts</h2>
          <div className="space-y-3">
            {disconnectedAccounts.map((account) => (
              <ConnectAccountButton
                key={account.service}
                service={account.service}
                label={account.label}
                connected={account.connected}
                onConnect={() => handleConnect(account.service)}
              />
            ))}
          </div>
        </div>
      )}
      
      <EnphaseCodeDialog
        open={enphaseDialogOpen}
        onOpenChange={setEnphaseDialogOpen}
        onSubmit={handleEnphaseCodeSubmit}
      />

      <SolarEdgeConnectDialog
        open={solarEdgeDialogOpen}
        onOpenChange={setSolarEdgeDialogOpen}
        onSubmit={handleSolarEdgeSubmit}
      />

      <WallboxConnectDialog
        open={wallboxDialogOpen}
        onOpenChange={setWallboxDialogOpen}
        onSubmit={handleWallboxSubmit}
      />

      <DeviceSelectionDialog
        open={deviceSelectionOpen}
        onOpenChange={setDeviceSelectionOpen}
        provider={deviceSelectionProvider}
        onComplete={handleDeviceSelectionComplete}
      />
    </>
  );
}
