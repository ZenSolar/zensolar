import { useRef } from 'react';
import { useDemoData } from '@/hooks/useDemoData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ConnectAccounts } from '@/components/dashboard/ConnectAccounts';
import { ConnectSocialAccounts } from '@/components/dashboard/ConnectSocialAccounts';
import { ConnectWallet } from '@/components/dashboard/ConnectWallet';
import { ActivityMetrics, MintCategory } from '@/components/dashboard/ActivityMetrics';
import { RewardProgress } from '@/components/dashboard/RewardProgress';
import { GettingStartedGuide } from '@/components/dashboard/GettingStartedGuide';
import { HowItWorks } from '@/components/dashboard/HowItWorks';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { DemoOnboardingGuide } from '@/components/demo/DemoOnboardingGuide';
import { DemoRewardActions, DemoRewardActionsRef, MintCategory as DemoMintCategory } from '@/components/demo/DemoRewardActions';
import zenLogo from '@/assets/zen-logo.png';
import { toast } from 'sonner';

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

export function DemoDashboard() {
  const { 
    activityData, 
    isLoading, 
    refreshDashboard, 
    connectAccount, 
    disconnectAccount, 
    connectedAccounts, 
    profile,
    connectWallet,
    disconnectWallet,
    lastUpdatedAt,
    providerRefresh,
    hasWelcomeNFT,
    mintedNFTs,
    getEligibility,
    simulateMintWelcomeNFT,
    simulateMintTokens,
  } = useDemoData();
  
  const demoRewardActionsRef = useRef<DemoRewardActionsRef>(null);
  
  const { pullDistance, isRefreshing, isReady, containerRef } = usePullToRefresh({
    onRefresh: refreshDashboard,
  });

  const handleMintCategory = (category: MintCategory) => {
    const mappedCategory: DemoMintCategory = 
      category === 'supercharger' || category === 'home_charger' ? 'charging' : category;
    demoRewardActionsRef.current?.openMintDialogForCategory?.(mappedCategory);
  };

  const handleConnectWallet = async (address: string) => {
    connectWallet(address);
    toast.success("Demo: Wallet connected!");
  };

  const handleDisconnectWallet = async () => {
    disconnectWallet();
    toast.info("Demo: Wallet disconnected");
  };

  const energyAccounts = connectedAccounts;

  const socialAccounts = [
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: <FacebookIcon />, 
      connected: profile.facebook_connected,
      handle: profile.facebook_handle ?? undefined,
      placeholder: 'yourname'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: <InstagramIcon />, 
      connected: profile.instagram_connected,
      handle: profile.instagram_handle ?? undefined,
      placeholder: 'yourhandle'
    },
    { 
      id: 'tiktok', 
      name: 'TikTok', 
      icon: <TikTokIcon />, 
      connected: profile.tiktok_connected,
      handle: profile.tiktok_handle ?? undefined,
      placeholder: 'yourhandle'
    },
    { 
      id: 'twitter', 
      name: 'X (Twitter)', 
      icon: <TwitterIcon />, 
      connected: profile.twitter_connected,
      handle: profile.twitter_handle ?? undefined,
      placeholder: 'yourhandle'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: <LinkedInIcon />, 
      connected: profile.linkedin_connected,
      handle: profile.linkedin_handle ?? undefined,
      placeholder: 'yourprofile'
    },
  ];

  const handleConnectEnergy = (service: 'tesla' | 'enphase' | 'solaredge' | 'wallbox') => {
    connectAccount(service);
    toast.success(`Demo: ${service.charAt(0).toUpperCase() + service.slice(1)} connected!`);
  };

  const handleDisconnectEnergy = (service: 'tesla' | 'enphase' | 'solaredge' | 'wallbox') => {
    disconnectAccount(service);
    toast.info(`Demo: ${service.charAt(0).toUpperCase() + service.slice(1)} disconnected`);
  };

  const handleConnectSocial = async (id: string, _handle: string) => {
    toast.info(`Demo Mode: ${id} connection simulated`);
  };

  const handleDisconnectSocial = async (id: string) => {
    toast.info(`Demo Mode: ${id} disconnection simulated`);
  };

  const firstName = profile.display_name?.trim().split(/\s+/)[0];
  const dashboardTitle = firstName ? `Welcome, ${firstName}` : 'Dashboard';

  // Current activity for pending rewards
  const currentActivity = {
    solarKwh: Math.max(0, Math.floor(activityData.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(activityData.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(activityData.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(activityData.pendingChargingKwh || 0)),
  };

  // Get eligibility for NFT minting
  const eligibility = getEligibility();

  return (
    <div 
      ref={containerRef}
      className="bg-background min-h-full overflow-x-hidden overflow-y-auto w-full"
    >
      <DashboardHeader isDemo={true} />
      
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing}
        isReady={isReady}
      />

      {/* Demo Onboarding Guide */}
      <DemoOnboardingGuide />
      
      <AnimatedContainer className="w-full max-w-lg min-w-0 mx-auto px-3 sm:px-4 py-6 space-y-6 box-border">
        {/* Dashboard Header with Logo */}
        <AnimatedItem className="flex flex-col items-center gap-3 pb-2 text-center min-h-[120px]">
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            width={168}
            height={80}
            className="h-20 w-auto object-contain dark:brightness-110 dark:contrast-110" 
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{dashboardTitle}</h1>
            <p className="text-sm text-muted-foreground">Earn $ZSOLAR tokens and ZenSolar NFT's from your clean energy use</p>
          </div>
        </AnimatedItem>

        {/* Getting Started Guide */}
        <AnimatedItem>
          <GettingStartedGuide
            energyConnected={energyAccounts.some(acc => acc.connected)}
            walletConnected={!!profile.wallet_address}
            onConnectEnergy={() => {
              document.getElementById('connect-accounts')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onConnectWallet={() => {
              document.getElementById('connect-wallet')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </AnimatedItem>

        {/* How It Works - only show if no energy accounts connected */}
        {!energyAccounts.some(acc => acc.connected) && (
          <AnimatedItem>
            <HowItWorks />
          </AnimatedItem>
        )}

        <AnimatedItem id="connect-wallet">
          <ConnectWallet
            walletAddress={profile.wallet_address}
            onConnect={handleConnectWallet}
            onDisconnect={handleDisconnectWallet}
            isDemo={true}
          />
        </AnimatedItem>

        <AnimatedItem id="connect-accounts">
          <ConnectAccounts 
            accounts={energyAccounts} 
            onConnect={handleConnectEnergy}
            onDisconnect={handleDisconnectEnergy}
          />
        </AnimatedItem>
        
        <AnimatedItem>
          <ConnectSocialAccounts
            accounts={socialAccounts}
            onConnect={handleConnectSocial}
            onDisconnect={handleDisconnectSocial}
          />
        </AnimatedItem>
        
        <AnimatedItem>
          <ActivityMetrics
            data={activityData}
            currentActivity={currentActivity}
            refreshInfo={{ lastUpdatedAt, providers: providerRefresh }}
            onMintCategory={profile.wallet_address ? handleMintCategory : undefined}
          />
        </AnimatedItem>

        {/* Demo Reward Actions with fake minting */}
        <AnimatedItem>
          <DemoRewardActions 
            ref={demoRewardActionsRef}
            onRefresh={refreshDashboard} 
            isLoading={isLoading}
            walletAddress={profile.wallet_address}
            pendingRewards={{
              solar: currentActivity.solarKwh,
              evMiles: currentActivity.evMiles,
              battery: currentActivity.batteryKwh,
              charging: currentActivity.chargingKwh,
            }}
            hasWelcomeNFT={hasWelcomeNFT}
            eligibleMilestones={eligibility.eligibleMilestoneNFTs.length}
            eligibleCombos={eligibility.eligibleComboNFTs.length}
            ownedNFTCount={mintedNFTs.length}
            onMintWelcomeNFT={simulateMintWelcomeNFT}
            onMintTokens={simulateMintTokens}
          />
        </AnimatedItem>
        
        {/* NFT Milestones */}
        <AnimatedItem id="reward-progress">
          <RewardProgress
            tokensEarned={activityData.tokensEarned}
            solarKwh={activityData.solarEnergyProduced}
            evMilesDriven={activityData.evMilesDriven}
            evChargingKwh={activityData.teslaSuperchargerKwh + activityData.homeChargerKwh}
            batteryDischargedKwh={activityData.batteryStorageDischarged}
            nftsEarned={activityData.nftsEarned}
            isNewUser={false}
          />
        </AnimatedItem>
      </AnimatedContainer>
    </div>
  );
}
