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
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  History,
  Rows3,
  Rows4
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { WalletSetupCard } from "@/components/settings/WalletSetupCard";
import { SecurityBadge } from "@/components/security/SecurityBadge";

import { useDensity } from "@/hooks/useDensity";

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
  
  
  const { density, setDensity } = useDensity();

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
    <div className="max-w-lg lg:max-w-5xl mx-auto px-4 py-5 lg:py-8 space-y-4 lg:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
          <h1 className="text-xl lg:text-3xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-sm lg:text-base text-muted-foreground">Customize your ZenSolar experience</p>
      </motion.div>

      {/* Wallet Setup — full width (onboarding feature) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <WalletSetupCard />
      </motion.div>

      {/* Security entry — full-width, above the two-column grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">Security & Encryption</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                Face ID · AES-256 · self-custody · Base L2 anchoring
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SecurityBadge variant="pill" label="Quick view" />
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link to="/security">Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two-column grid for setting cards on desktop */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">

      {/* Appearance — light mode archived; ZenSolar is dark-only (Tesla-style). */}

      {/* Density (desktop-only effect; setting is still saved on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.075 }}
      >
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <Rows3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Density</p>
                  <p className="text-xs text-muted-foreground">Desktop spacing &amp; card padding</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                <Button
                  variant={density === 'comfortable' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDensity('comfortable')}
                  className="h-8 px-3 gap-1.5 text-xs"
                >
                  <Rows3 className="h-3.5 w-3.5" />
                  Comfortable
                </Button>
                <Button
                  variant={density === 'compact' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDensity('compact')}
                  className="h-8 px-3 gap-1.5 text-xs"
                >
                  <Rows4 className="h-3.5 w-3.5" />
                  Compact
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
    <div className="flex items-center justify-between gap-3 py-3 px-1 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="text-muted-foreground/60 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{label}</p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}