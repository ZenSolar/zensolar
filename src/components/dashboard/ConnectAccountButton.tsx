import { Button } from '@/components/ui/button';
import { Check, Loader2, LogOut } from 'lucide-react';
import { useState } from 'react';

// Import brand logos
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

// Map service to logo
const providerLogos: Record<string, string> = {
  tesla: teslaLogo,
  enphase: enphaseLogo,
  solaredge: solaredgeLogo,
  wallbox: wallboxLogo,
};

interface ConnectAccountButtonProps {
  service: string;
  label: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect?: () => void;
}

export function ConnectAccountButton({ 
  service, 
  label, 
  connected, 
  onConnect, 
  onDisconnect 
}: ConnectAccountButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const logo = providerLogos[service];

  const handleConnect = async () => {
    setIsConnecting(true);
    await onConnect();
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    setIsDisconnecting(true);
    await onDisconnect();
    setIsDisconnecting(false);
  };

  if (connected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/20 p-3 border border-secondary">
        <div className="flex items-center gap-3">
          {logo && (
            <img 
              src={logo} 
              alt={label}
              className="h-5 w-5 object-contain rounded-sm"
            />
          )}
          <Check className="h-5 w-5 text-secondary" />
          <span className="text-sm font-medium text-foreground">{label} Connected</span>
        </div>
        {onDisconnect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-muted-foreground hover:text-destructive"
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {logo && (
          <img 
            src={logo} 
            alt={label}
            className="h-5 w-5 object-contain rounded-sm"
          />
        )}
        <p className="text-sm text-muted-foreground">Connect {label}</p>
      </div>
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
