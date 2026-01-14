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
import { Check, ChevronDown, ChevronUp, Plus, Zap, Sun, Battery, Plug } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Tesla "T" icon
const TeslaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 278.7 36.3" className={cn("h-3 w-auto", className)} fill="currentColor">
    <path d="M139.3 14.5c6-3.5 9.7-5 17.3-5.7 0-2.7-.4-4.5-1-5.4-6.9.4-12.8 1.7-20.3 6.1V3.4h-6.8v6c-7.5-4.4-13.4-5.7-20.3-6.1-.6.9-1 2.7-1 5.4 7.6.7 11.3 2.2 17.3 5.7l-17.3 10v5.2l20.3-11.8v19.4h6.8V17.8l20.3 11.8v-5.2l-17.3-10z"/>
    <path d="M.1 8.7h25.8v6.3H16v21.3H9.9V15H0l.1-6.3zm271.1 0h-25.8v6.3h9.9v21.3h6.1V15h9.9l-.1-6.3zM50.9 27.7V8.7H57v19c0 2.4 1.6 3.5 4.1 3.5h15.5c2.5 0 4.1-1.1 4.1-3.5v-19h6.1v19c0 5.4-4 8.6-10.2 8.6H61.1c-6.2 0-10.2-3.2-10.2-8.6zm147.2 0V8.7h6.1v19c0 2.4 1.6 3.5 4.1 3.5h15.5c2.5 0 4.1-1.1 4.1-3.5v-19h6.1v19c0 5.4-4 8.6-10.2 8.6h-15.5c-6.2 0-10.2-3.2-10.2-8.6zM96.9 8.7h26.4c6.2 0 10.2 3.2 10.2 8.6v4.1c0 5.4-4 8.6-10.2 8.6h-20.3v6.3h-6.1V8.7zm6.1 15h20.3c2.5 0 4.1-1.1 4.1-3.5v-2.8c0-2.4-1.6-3.5-4.1-3.5h-20.3v9.8zm74.3-15v6.3h-25.8v4.8h19.7v6.3h-19.7v5h25.8v6.3h-31.9V8.7h31.9z"/>
  </svg>
);

// Enphase sun/solar icon
const EnphaseIcon = ({ className }: { className?: string }) => (
  <Sun className={cn("h-3 w-3", className)} />
);

// SolarEdge icon (stylized sun with edge)
const SolarEdgeIcon = ({ className }: { className?: string }) => (
  <div className={cn("h-3 w-3 relative", className)}>
    <Sun className="h-full w-full" />
  </div>
);

// Wallbox icon (charging plug)
const WallboxIcon = ({ className }: { className?: string }) => (
  <Plug className={cn("h-3 w-3", className)} />
);

// Map service to icon
const providerIcons: Record<string, React.FC<{ className?: string }>> = {
  tesla: TeslaIcon,
  enphase: EnphaseIcon,
  solaredge: SolarEdgeIcon,
  wallbox: WallboxIcon,
};

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
                  <div className="flex flex-wrap gap-1 mt-1">
                    {connectedAccounts.map((acc) => {
                      const Icon = providerIcons[acc.service];
                      return (
                        <span 
                          key={acc.service}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          {Icon && <Icon className="text-secondary" />}
                          <Check className="h-3 w-3 text-secondary" />
                          {acc.label}
                        </span>
                      );
                    })}
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
