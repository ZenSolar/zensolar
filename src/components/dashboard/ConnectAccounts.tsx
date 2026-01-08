import { ConnectedAccount } from '@/types/dashboard';
import { ConnectAccountButton } from './ConnectAccountButton';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { toast } from 'sonner';

interface ConnectAccountsProps {
  accounts: ConnectedAccount[];
  onConnect: (service: ConnectedAccount['service']) => void;
}

export function ConnectAccounts({ accounts, onConnect }: ConnectAccountsProps) {
  const { startTeslaOAuth, startEnphaseOAuth } = useEnergyOAuth();
  const disconnectedAccounts = accounts.filter(acc => !acc.connected);
  
  if (disconnectedAccounts.length === 0) {
    return null;
  }

  const handleConnect = async (service: ConnectedAccount['service']) => {
    if (service === 'tesla') {
      await startTeslaOAuth();
    } else if (service === 'enphase') {
      await startEnphaseOAuth();
    } else {
      // SolarEdge - no OAuth integration yet
      toast.info('SolarEdge integration coming soon!');
      onConnect(service);
    }
  };

  return (
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
  );
}
