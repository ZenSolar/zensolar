import { ConnectedAccount } from '@/types/dashboard';
import { ConnectAccountButton } from './ConnectAccountButton';

interface ConnectAccountsProps {
  accounts: ConnectedAccount[];
  onConnect: (service: ConnectedAccount['service']) => void;
}

export function ConnectAccounts({ accounts, onConnect }: ConnectAccountsProps) {
  const disconnectedAccounts = accounts.filter(acc => !acc.connected);
  
  if (disconnectedAccounts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Connect Accounts</h2>
      <div className="space-y-3">
        {disconnectedAccounts.map((account) => (
          <ConnectAccountButton
            key={account.service}
            service={account.service}
            label={account.label}
            connected={account.connected}
            onConnect={() => onConnect(account.service)}
          />
        ))}
      </div>
    </div>
  );
}
