import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Download, Smartphone, CheckCircle, Zap, Shield, Wifi, Share } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const benefits = [
  { icon: Zap, text: 'Faster loading' },
  { icon: Wifi, text: 'Works offline' },
  { icon: Shield, text: 'Full-screen experience' },
  { icon: Smartphone, text: 'Quick home screen access' },
];

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden border-border/50 shadow-xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-6 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
            <div className="relative z-10">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl mb-4">
                <Sun className="h-10 w-10 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5">
                Progressive Web App
              </Badge>
            </div>
          </div>

          <CardHeader className="text-center pt-4 pb-2">
            <CardTitle className="text-2xl">Install ZenSolar</CardTitle>
            <CardDescription className="text-base">
              Add ZenSolar to your home screen for the best experience
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isInstalled ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    ZenSolar is installed!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can now access ZenSolar from your home screen
                  </p>
                </div>
                <Button onClick={() => navigate('/auth')} className="w-full gap-2" size="lg">
                  Open App
                  <Zap className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : isIOS ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-5 space-y-4 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">Install on iPhone/iPad</p>
                  </div>
                  <ol className="space-y-3">
                    {[
                      { step: 1, icon: Share, text: 'Tap the Share button in Safari' },
                      { step: 2, icon: Download, text: 'Scroll down and tap "Add to Home Screen"' },
                      { step: 3, icon: CheckCircle, text: 'Tap "Add" to confirm' },
                    ].map((item) => (
                      <li key={item.step} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {item.step}
                        </div>
                        <span className="text-sm text-muted-foreground">{item.text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <Button variant="outline" onClick={() => navigate('/auth')} className="w-full" size="lg">
                  Continue to App
                </Button>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4">
                <Button onClick={handleInstall} className="w-full gap-2" size="lg">
                  <Download className="h-5 w-5" />
                  Install App
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')} className="w-full" size="lg">
                  Continue in Browser
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-5 space-y-3 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">Install from Browser Menu</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Look for "Install App" or "Add to Home Screen" in your browser's menu
                  </p>
                </div>
                <Button onClick={() => navigate('/auth')} className="w-full" size="lg">
                  Continue to App
                </Button>
              </div>
            )}

            {/* Benefits */}
            <div className="border-t border-border/50 pt-5">
              <h3 className="font-semibold text-foreground mb-3 text-center">Why install?</h3>
              <div className="grid grid-cols-2 gap-3">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.text}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/30"
                  >
                    <benefit.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
