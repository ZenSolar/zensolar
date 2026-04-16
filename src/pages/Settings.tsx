import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Bell, 
  Shield, 
  Smartphone, 
  Globe, 
  Loader2, 
  Zap,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Palette
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { WalletSetupCard } from "@/components/settings/WalletSetupCard";
import { useTheme } from "next-themes";

export default function Settings() {
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission, 
    isIOSDevice,
    isPWAInstalled,
    toggle 
  } = usePushNotifications();
  
  const { theme, setTheme } = useTheme();

  // Generate helpful message based on device/browser state
  const getPushNotificationMessage = () => {
    if (isIOSDevice && !isPWAInstalled) {
      return "Install the app to your home screen first";
    }
    if (!isSupported) {
      return "Not supported in this browser";
    }
    if (permission === 'denied') {
      return "Blocked by browser - enable in settings";
    }
    return "Receive instant alerts on your device";
  };

  const getPushStatus = () => {
    if (isSubscribed) return { icon: CheckCircle2, color: 'text-primary', label: 'Active' };
    if (permission === 'denied') return { icon: AlertCircle, color: 'text-destructive', label: 'Blocked' };
    return { icon: Bell, color: 'text-muted-foreground', label: 'Disabled' };
  };

  const pushStatus = getPushStatus();

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Customize your ZenSolar experience</p>
      </motion.div>

      {/* Wallet Setup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <WalletSetupCard />
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Light or dark mode</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                <Button
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="h-8 px-3 gap-1.5 text-xs"
                >
                  <Sun className="h-3.5 w-3.5" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="h-8 px-3 gap-1.5 text-xs"
                >
                  <Moon className="h-3.5 w-3.5" />
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-border/50">
          <div className="flex items-center justify-between p-4 pb-0">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Notifications</p>
            </div>
            <Badge variant="outline" className={`gap-1 text-[10px] ${pushStatus.color}`}>
              <pushStatus.icon className="h-2.5 w-2.5" />
              {pushStatus.label}
            </Badge>
          </div>
          <CardContent className="p-4 space-y-1">
            {/* iOS PWA Install Prompt */}
            {isIOSDevice && !isPWAInstalled && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 mb-3">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-xs mb-0.5">Install for Push Notifications</p>
                    <p className="text-[11px] text-muted-foreground">
                      Tap Share ⬆️ → "Add to Home Screen"
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <SettingRow
              icon={<Bell className="h-4 w-4" />}
              label="Push Notifications"
              description={getPushNotificationMessage()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Switch 
                  checked={isSubscribed}
                  onCheckedChange={toggle}
                  disabled={!isSupported || permission === 'denied'}
                />
              )}
            </SettingRow>
            
            <SettingRow
              icon={<Zap className="h-4 w-4" />}
              label="Milestone Alerts"
              description="Get notified when you unlock NFTs"
            >
              <Switch defaultChecked />
            </SettingRow>
            
            <SettingRow
              icon={<Globe className="h-4 w-4" />}
              label="Weekly Summary"
              description="Receive a weekly energy report"
            >
              <Switch />
            </SettingRow>
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy & Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="overflow-hidden border-border/50">
          <div className="flex items-center gap-2.5 p-4 pb-0">
            <Shield className="h-4 w-4 text-secondary" />
            <p className="text-sm font-semibold">Privacy & Preferences</p>
          </div>
          <CardContent className="p-4 space-y-1">
            <SettingRow
              icon={<Globe className="h-4 w-4" />}
              label="Public Profile"
              description="Allow others to see your achievements"
            >
              <Switch />
            </SettingRow>
            
            <SettingRow
              icon={<Zap className="h-4 w-4" />}
              label="Show on Leaderboard"
              description="Appear in community rankings"
            >
              <Switch />
            </SettingRow>

            <SettingRow
              icon={<Zap className="h-4 w-4" />}
              label="Auto-refresh Data"
              description="Automatically update energy stats"
            >
              <Switch defaultChecked />
            </SettingRow>
          </CardContent>
        </Card>
      </motion.div>

      {/* Blockchain Network */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-2.5 w-2.5 rounded-full bg-secondary" />
                  <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-secondary animate-ping opacity-40" />
                </div>
                <div>
                  <p className="text-sm font-medium">Base Sepolia Testnet</p>
                  <p className="text-xs text-muted-foreground">Beta testing environment</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-secondary/10 text-secondary border-secondary/30">
                Active
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Mainnet support coming after beta.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SettingRow({ 
  icon, 
  label, 
  description, 
  children 
}: { 
  icon: React.ReactNode;
  label: string; 
  description: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors -mx-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
          {icon}
        </div>
        <div className="space-y-0.5">
          <Label className="text-base font-medium">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}