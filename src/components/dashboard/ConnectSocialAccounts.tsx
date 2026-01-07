import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface SocialAccount {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  handle?: string;
  placeholder: string;
}

interface ConnectSocialAccountsProps {
  accounts: SocialAccount[];
  onConnect: (id: string, handle: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
}

export function ConnectSocialAccounts({ accounts, onConnect, onDisconnect }: ConnectSocialAccountsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenConnect = (account: SocialAccount) => {
    setSelectedAccount(account);
    setHandle(account.handle || '');
    setDialogOpen(true);
  };

  const handleConnect = async () => {
    if (!selectedAccount || !handle.trim()) return;
    
    setIsLoading(true);
    await onConnect(selectedAccount.id, handle.trim());
    setIsLoading(false);
    setDialogOpen(false);
    setHandle('');
    setSelectedAccount(null);
  };

  const handleDisconnect = async (account: SocialAccount) => {
    setIsLoading(true);
    await onDisconnect(account.id);
    setIsLoading(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Social Accounts</h2>
          <p className="text-sm text-muted-foreground">Connect to share your achievements</p>
        </div>
        
        <div className="grid gap-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-lg bg-card p-3 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {account.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{account.name}</p>
                  {account.connected && account.handle && (
                    <p className="text-xs text-muted-foreground">@{account.handle}</p>
                  )}
                </div>
              </div>
              
              {account.connected ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-secondary" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenConnect(account)}
                >
                  Connect
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect {selectedAccount?.name}</DialogTitle>
            <DialogDescription>
              Enter your {selectedAccount?.name} username to share achievements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="handle">Username / Handle</Label>
              <Input
                id="handle"
                placeholder={selectedAccount?.placeholder}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={isLoading || !handle.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
