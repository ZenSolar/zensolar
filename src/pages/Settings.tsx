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
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your ZenSolar experience</p>
        </div>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Palette className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>Customize how ZenSolar looks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                <Button
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>Manage how you receive updates</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={`gap-1.5 ${pushStatus.color}`}>
                <pushStatus.icon className="h-3 w-3" />
                {pushStatus.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* iOS PWA Install Prompt */}
            {isIOSDevice && !isPWAInstalled && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                    <Smartphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Install App for Push Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Tap the Share button <span className="inline-block">⬆️</span> then "Add to Home Screen" to enable push notifications on iOS.
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

      {/* Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-secondary/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-lg">Privacy</CardTitle>
                <CardDescription>Control your data and visibility</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* App Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Smartphone className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">App Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
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

      {/* Network */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Blockchain Network</CardTitle>
                <CardDescription>Current network configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <div className="absolute inset-0 h-3 w-3 rounded-full bg-secondary animate-ping opacity-50" />
                </div>
                <div>
                  <p className="font-semibold">Base Sepolia Testnet</p>
                  <p className="text-sm text-muted-foreground">Beta testing environment</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Mainnet support coming after beta testing phase.
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