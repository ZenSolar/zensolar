import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ConnectAccountButtonProps {
  service: string;
  label: string;
  connected: boolean;
  onConnect: () => void;
}

export function ConnectAccountButton({ service, label, connected, onConnect }: ConnectAccountButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate OAuth redirect delay
    await new Promise(resolve => setTimeout(resolve, 800));
    onConnect();
    setIsConnecting(false);
  };

  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-secondary/20 p-3 border border-secondary">
        <Check className="h-5 w-5 text-secondary" />
        <span className="text-sm font-medium text-foreground">{label} Connected</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Connect {label}</p>
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          `CONNECT ${label.toUpperCase()}`
        )}
      </Button>
    </div>
  );
}
