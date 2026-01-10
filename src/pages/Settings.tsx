import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Smartphone, Globe, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* iOS PWA Install Prompt */}
          {isIOSDevice && !isPWAInstalled && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
              <p className="text-sm font-medium text-primary mb-1">📱 Install App for Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                Tap the Share button <span className="inline-block">⬆️</span> then "Add to Home Screen" to enable push notifications on iOS.
              </p>
            </div>
          )}
          
          {/* Push Notifications */}
          <div className="flex items-center justify-between gap-4 touch-target">
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                {getPushNotificationMessage()}
              </p>
            </div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
            ) : (
              <Switch 
                id="push-notifications" 
                checked={isSubscribed}
                onCheckedChange={toggle}
                disabled={!isSupported || permission === 'denied'}
              />
            )}
          </div>
          
          <div className="flex items-center justify-between gap-4 touch-target">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates about your earnings</p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4 touch-target">
            <div className="space-y-0.5">
              <Label htmlFor="milestone-alerts">Milestone Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when you unlock NFTs</p>
            </div>
            <Switch id="milestone-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4 touch-target">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-summary">Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">Receive a weekly energy report</p>
            </div>
            <Switch id="weekly-summary" />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>Control your data and visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 touch-target">
            <div className="space-y-0.5">
              <Label htmlFor="public-profile">Public Profile</Label>
              <p className="text-sm text-muted-foreground">Allow others to see your achievements</p>
            </div>
            <Switch id="public-profile" />
          </div>
          <div className="flex items-center justify-between gap-4 touch-target">
            <div className="space-y-0.5">
              <Label htmlFor="leaderboard">Show on Leaderboard</Label>
              <p className="text-sm text-muted-foreground">Appear in community rankings</p>
            </div>
            <Switch id="leaderboard" />
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            App Preferences
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 touch-target">
            <div className="space-y-0.5">
              <Label htmlFor="auto-refresh">Auto-refresh Data</Label>
              <p className="text-sm text-muted-foreground">Automatically update energy stats</p>
            </div>
            <Switch id="auto-refresh" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Network */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Blockchain Network
          </CardTitle>
          <CardDescription>Current network configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Sepolia Testnet</p>
              <p className="text-sm text-muted-foreground">Beta testing environment</p>
            </div>
            <div className="h-3 w-3 rounded-full bg-secondary animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Mainnet support coming after beta testing phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
