import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useEnergyOAuth } from "@/hooks/useEnergyOAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SolarEdgeConnectDialog } from "@/components/dashboard/SolarEdgeConnectDialog";
import { WallboxConnectDialog } from "@/components/dashboard/WallboxConnectDialog";
import { EnphaseCodeDialog } from "@/components/dashboard/EnphaseCodeDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Mail, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Zap,
  Sun,
  Car,
  Battery,
  Users,
  ExternalLink,
  Copy,
  Sparkles,
  Settings,
  Link2,
  Unlink,
  Share2,
  ChevronDown,
  ChevronUp,
  Home
} from "lucide-react";
import { toast } from "sonner";
import { PullToRefreshWrapper } from "@/components/ui/PullToRefreshWrapper";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Import brand logos
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

const providerLogos: Record<string, string> = {
  tesla: teslaLogo,
  enphase: enphaseLogo,
  solaredge: solaredgeLogo,
  wallbox: wallboxLogo,
};

// Simple SVG icons for social platforms
const FacebookIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, refetch, connectSocialAccount, disconnectSocialAccount, updateProfile, disconnectWallet } = useProfile();
  const { connectedAccounts, connectAccount, disconnectAccount, refreshDashboard } = useDashboardData();
  const { startTeslaOAuth, startEnphaseOAuth, exchangeEnphaseCode, connectSolarEdge, connectWallbox } = useEnergyOAuth();
  
  const [socialExpanded, setSocialExpanded] = useState(false);
  const [solarEdgeDialogOpen, setSolarEdgeDialogOpen] = useState(false);
  const [wallboxDialogOpen, setWallboxDialogOpen] = useState(false);
  const [enphaseDialogOpen, setEnphaseDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState<'tesla' | 'enphase' | 'solaredge' | 'wallbox' | null>(null);
  const [homeAddress, setHomeAddress] = useState('');
  const [homeAddressSaving, setHomeAddressSaving] = useState(false);
  const [homeAddressInitialized, setHomeAddressInitialized] = useState(false);

  // Initialize home address from profile once loaded
  useEffect(() => {
    if (profile && !homeAddressInitialized) {
      setHomeAddress(profile.home_address || '');
      setHomeAddressInitialized(true);
    }
  }, [profile, homeAddressInitialized]);

  const homeAddressDirty = homeAddressInitialized && homeAddress !== (profile?.home_address || '');

  const handleSaveHomeAddress = async () => {
    setHomeAddressSaving(true);
    const { error } = await updateProfile({ home_address: homeAddress.trim() || null } as any);
    setHomeAddressSaving(false);
    if (!error) toast.success('Home address saved — charging sessions will be classified on next sync');
  };

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast.success('Profile updated');
  }, [refetch]);

  const handleConnectWallet = async () => {
    navigate('/onboarding?step=wallet');
  };

  const handleDisconnectWallet = async () => {
    await disconnectWallet();
    toast.success('Wallet disconnected');
  };

  const handleConnectEnergy = async (service: 'tesla' | 'enphase' | 'solaredge' | 'wallbox') => {
    setIsConnecting(service);
    try {
      switch (service) {
        case 'tesla':
          await startTeslaOAuth();
          break;
        case 'enphase':
          const result = await startEnphaseOAuth();
          if (result?.useManualCode) {
            setEnphaseDialogOpen(true);
          }
          break;
        case 'solaredge':
          setSolarEdgeDialogOpen(true);
          break;
        case 'wallbox':
          setWallboxDialogOpen(true);
          break;
      }
    } finally {
      setIsConnecting(null);
    }
  };

  const handleEnphaseCodeSubmit = async (code: string) => {
    const success = await exchangeEnphaseCode(code);
    if (success) {
      setEnphaseDialogOpen(false);
      connectAccount('enphase');
      await refetch();
      refreshDashboard();
    }
  };

  const handleSolarEdgeConnect = async (apiKey: string, siteId: string) => {
    const success = await connectSolarEdge(apiKey, siteId);
    if (success) {
      setSolarEdgeDialogOpen(false);
      connectAccount('solaredge');
      await refetch();
      refreshDashboard();
    }
    return success;
  };

  const handleWallboxConnect = async (email: string, password: string) => {
    const success = await connectWallbox(email, password);
    if (success) {
      setWallboxDialogOpen(false);
      connectAccount('wallbox');
      await refetch();
      refreshDashboard();
    }
    return success;
  };

  const handleDisconnectEnergyRequest = (service: 'tesla' | 'enphase' | 'solaredge' | 'wallbox') => {
    setDisconnectConfirm(service);
  };

  const handleDisconnectEnergyConfirm = () => {
    if (disconnectConfirm) {
      disconnectAccount(disconnectConfirm);
      setDisconnectConfirm(null);
    }
  };

  const getProviderDisplayName = (service: string) => {
    const names: Record<string, string> = {
      tesla: 'Tesla',
      enphase: 'Enphase',
      solaredge: 'SolarEdge',
      wallbox: 'Wallbox',
    };
    return names[service] || service;
  };

  const handleConnectSocial = async (id: string, handle: string) => {
    await connectSocialAccount(id as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin', handle);
  };

  const handleDisconnectSocial = async (id: string) => {
    await disconnectSocialAccount(id as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin');
  };

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

  const connectedEnergyProviders = connectedAccounts.filter(acc => acc.connected).length;

  const connectedSocialAccounts = [
    profile?.facebook_connected,
    profile?.instagram_connected,
    profile?.tiktok_connected,
    profile?.twitter_connected,
    profile?.linkedin_connected
  ].filter(Boolean).length;

  const socialAccounts = [
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: <FacebookIcon />, 
      connected: profile?.facebook_connected ?? false,
      handle: profile?.facebook_handle ?? undefined,
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: <InstagramIcon />, 
      connected: profile?.instagram_connected ?? false,
      handle: profile?.instagram_handle ?? undefined,
    },
    { 
      id: 'tiktok', 
      name: 'TikTok', 
      icon: <TikTokIcon />, 
      connected: profile?.tiktok_connected ?? false,
      handle: profile?.tiktok_handle ?? undefined,
    },
    { 
      id: 'twitter', 
      name: 'X (Twitter)', 
      icon: <TwitterIcon />, 
      connected: profile?.twitter_connected ?? false,
      handle: profile?.twitter_handle ?? undefined,
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: <LinkedInIcon />, 
      connected: profile?.linkedin_connected ?? false,
      handle: profile?.linkedin_handle ?? undefined,
    },
  ];

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

        {/* Wallet Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-transparent border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Wallet className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Wallet</CardTitle>
                  <CardDescription>Your connected crypto wallet</CardDescription>
                </div>
                {profile?.wallet_address ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectWallet}
                    className="gap-2"
                  >
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleConnectWallet}
                    className="gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Connect
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {profile?.wallet_address ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <CheckCircle2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Connected</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{profile.wallet_address}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="p-2.5 rounded-xl bg-muted">
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">No wallet connected</p>
                    <p className="text-xs text-muted-foreground">Connect a wallet to mint tokens and NFTs</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Energy Providers - Full Management */}
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
                  <CardDescription>Manage your connected energy accounts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <EnergyProviderCard 
                  name="Tesla" 
                  service="tesla"
                  connected={profile?.tesla_connected} 
                  isConnecting={isConnecting === 'tesla'}
                  icon={<Car className="h-5 w-5" />}
                  logo={teslaLogo}
                  description="EV, Powerwall, Solar"
                  gradient="from-red-500/10 to-red-600/5"
                  iconBg="bg-red-500/10"
                  iconColor="text-red-500"
                  onConnect={handleConnectEnergy}
                  onDisconnect={handleDisconnectEnergyRequest}
                />
                <EnergyProviderCard 
                  name="Enphase" 
                  service="enphase"
                  connected={profile?.enphase_connected} 
                  isConnecting={isConnecting === 'enphase'}
                  icon={<Sun className="h-5 w-5" />}
                  logo={enphaseLogo}
                  description="Solar microinverters"
                  gradient="from-orange-500/10 to-orange-600/5"
                  iconBg="bg-orange-500/10"
                  iconColor="text-orange-500"
                  onConnect={handleConnectEnergy}
                  onDisconnect={handleDisconnectEnergyRequest}
                />
                <EnergyProviderCard 
                  name="SolarEdge" 
                  service="solaredge"
                  connected={profile?.solaredge_connected} 
                  isConnecting={isConnecting === 'solaredge'}
                  icon={<Sun className="h-5 w-5" />}
                  logo={solaredgeLogo}
                  description="Solar inverters"
                  gradient="from-amber-500/10 to-amber-600/5"
                  iconBg="bg-amber-500/10"
                  iconColor="text-amber-500"
                  onConnect={handleConnectEnergy}
                  onDisconnect={handleDisconnectEnergyRequest}
                />
                <EnergyProviderCard 
                  name="Wallbox" 
                  service="wallbox"
                  connected={(profile as any)?.wallbox_connected} 
                  isConnecting={isConnecting === 'wallbox'}
                  icon={<Battery className="h-5 w-5" />}
                  logo={wallboxLogo}
                  description="EV charging"
                  gradient="from-green-500/10 to-green-600/5"
                  iconBg="bg-green-500/10"
                  iconColor="text-green-500"
                  onConnect={handleConnectEnergy}
                  onDisconnect={handleDisconnectEnergyRequest}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Home Address — for charging classification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Home Address</CardTitle>
                  <CardDescription>Used to classify EV charging as home vs. away</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  placeholder="e.g. 3015 Sea Jay Drive, Austin, TX"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button 
                  size="sm" 
                  onClick={handleSaveHomeAddress} 
                  disabled={!homeAddressDirty || homeAddressSaving}
                >
                  {homeAddressSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Charging sessions at or near this address will be classified as "Home Charging"
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <AlertDialog open={!!disconnectConfirm} onOpenChange={(open) => !open && setDisconnectConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect {disconnectConfirm && getProviderDisplayName(disconnectConfirm)}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your {disconnectConfirm && getProviderDisplayName(disconnectConfirm)} connection and delete all associated energy data from ZenSolar. 
                You can reconnect anytime, but you'll need to re-authorize access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDisconnectEnergyConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Social Accounts - Collapsible with Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <Collapsible open={socialExpanded} onOpenChange={setSocialExpanded}>
              <CardHeader className="bg-gradient-to-r from-secondary/5 to-transparent border-b border-border/50">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-3 w-full text-left">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Share2 className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Social Accounts</CardTitle>
                      <CardDescription>
                        {connectedSocialAccounts > 0 
                          ? `${connectedSocialAccounts} linked • Optional for sharing achievements`
                          : 'Optional • Link to share achievements'
                        }
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                      {socialExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {socialAccounts.map((account) => (
                      <SocialBadge 
                        key={account.id}
                        id={account.id}
                        label={account.name} 
                        icon={account.icon}
                        connected={account.connected} 
                        handle={account.handle}
                        onConnect={handleConnectSocial}
                        onDisconnect={handleDisconnectSocial}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </motion.div>
      </div>
      
      {/* Connection Dialogs */}
      <SolarEdgeConnectDialog
        open={solarEdgeDialogOpen}
        onOpenChange={setSolarEdgeDialogOpen}
        onSubmit={handleSolarEdgeConnect}
      />
      
      <WallboxConnectDialog
        open={wallboxDialogOpen}
        onOpenChange={setWallboxDialogOpen}
        onSubmit={handleWallboxConnect}
      />
      
      <EnphaseCodeDialog
        open={enphaseDialogOpen}
        onOpenChange={setEnphaseDialogOpen}
        onSubmit={async (code) => {
          await handleEnphaseCodeSubmit(code);
          return true;
        }}
      />
    </PullToRefreshWrapper>
  );
}

function EnergyProviderCard({ 
  name, 
  service,
  connected, 
  isConnecting,
  icon, 
  logo,
  description, 
  gradient, 
  iconBg, 
  iconColor,
  onConnect,
  onDisconnect,
}: { 
  name: string; 
  service: 'tesla' | 'enphase' | 'solaredge' | 'wallbox';
  connected?: boolean | null; 
  isConnecting?: boolean;
  icon: React.ReactNode;
  logo: string;
  description: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  onConnect: (service: 'tesla' | 'enphase' | 'solaredge' | 'wallbox') => void;
  onDisconnect: (service: 'tesla' | 'enphase' | 'solaredge' | 'wallbox') => void;
}) {
  return (
    <div className={`relative p-4 rounded-xl bg-gradient-to-br ${gradient} border ${connected ? 'border-primary/30' : 'border-border/50'} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <img src={logo} alt={name} className="h-5 w-5 object-contain" />
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
        {connected ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisconnect(service)}
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Unlink className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConnect(service)}
            disabled={isConnecting}
            className="shrink-0"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-1" />
                Connect
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function SocialBadge({ 
  id,
  label, 
  icon,
  connected, 
  handle,
  onConnect,
  onDisconnect,
}: { 
  id: string;
  label: string; 
  icon: React.ReactNode;
  connected?: boolean | null; 
  handle?: string | null;
  onConnect: (id: string, handle: string) => void;
  onDisconnect: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [handleInput, setHandleInput] = useState('');

  const handleSubmit = () => {
    if (handleInput.trim()) {
      onConnect(id, handleInput.trim());
      setIsEditing(false);
      setHandleInput('');
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
        <span className="text-muted-foreground">{icon}</span>
        <input
          type="text"
          placeholder={`@${label.toLowerCase()}`}
          value={handleInput}
          onChange={(e) => setHandleInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm min-w-[100px]"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit}>
          Save
        </Button>
      </div>
    );
  }

  return (
    <Badge 
      variant={connected ? "default" : "secondary"} 
      className={`gap-1.5 px-3 py-2 text-sm cursor-pointer ${
        connected 
          ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border-primary/30 hover:border-primary/50' 
          : 'opacity-60 hover:opacity-100'
      } transition-all`}
      onClick={() => {
        if (connected) {
          onDisconnect(id);
        } else {
          setIsEditing(true);
        }
      }}
    >
      {connected ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
      ) : (
        <span className="text-muted-foreground">{icon}</span>
      )}
      <span>{label}</span>
      {handle && connected && (
        <span className="text-muted-foreground text-xs ml-1">@{handle}</span>
      )}
      {connected && (
        <XCircle className="h-3 w-3 ml-1 text-muted-foreground hover:text-destructive" />
      )}
    </Badge>
  );
}