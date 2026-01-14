import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2, ChevronDown, ChevronUp, Plus, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const connectedAccounts = accounts.filter(acc => acc.connected);
  const disconnectedAccounts = accounts.filter(acc => !acc.connected);
  const hasConnectedAccounts = connectedAccounts.length > 0;

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

  // If no accounts connected, show compact "add social" prompt
  if (!hasConnectedAccounts) {
    return (
      <>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <CollapsibleTrigger asChild>
              <button 
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground">Social Accounts</span>
                    <p className="text-xs text-muted-foreground">Connect to share achievements</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t border-border p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {accounts.map((account) => (
                    <Button
                      key={account.id}
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2"
                      onClick={() => handleOpenConnect(account)}
                    >
                      <div className="flex h-5 w-5 items-center justify-center">
                        {account.icon}
                      </div>
                      <span className="truncate">{account.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

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

  // Compact view when accounts are connected
  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <CollapsibleTrigger asChild>
            <button 
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              type="button"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
                  <Share2 className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Social Accounts</span>
                    <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                      {connectedAccounts.length} linked
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {connectedAccounts.slice(0, 3).map((acc) => (
                      <span 
                        key={acc.id}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                      >
                        <div className="h-3 w-3">{acc.icon}</div>
                        @{acc.handle}
                      </span>
                    ))}
                    {connectedAccounts.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{connectedAccounts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border p-4 space-y-4">
              {/* Connected accounts */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Connected</p>
                <div className="space-y-2">
                  {connectedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-lg bg-secondary/10 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                          {account.icon}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{account.name}</p>
                          <p className="text-xs text-muted-foreground">@{account.handle}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(account)}
                        disabled={isLoading}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add more */}
              {disconnectedAccounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add More</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {disconnectedAccounts.map((account) => (
                      <Button
                        key={account.id}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => handleOpenConnect(account)}
                      >
                        <div className="flex h-4 w-4 items-center justify-center">
                          {account.icon}
                        </div>
                        <span className="truncate text-xs">{account.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

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
