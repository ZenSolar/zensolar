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
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp, Plus, Zap } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isExpanded, setIsExpanded] = useState(false);

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

      await supabase
        .from('energy_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', service);

      await supabase
        .from('connected_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', service);

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

  const connectedAccounts = accounts.filter(acc => acc.connected);
  const disconnectedAccounts = accounts.filter(acc => !acc.connected);
  const hasConnectedAccounts = connectedAccounts.length > 0;
  const allConnected = disconnectedAccounts.length === 0;

  // If no accounts connected, show the full connection UI prominently
  if (!hasConnectedAccounts) {
    return (
      <>
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Connect Energy Accounts</h2>
              <p className="text-sm text-muted-foreground">Link your solar or EV to start earning</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {accounts.map((account) => (
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

  // Compact view when accounts are connected
  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Compact header showing connected accounts */}
          <CollapsibleTrigger asChild>
            <button 
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              type="button"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
                  <Zap className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Energy Accounts</span>
                    <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                      {connectedAccounts.length} connected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {connectedAccounts.map((acc) => (
                      <span 
                        key={acc.service}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                      >
                        <Check className="h-3 w-3 text-secondary" />
                        {acc.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!allConnected && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    +{disconnectedAccounts.length} more
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border p-4 space-y-4">
              {/* Connected accounts with disconnect option */}
              {connectedAccounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Connected</p>
                  <div className="space-y-2">
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

              {/* Available to connect */}
              {disconnectedAccounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add More</p>
                  <div className="grid grid-cols-2 gap-2">
                    {disconnectedAccounts.map((account) => (
                      <Button
                        key={account.service}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => handleConnect(account.service)}
                      >
                        <Plus className="h-4 w-4" />
                        {account.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
      
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
