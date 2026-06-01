import { useRef, useCallback, useState, useEffect, lazy, Suspense } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useProfile } from '@/hooks/useProfile';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useConfetti } from '@/hooks/useConfetti';
import { useHiddenActivityFields } from '@/hooks/useHiddenActivityFields';
import { getNewUserViewMode } from '@/lib/userViewMode';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardFooter } from './dashboard/DashboardFooter';
// Above-the-fold (eager): hero metrics + token price card stay in main chunk
import { ActivityMetrics, MintCategory, MintRequest } from './dashboard/ActivityMetrics';
import type { RewardActionsRef, MintCategory as RewardMintCategory } from './dashboard/RewardActions';
import { CompactSetupPrompt } from './dashboard/CompactSetupPrompt';
import { CompactWalletPrompt } from './dashboard/CompactWalletPrompt';
import { FirstRunHero } from './dashboard/FirstRunHero';
import { ReadyToMintCard } from './dashboard/ReadyToMintCard';
import { DashboardSkeleton } from './dashboard/DashboardSkeleton';
import { TokenPriceCard } from './dashboard/TokenPriceCard';
// CO2OffsetCard is recharts-heavy and below the fold — lazy-load to keep
// the dashboard LCP fast on mobile.
const CO2OffsetCard = lazy(() =>
  import('./dashboard/CO2OffsetCard').then((m) => ({ default: m.CO2OffsetCard }))
);
import { PremiumInsightsTeaserCard } from './dashboard/PremiumInsightsTeaserCard';
import { LiveEnergyMonitoringCard } from './dashboard/LiveEnergyMonitoringCard';
import { useEnergyInsightsSubscription } from '@/hooks/useEnergyInsightsSubscription';
import { FlywheelContributionCard } from './dashboard/FlywheelContributionCard';
import { MintReceiptsHint } from './dashboard/MintReceiptsHint';

import { DashboardHexBackground } from './dashboard/DashboardHexBackground';
import { PageTransition } from './layout/PageTransition';

// Below-the-fold / conditional (lazy): split into separate chunks to cut TTI on mobile
const RewardActions = lazy(() =>
  import('./dashboard/RewardActions').then((m) => ({ default: m.RewardActions }))
);
const RewardProgress = lazy(() =>
  import('./dashboard/RewardProgress').then((m) => ({ default: m.RewardProgress }))
);
const AnimatedEnergyFlow = lazy(() =>
  import('./dashboard/AnimatedEnergyFlow').then((m) => ({ default: m.AnimatedEnergyFlow }))
);
const WalletSetupModal = lazy(() =>
  import('./dashboard/WalletSetupModal').then((m) => ({ default: m.WalletSetupModal }))
);
const AdminBaselineReset = lazy(() =>
  import('./dashboard/AdminBaselineReset').then((m) => ({ default: m.AdminBaselineReset }))
);
const NFTResetPanel = lazy(() =>
  import('./admin/NFTResetPanel').then((m) => ({ default: m.NFTResetPanel }))
);
import type { NFTQuickMintDialogRef } from './nft/NFTQuickMintDialog';
const NFTQuickMintDialog = lazy(() =>
  import('./nft/NFTQuickMintDialog').then((m) => ({ default: m.NFTQuickMintDialog }))
);

import { PullToRefreshIndicator } from './ui/pull-to-refresh';
import { AnimatedContainer, AnimatedItem } from './ui/animated-section';
import { SectionDivider }  from './ui/SectionDivider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Images } from 'lucide-react';
// ApiPartnersCard intentionally not imported — it's demo-only.
import { Link, useNavigate } from 'react-router-dom';

import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  calculateEarnedMilestones,
  calculateComboAchievements,
} from '@/lib/nftMilestones';

import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { PerfProbe } from '@/components/dev/PerfProbe';
import { installNetworkPerfLogger } from '@/lib/perfProfiler';

// Unified card skeleton — matches the rounded-2xl, border-primary/15, bg-card/80
// rhythm used across Wallet, Mint History, Profile, Referrals, and Subscribe.
function CardSkeleton({ height = 'h-40' }: { height?: string }) {
  return (
    <div
      className={`relative w-full ${height} rounded-2xl border border-primary/15 bg-card/80 overflow-hidden animate-pulse before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.05] before:to-transparent before:animate-[shimmer-sweep_1.8s_ease-in-out_infinite]`}
      aria-hidden="true"
    />
  );
}

