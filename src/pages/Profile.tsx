import { useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Mail, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Shield, 
  Zap,
  Sun,
  Car,
  Battery,
  Users,
  ExternalLink,
  Copy,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { PullToRefreshWrapper } from "@/components/ui/PullToRefreshWrapper";

export default function Profile() {
  const { user } = useAuth();
  const { profile, isLoading, refetch } = useProfile();

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast.success('Profile updated');
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const copyWalletAddress = () => {
    if (profile?.wallet_address) {
      navigator.clipboard.writeText(profile.wallet_address);
      toast.success('Wallet address copied!');
    }
  };

  const connectedEnergyProviders = [
    profile?.tesla_connected,
    profile?.enphase_connected,
    profile?.solaredge_connected,
    (profile as any)?.wallbox_connected
  ].filter(Boolean).length;

  const connectedSocialAccounts = [
    profile?.facebook_connected,
    profile?.instagram_connected,
    profile?.tiktok_connected,
    profile?.twitter_connected,
    profile?.linkedin_connected
  ].filter(Boolean).length;

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-primary/20 p-6 md:p-8"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            {/* Avatar with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-lg opacity-50 scale-110" />
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-xl relative z-10">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl md:text-3xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* User info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {profile?.display_name ?? 'ZenSolar User'}
                </h1>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              
              {profile?.wallet_address && (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Badge variant="outline" className="font-mono text-xs px-3 py-1.5 gap-2 cursor-pointer hover:bg-muted/50 transition-colors" onClick={copyWalletAddress}>
                    <Wallet className="h-3 w-3" />
                    {`${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`}
                    <Copy className="h-3 w-3 opacity-50" />
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a 
                      href={`https://sepolia.basescan.org/address/${profile.wallet_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Quick stats */}
            <div className="flex gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{connectedEnergyProviders}</div>
                <div className="text-xs text-muted-foreground">Energy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{connectedSocialAccounts}</div>
                <div className="text-xs text-muted-foreground">Social</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 grid-cols-2 md:grid-cols-4"
        >
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Member since</p>
                  <p className="text-sm font-semibold truncate">
                    {profile?.created_at ? formatDate(profile.created_at).split(',')[0] : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/5 to-transparent border-secondary/20 hover:border-secondary/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-secondary/10">
                  <Zap className="h-5 w-5 text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-semibold">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20 hover:border-accent/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10">
                  <Sparkles className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Referral Code</p>
                  <p className="text-sm font-semibold font-mono truncate">
                    {profile?.referral_code || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Network</p>
                  <p className="text-sm font-semibold">Base Sepolia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected Energy Providers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Energy Providers</CardTitle>
                  <CardDescription>Connected clean energy accounts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <EnergyProviderCard 
                  name="Tesla" 
                  connected={profile?.tesla_connected} 
                  icon={<Car className="h-5 w-5" />}
                  description="EV, Powerwall, Solar"
                  gradient="from-red-500/10 to-red-600/5"
                  iconBg="bg-red-500/10"
                  iconColor="text-red-500"
                />
                <EnergyProviderCard 
                  name="Enphase" 
                  connected={profile?.enphase_connected} 
                  icon={<Sun className="h-5 w-5" />}
                  description="Solar microinverters"
                  gradient="from-orange-500/10 to-orange-600/5"
                  iconBg="bg-orange-500/10"
                  iconColor="text-orange-500"
                />
                <EnergyProviderCard 
                  name="SolarEdge" 
                  connected={profile?.solaredge_connected} 
                  icon={<Sun className="h-5 w-5" />}
                  description="Solar inverters"
                  gradient="from-amber-500/10 to-amber-600/5"
                  iconBg="bg-amber-500/10"
                  iconColor="text-amber-500"
                />
                <EnergyProviderCard 
                  name="Wallbox" 
                  connected={(profile as any)?.wallbox_connected} 
                  icon={<Battery className="h-5 w-5" />}
                  description="EV charging"
                  gradient="from-green-500/10 to-green-600/5"
                  iconBg="bg-green-500/10"
                  iconColor="text-green-500"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-transparent border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Social Accounts</CardTitle>
                  <CardDescription>Linked social media profiles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <SocialBadge label="Facebook" connected={profile?.facebook_connected} handle={profile?.facebook_handle} />
                <SocialBadge label="Instagram" connected={profile?.instagram_connected} handle={profile?.instagram_handle} />
                <SocialBadge label="TikTok" connected={profile?.tiktok_connected} handle={profile?.tiktok_handle} />
                <SocialBadge label="X" connected={profile?.twitter_connected} handle={profile?.twitter_handle} />
                <SocialBadge label="LinkedIn" connected={profile?.linkedin_connected} handle={profile?.linkedin_handle} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PullToRefreshWrapper>
  );
}

function EnergyProviderCard({ 
  name, 
  connected, 
  icon, 
  description, 
  gradient, 
  iconBg, 
  iconColor 
}: { 
  name: string; 
  connected?: boolean | null; 
  icon: React.ReactNode;
  description: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className={`relative p-4 rounded-xl bg-gradient-to-br ${gradient} border ${connected ? 'border-primary/30' : 'border-border/50'} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{name}</p>
            {connected ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant={connected ? "default" : "secondary"} className={`shrink-0 ${connected ? 'bg-primary/20 text-primary border-primary/30' : ''}`}>
          {connected ? 'Connected' : 'Not linked'}
        </Badge>
      </div>
    </div>
  );
}

function SocialBadge({ label, connected, handle }: { label: string; connected?: boolean | null; handle?: string | null }) {
  return (
    <Badge 
      variant={connected ? "default" : "secondary"} 
      className={`gap-1.5 px-3 py-2 text-sm ${
        connected 
          ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border-primary/30 hover:border-primary/50' 
          : 'opacity-60'
      } transition-all`}
    >
      {connected ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      <span>{label}</span>
      {handle && connected && (
        <span className="text-muted-foreground text-xs ml-1">@{handle}</span>
      )}
    </Badge>
  );
}