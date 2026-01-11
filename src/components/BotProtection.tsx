import { useEffect } from 'react';
import { useBotProtection } from '@/hooks/useBotProtection';

interface BotProtectionProps {
  children: React.ReactNode;
  onBotDetected?: (signals: string[]) => void;
  blockBots?: boolean;
}

export function BotProtection({ 
  children, 
  onBotDetected,
  blockBots = false 
}: BotProtectionProps) {
  const { isBot, confidence, signals } = useBotProtection();

  useEffect(() => {
    if (isBot && onBotDetected) {
      onBotDetected(signals);
    }
  }, [isBot, signals, onBotDetected]);

  // If blocking bots and detected as bot with high confidence
  if (blockBots && isBot && confidence >= 70) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Access Restricted
          </h1>
          <p className="text-muted-foreground">
            Automated access is not permitted. Please use a standard browser.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