interface ZenSolarDashboardProps {
  isDemo?: boolean;
}

export function ZenSolarDashboard({ isDemo = false }: ZenSolarDashboardProps) {
  const {
    activityData,
    isLoading: dataLoading,
    refreshDashboard,
    connectedAccounts,
    lastUpdatedAt,
    providerRefresh,
    isAutoSyncing,
    setIsAutoSyncing,
  } = useDashboardData();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isAdmin, isAdminView, isViewer } = useAdminCheck();
  const { triggerConfetti } = useConfetti();
  
  const { 
    hiddenFields, 
    hideField, 
    showField, 
    showAllFields 
  } = useHiddenActivityFields();
  const rewardActionsRef = useRef<RewardActionsRef>(null);
  const nftQuickMintRef = useRef<NFTQuickMintDialogRef>(null);
  const navigate = useNavigate();
  
  // Shared token price state
  const [tokenPrice, setTokenPrice] = useState(0.10);
  
  // New User View mode - shows onboarding cards regardless of actual status
  const [isNewUserView, setIsNewUserView] = useState(getNewUserViewMode());
  
  useEffect(() => {
    const handleModeChange = (event: CustomEvent<boolean>) => {
      setIsNewUserView(event.detail);
    };
    window.addEventListener('newUserViewModeChange', handleModeChange as EventListener);
    return () => {
      window.removeEventListener('newUserViewModeChange', handleModeChange as EventListener);
    };
  }, []);

  // Dev-only: log slow network calls (>800ms) to the console while exploring the dashboard.
  useEffect(() => {
    installNetworkPerfLogger();
  }, []);
  
  // Pull-to-refresh disabled: data auto-syncs in the background, and the
  // gesture was causing a content height collapse that snapped users back
  // to the top mid-scroll — breaking the "zen-like" flow. Keep the API
  // shape so the indicator below still compiles as a no-op.
  const { pullDistance, isRefreshing, isReady, containerRef } = usePullToRefresh({
    onRefresh: refreshDashboard,
    enabled: false,
  });

  const handleMintTokens = () => {
    rewardActionsRef.current?.openTokenMintDialog();
  };

  const handleMintRequest = (request: MintRequest) => {
    // Map category to RewardActions expected format (charging covers both supercharger and home_charger)
    const mappedCategory: RewardMintCategory = 
      request.category === 'supercharger' || request.category === 'home_charger' ? 'charging' : request.category;
    rewardActionsRef.current?.openTokenMintDialogForRequest?.({ 
      category: mappedCategory, 
      deviceId: request.deviceId,
      deviceName: request.deviceName 
    });
  };

  // Celebration animation when tokens are minted from Pending Rewards
  const handleMintSuccess = useCallback(() => {
    triggerConfetti();
  }, [triggerConfetti]);

  // Use connectedAccounts from useDashboardData which syncs with profile
  const energyAccounts = connectedAccounts;
  const hasEnergyConnected = energyAccounts.some(acc => acc.connected);
  const hasWalletConnected = !!profile?.wallet_address;
  
  // In New User View mode, always show onboarding cards
  const showWalletPrompt = !isViewer && (isNewUserView || !hasWalletConnected);
  const showEnergyPrompt = !isViewer && (isNewUserView || !hasEnergyConnected);
  
  // Show wallet setup modal for users without wallet (not in demo/new user view mode)
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  useEffect(() => {
    // Show modal after a brief delay if user has no wallet and isn't in demo/new user view
    if (!isDemo && !isNewUserView && !isViewer && !hasWalletConnected && !profileLoading) {
      const timer = setTimeout(() => setShowWalletModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isDemo, isNewUserView, hasWalletConnected, profileLoading]);
  
  // Get connected provider names for display
  const connectedProviders = energyAccounts
    .filter(acc => acc.connected)
    .map(acc => acc.service);

  const firstName = profile?.display_name?.trim().split(/\s+/)[0];
  const dashboardTitle = firstName ? `Welcome, ${firstName}!` : 'Dashboard';

  // Calculate total NFTs available for minting (1 welcome + milestones + combos)
  const solarEarned = calculateEarnedMilestones(activityData.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(activityData.batteryStorageDischarged, BATTERY_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(activityData.evMilesDriven, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(
    activityData.teslaSuperchargerKwh + activityData.homeChargerKwh, 
    EV_CHARGING_MILESTONES
  );
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  const totalNftsAvailable = 1 + solarEarned.length + batteryEarned.length + evMilesEarned.length + evChargingEarned.length + comboEarned.length;

  // "Current Activity" is what is mintable: lifetime until first mint, then delta since last mint.
  // We centralize rounding here so Pending Rewards and Current Activity always match.
  const currentActivity = {
    solarKwh: Math.max(0, Math.floor(activityData.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(activityData.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(activityData.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(activityData.pendingChargingKwh || 0)),
    superchargerKwh: Math.max(0, Math.floor(activityData.pendingSuperchargerKwh || 0)),
    homeChargerKwh: Math.max(0, Math.floor(activityData.pendingHomeChargerKwh || 0)),
  };

  if (profileLoading) {
    return <DashboardSkeleton />;
  }

  // First-run state: brand-new beta user with neither wallet nor energy.
  // Show the cinematic FirstRunHero in place of the two stacked Compact prompts.
  const isFirstRun =
    !isViewer && !isNewUserView && !hasWalletConnected && !hasEnergyConnected;

  return (
    <PageTransition>
    <div 
      ref={containerRef}
      className="bg-background min-h-full w-full relative overflow-x-hidden"
    >
      <DashboardHexBackground />
      {isDemo && <DashboardHeader isDemo={isDemo} />}
      
      <div className="md:hidden">
        <PullToRefreshIndicator 
          pullDistance={pullDistance} 
          isRefreshing={isRefreshing}
          isReady={isReady}
        />
      </div>
      
      <PerfProbe id="ZenSolarDashboard">
      <AnimatedContainer className="relative z-10 w-full max-w-lg min-w-0 mx-auto px-3 sm:px-4 py-6 space-y-6 box-border md:my-6 md:rounded-3xl md:border md:border-border/40 md:bg-background/40 md:backdrop-blur-sm md:shadow-[0_0_60px_-20px_hsl(var(--primary)/0.25)] md:px-6 md:py-8 xl:max-w-6xl xl:grid xl:grid-cols-2 xl:gap-x-6 xl:gap-y-6 xl:space-y-0 xl:auto-rows-min xl:items-start">
        {/* xl:+ bento — hero cards span both columns; tighter cards pair up. Mobile/lg unchanged. */}
        {/* Dashboard Header with Logo - fixed height to prevent layout shifts */}
        {!isFirstRun && (
          <AnimatedItem className="flex flex-col items-center gap-3 pb-2 text-center xl:col-span-2">
             <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{dashboardTitle}</h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                Real energy. Real Tokens.
                <br />
                All on-chain with{' '}
                <Link 
                  to="/technology" 
                  className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2 transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                >
                  Proof-of-Genesis™
                </Link>
                .
              </p>
            </div>
            
          </AnimatedItem>
        )}

        {/* Token Price Card - Prominent at top */}
        <AnimatedItem className="xl:col-span-2">
          <TokenPriceCard 
            tokensHeld={isNewUserView ? 0 : activityData.lifetimeMinted} 
            defaultPrice={0.10}
            onPriceChange={setTokenPrice}
            nftCount={isNewUserView ? 0 : (activityData.nftsEarned?.length ?? 0)}
            walletLink="/wallet"
          />
        </AnimatedItem>

        {/* First-run: cinematic 2-step hero (wallet → energy). */}
        {isFirstRun ? (
          <AnimatedItem className="xl:col-span-2">
            <FirstRunHero
              firstName={firstName}
              hasWallet={hasWalletConnected}
              hasEnergy={hasEnergyConnected}
              onConnectWallet={() => { window.location.href = '/onboarding?step=wallet'; }}
              onConnectEnergy={() => { window.location.href = '/profile'; }}
            />
          </AnimatedItem>
        ) : (
          <>
            {showWalletPrompt && (
              <AnimatedItem className="xl:col-span-2">
                <CompactWalletPrompt />
              </AnimatedItem>
            )}
            {showEnergyPrompt && (
              <AnimatedItem className="xl:col-span-2">
                <CompactSetupPrompt onConnectEnergy={() => window.location.href = '/profile'} />
              </AnimatedItem>
            )}
          </>
        )}

        {/* Ready-to-mint celebration: wallet + energy done, but never minted */}
        {!isViewer && !isNewUserView && hasWalletConnected && hasEnergyConnected && activityData.lifetimeMinted === 0 && (
          <AnimatedItem className="xl:col-span-2">
            <ReadyToMintCard onMint={handleMintTokens} firstName={firstName} />
          </AnimatedItem>
        )}

        <SectionDivider className="xl:hidden" />

        {/* ENERGY COMMAND CENTER - The Hero Section */}
        <AnimatedItem className="xl:col-span-2">
          <PerfProbe id="ActivityMetrics">
            <ActivityMetrics
              data={activityData}
              currentActivity={currentActivity}
              refreshInfo={{ lastUpdatedAt }}
              connectedProviders={connectedProviders}
              onMintRequest={!isViewer && profile?.wallet_address ? handleMintRequest : undefined}
              onMintSuccess={handleMintSuccess}
              tokenPrice={tokenPrice}
              lifetimeMinted={activityData.lifetimeMinted}
              hiddenFields={hiddenFields}
              onHideField={hideField}
              onShowField={showField}
              onShowAllFields={showAllFields}
              isNewUserView={isNewUserView}
              teslaNeedsReauth={providerRefresh.tesla?.needsReauth}
              isLoading={dataLoading || isAutoSyncing}
            />
          </PerfProbe>
        </AnimatedItem>

        <SectionDivider className="xl:hidden" />

        {/* Mint receipts peek — sits directly under the Clean Energy Center so
            users see their receipts before scrolling to CO₂ context. */}
        <AnimatedItem className="xl:col-span-1">
          <MintReceiptsHint />
        </AnimatedItem>

        <SectionDivider className="xl:hidden" />

        {/* Prominent CO₂ Offset card — matches the new sidebar accent styling */}
        <AnimatedItem className="xl:col-span-1">
          <CO2OffsetCard
            activityData={isNewUserView ? undefined : activityData}
            co2Pounds={isNewUserView ? 0 : activityData.co2OffsetPounds}
            isLoading={dataLoading && !isNewUserView}
          />
        </AnimatedItem>

        {/* Subscription-Fee Flywheel — live cumulative LP/Treasury contribution
            from the active mock subscription. Renders nothing if no plan. */}
        <AnimatedItem className="xl:col-span-1">
          <FlywheelContributionCard />
        </AnimatedItem>

        {!isViewer && (
          <div className="hidden xl:col-span-1" aria-hidden="true">
            <Suspense fallback={null}>
              <PerfProbe id="RewardActions">
                <RewardActions 
                  ref={rewardActionsRef}
                  onRefresh={refreshDashboard} 
                  isLoading={dataLoading}
                  walletAddress={isNewUserView ? undefined : profile?.wallet_address}
                  pendingRewards={isNewUserView ? {
                    solar: 0,
                    evMiles: 0,
                    battery: 0,
                    charging: 0,
                  } : {
                    solar: currentActivity.solarKwh,
                    evMiles: currentActivity.evMiles,
                    battery: currentActivity.batteryKwh,
                    charging: currentActivity.chargingKwh,
                    superchargerKwh: currentActivity.superchargerKwh,
                    homeChargerKwh: currentActivity.homeChargerKwh,
                  }}
                />
              </PerfProbe>
            </Suspense>
          </div>
        )}

        <SectionDivider className="xl:hidden" />

        {/* ZenEnergy Monitoring (live flow) + inline Premium Insights upsell */}
        <AnimatedItem className="xl:col-span-3">
          <EnergyFlowGlowCard />
        </AnimatedItem>

        <SectionDivider className="xl:hidden" />

        {/* NFT Milestones - Beta (with integrated Mint CTA) */}
        <AnimatedItem id="reward-progress" className="xl:col-span-2">
          <Suspense fallback={<CardSkeleton height="h-56" />}>
            <RewardProgress
              tokensEarned={isNewUserView ? 0 : activityData.tokensEarned}
              solarKwh={isNewUserView ? 0 : activityData.solarEnergyProduced}
              evMilesDriven={isNewUserView ? 0 : activityData.evMilesDriven}
              evChargingKwh={isNewUserView ? 0 : activityData.teslaSuperchargerKwh + activityData.homeChargerKwh}
              batteryDischargedKwh={isNewUserView ? 0 : activityData.batteryStorageDischarged}
              nftsEarned={isNewUserView ? [] : activityData.nftsEarned}
              lifetimeMinted={isNewUserView ? 0 : activityData.lifetimeMinted}
              isNewUser={true}
            />
          </Suspense>
          {!isViewer && (
            <Button
              onClick={() => navigate('/nft-collection')}
              disabled={dataLoading}
              className="w-full mt-3 bg-primary hover:bg-primary/90 animate-pulse-glow zen-btn-glow shadow-lg shadow-primary/20"
              size="lg"
            >
              <Images className="mr-2 h-4 w-4" />
              MINT ZENSOLAR NFTs
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white hover:bg-white/30">
                {totalNftsAvailable}
              </Badge>
            </Button>
          )}
        </AnimatedItem>

        {/* API Partners card lives on the demo dashboard only. */}



        {/* NFT Quick Mint Dialog (lazy — only the dialog chunk is fetched the first time it opens) */}
        <Suspense fallback={null}>
          <NFTQuickMintDialog
            ref={nftQuickMintRef}
            walletAddress={profile?.wallet_address}
            activityData={activityData}
            onMintSuccess={refreshDashboard}
          />
        </Suspense>
        
        {/* Admin-only Baseline Reset Tool - Hidden in New User View */}
        {isAdminView && !isNewUserView && (
          <AnimatedItem className="xl:col-span-2">
            <Suspense fallback={<CardSkeleton height="h-32" />}>
              <AdminBaselineReset onResetComplete={refreshDashboard} />
            </Suspense>
          </AnimatedItem>
        )}

        {/* Admin-only NFT Reset Tool - Hidden in New User View */}
        {isAdminView && !isNewUserView && (
          <AnimatedItem className="xl:col-span-2">
            <Suspense fallback={<CardSkeleton height="h-32" />}>
              <NFTResetPanel />
            </Suspense>
          </AnimatedItem>
        )}
      </AnimatedContainer>
      </PerfProbe>
      
      {/* Wallet Setup Modal — only mount when actually needed (saves bytes for the common path) */}
      {showWalletModal && (
        <Suspense fallback={null}>
          <WalletSetupModal 
            isOpen={showWalletModal} 
            onClose={() => setShowWalletModal(false)} 
          />
        </Suspense>
      )}
      
      {/* Dashboard Footer */}
      <DashboardFooter />
    </div>
    </PageTransition>
  );
}

function EnergyFlowGlowCard() {
  const { subscription, loading: subLoading } = useEnergyInsightsSubscription();
  const subscribed = !!subscription?.active;

  return (
    <div
      className="rounded-xl overflow-hidden bg-card/5"
      style={{
        border: '1px solid hsla(142, 76%, 36%, 0.25)',
      }}
    >

      {subLoading ? (
        // While we don't yet know sub status, show the placeholder to avoid flicker.
        <Suspense fallback={<div className="w-full h-64 bg-card/10 animate-pulse" aria-hidden="true" />}>
          <AnimatedEnergyFlow className="w-full" />
        </Suspense>
      ) : subscribed ? (
        <LiveEnergyMonitoringCard />
      ) : (
        // Default placeholder/mock card everyone sees until they pay $4.99/mo.
        <Suspense fallback={<div className="w-full h-64 bg-card/10 animate-pulse" aria-hidden="true" />}>
          <AnimatedEnergyFlow className="w-full" />
        </Suspense>
      )}
      <PremiumInsightsTeaserCard />
    </div>
  );
}

