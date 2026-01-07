import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Download, Smartphone, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Sun className="h-10 w-10 text-solar" />
            </div>
          </div>
          <CardTitle className="text-2xl">Install ZenSolar</CardTitle>
          <CardDescription>
            Add ZenSolar to your home screen for the best experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-secondary mx-auto" />
              <p className="text-lg font-medium text-foreground">
                ZenSolar is installed!
              </p>
              <p className="text-sm text-muted-foreground">
                You can now access ZenSolar from your home screen
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Open App
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Install on iPhone/iPad
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Tap the Share button in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
              <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                Continue to App
              </Button>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Install App
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                Continue in Browser
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Install from Browser Menu
                </p>
                <p className="text-sm text-muted-foreground">
                  Look for "Install App" or "Add to Home Screen" in your browser's menu
                </p>
              </div>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Continue to App
              </Button>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium text-foreground mb-2">Why install?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Works offline</li>
              <li>✓ Faster loading</li>
              <li>✓ Full-screen experience</li>
              <li>✓ Quick access from home screen</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
