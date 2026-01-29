import { Rocket, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

// Import brand logos
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

interface CompactSetupPromptProps {
  onConnectEnergy: () => void;
}

export function CompactSetupPrompt({ onConnectEnergy }: CompactSetupPromptProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Get Started</h2>
            <p className="text-sm text-muted-foreground">Connect an energy account to start earning</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 flex-1 min-w-[120px]"
            onClick={onConnectEnergy}
          >
            <img src={teslaLogo} alt="Tesla" className="h-4 w-4 object-contain" />
            Tesla
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 flex-1 min-w-[120px]"
            onClick={onConnectEnergy}
          >
            <img src={enphaseLogo} alt="Enphase" className="h-4 w-4 object-contain" />
            Enphase
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 flex-1 min-w-[120px]"
            onClick={onConnectEnergy}
          >
            <img src={solaredgeLogo} alt="SolarEdge" className="h-4 w-4 object-contain" />
            SolarEdge
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 flex-1 min-w-[120px]"
            onClick={onConnectEnergy}
          >
            <img src={wallboxLogo} alt="Wallbox" className="h-4 w-4 object-contain" />
            Wallbox
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Or manage all your connections on the{' '}
          <button 
            onClick={() => navigate('/profile')}
            className="text-primary hover:underline font-medium"
          >
            Profile page
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
