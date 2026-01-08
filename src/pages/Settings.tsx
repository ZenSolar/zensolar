import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Shield, Smartphone, Globe } from "lucide-react";

export default function Settings() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates about your earnings</p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="milestone-alerts">Milestone Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when you unlock NFTs</p>
            </div>
            <Switch id="milestone-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-profile">Public Profile</Label>
              <p className="text-sm text-muted-foreground">Allow others to see your achievements</p>
            </div>
            <Switch id="public-profile" />
          </div>
          <div className="flex items-center justify-between">
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
          <div className="flex items-center justify-between">
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
