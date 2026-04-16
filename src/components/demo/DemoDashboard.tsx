import { useRef, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDemoContext } from '@/contexts/DemoContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { CompactSetupPrompt } from '@/components/dashboard/CompactSetupPrompt';
import { CompactWalletPrompt } from '@/components/dashboard/CompactWalletPrompt';
import { ActivityMetrics, MintRequest } from '@/components/dashboard/ActivityMetrics';
import { RewardActions, RewardActionsRef, MintCategory as RewardMintCategory, DemoMintHandler } from '@/components/dashboard/RewardActions';
import { RewardProgress } from '@/components/dashboard/RewardProgress';
import { TokenPriceCard } from '@/components/dashboard/TokenPriceCard';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Images, RefreshCw } from 'lucide-react';
import { DashboardTopControls } from '@/components/dashboard/DashboardTopControls';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AnimatedEnergyFlow } from '@/components/dashboard/AnimatedEnergyFlow';
import { ApiPartnersCard } from '@/components/dashboard/ApiPartnersCard';
import { MintEffectButton } from '@/components/dashboard/MintEffectButton';
import { DashboardHexBackground } from '@/components/dashboard/DashboardHexBackground';
import { DemoOnboardingHints } from '@/components/demo/DemoOnboardingHints';

import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  calculateEarnedMilestones,
  calculateComboAchievements,
} from '@/lib/nftMilestones';

export function DemoDashboard() {
  const { 
    activityData, 
    isLoading, 
    refreshDashboard, 
    connectedAccounts, 
    profile,
    lastUpdatedAt,
    simulateMintTokens,
    simulateMintWelcomeNFT,
    simulateMintMilestoneNFT,
    simulateBatchMintNFTs,
    getEligibility,
    mintedNFTs,
    mintHistory,
    hasWelcomeNFT,
  } = useDemoContext();
  
  const rewardActionsRef = useRef<RewardActionsRef>(null);
  const hasHydratedMintedValueRef = useRef(false);
  const previousLifetimeMintedRef = useRef(0);
  
  const [tokenPrice, setTokenPrice] = useState(0.10);
  
  const { pullDistance, isRefreshing, isReady, containerRef } = usePullToRefresh({
    onRefresh: refreshDashboard,
  });

  useEffect(() => {
    if (isLoading) return;

    if (!hasHydratedMintedValueRef.current) {
      previousLifetimeMintedRef.current = activityData.lifetimeMinted;
      hasHydratedMintedValueRef.current = true;
      return;
    }

    if (activityData.lifetimeMinted > previousLifetimeMintedRef.current) {
      window.dispatchEvent(new CustomEvent('demo-mint-success'));
    }

    previousLifetimeMintedRef.current = activityData.lifetimeMinted;
  }, [activityData.lifetimeMinted, isLoading]);

  const handleMintRequest = (request: MintRequest) => {
    const mappedCategory: RewardMintCategory = 
      request.category === 'supercharger' || request.category === 'home_charger' ? 'charging' : request.category;
    rewardActionsRef.current?.openTokenMintDialogForRequest?.({ 
      category: mappedCategory, 
      deviceId: request.deviceId,
      deviceName: request.deviceName 
    });
  };

  const demoMintHandler: DemoMintHandler = useMemo(() => ({
    simulateMintTokens,
    getEligibility,
    simulateMintWelcomeNFT,
    simulateMintMilestoneNFT,
    simulateBatchMintNFTs,
  }), [simulateMintTokens, getEligibility, simulateMintWelcomeNFT, simulateMintMilestoneNFT, simulateBatchMintNFTs]);

  const energyAccounts = connectedAccounts;
  const hasEnergyConnected = energyAccounts.some(acc => acc.connected);
  const hasWalletConnected = !!profile.wallet_address;

  const connectedProviders = energyAccounts
    .filter(acc => acc.connected)
    .map(acc => acc.service);

  const firstName = profile.display_name?.trim().split(/\s+/)[0];
  const dashboardTitle = firstName ? `Welcome, ${firstName}!` : 'Dashboard';

  const currentActivity = {
    solarKwh: Math.max(0, Math.floor(activityData.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(activityData.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(activityData.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(activityData.pendingChargingKwh || 0)),
    superchargerKwh: Math.max(0, Math.floor(activityData.pendingSuperchargerKwh || 0)),
    homeChargerKwh: Math.max(0, Math.floor(activityData.pendingHomeChargerKwh || 0)),
  };

  // Calculate total NFTs available (same logic as real dashboard)
  const solarEarned = calculateEarnedMilestones(activityData.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(activityData.batteryStorageDischarged, BATTERY_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(activityData.evMilesDriven, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(
    activityData.teslaSuperchargerKwh + activityData.homeChargerKwh, 
    EV_CHARGING_MILESTONES
  );
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  const totalNftsAvailable = 1 + solarEarned.length + batteryEarned.length + evMilesEarned.length + evChargingEarned.length + comboEarned.length;
  const mintedCount = mintedNFTs.length + (hasWelcomeNFT ? 1 : 0);
  const eligibleCount = totalNftsAvailable - mintedCount;
  const nftLabel = mintedCount > 0
    ? `minted · ${eligibleCount} eligible`
    : 'eligible to mint';

  return (
    <div 
      ref={containerRef}
      className="bg-background min-h-full w-full relative overflow-x-hidden"
    >
      <DashboardHexBackground />
      <DemoOnboardingHints />
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing}
        isReady={isReady}
      />
      
      <AnimatedContainer className="relative z-10 w-full max-w-lg min-w-0 mx-auto px-3 sm:px-4 py-6 space-y-6 box-border">
        {/* Dashboard Header - matches real dashboard exactly */}
        <AnimatedItem className="flex flex-col items-center gap-3 pb-2 text-center relative">
          {/* Top controls — absolute positioned top-right */}
          <div className="absolute top-0 right-0">
            <DashboardTopControls />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{dashboardTitle}</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              Real energy. Real Tokens. All on-chain
              <br />
              with{' '}
              <Link 
                to="/demo/technology" 
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2 transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
              >
                Mint-on-Proof™
              </Link>
              .
            </p>
          </div>
        </AnimatedItem>

        {/* Token Price & Wallet Card */}
        <AnimatedItem id="demo-wallet-card">
          <div className="emerald-glow-card overflow-hidden">
            <TokenPriceCard 
              tokensHeld={activityData.lifetimeMinted}
              defaultPrice={0.10}
              onPriceChange={setTokenPrice}
              nftCount={mintedCount > 0 ? mintedCount : totalNftsAvailable}
              nftLabel={nftLabel}
              walletLink="/demo/wallet"
              mintHistory={mintHistory}
            />
          </div>
        </AnimatedItem>

        {/* Onboarding Cards */}
        {!hasWalletConnected && (
          <AnimatedItem>
            <CompactWalletPrompt />
          </AnimatedItem>
        )}
        
        {!hasEnergyConnected && (
          <AnimatedItem>
            <CompactSetupPrompt onConnectEnergy={() => {
              toast.info('Demo Mode: Navigate to Profile to connect energy accounts');
            }} />
          </AnimatedItem>
        )}

        {/* ENERGY COMMAND CENTER - matches real dashboard */}
        <AnimatedItem>
          <div className="emerald-glow-card overflow-hidden">
            <ActivityMetrics
              data={activityData}
              currentActivity={currentActivity}
              refreshInfo={{ lastUpdatedAt }}
              connectedProviders={connectedProviders}
              onMintRequest={profile.wallet_address ? handleMintRequest : undefined}
              tokenPrice={tokenPrice}
              lifetimeMinted={activityData.lifetimeMinted}
            />
          </div>
        </AnimatedItem>

        {/* Reward Actions - same component as real dashboard */}
        <AnimatedItem>
          <RewardActions 
            ref={rewardActionsRef}
            onRefresh={refreshDashboard} 
            isLoading={isLoading}
            walletAddress={profile.wallet_address}
            pendingRewards={{
              solar: currentActivity.solarKwh,
              evMiles: currentActivity.evMiles,
              battery: currentActivity.batteryKwh,
              charging: currentActivity.chargingKwh,
              superchargerKwh: currentActivity.superchargerKwh,
              homeChargerKwh: currentActivity.homeChargerKwh,
            }}
            demoMintHandler={demoMintHandler}
          />
        </AnimatedItem>

        {/* API Partners Card — between actions and energy flow */}
        <AnimatedItem>
          <div className="emerald-glow-card overflow-hidden">
            <ApiPartnersCard />
          </div>
        </AnimatedItem>

        {/* Live Energy Flow Diagram */}
        <AnimatedItem>
          <EnergyFlowGlowCard />
        </AnimatedItem>

        {/* Today's Clean Energy Stats */}
        <AnimatedItem>
          <TodaysCleanEnergyStats />
        </AnimatedItem>

        {/* Aesthetic Section Divider */}
        <AnimatedItem className="py-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
            <div className="relative flex items-center gap-2 px-4 bg-background/80 backdrop-blur-sm rounded-full">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
            </div>
          </div>
        </AnimatedItem>
        
        {/* NFT Milestones */}
        <AnimatedItem id="reward-progress">
          <div className="emerald-glow-card overflow-hidden">
            <RewardProgress
              tokensEarned={activityData.tokensEarned}
              solarKwh={activityData.solarEnergyProduced}
              evMilesDriven={activityData.evMilesDriven}
              evChargingKwh={activityData.teslaSuperchargerKwh + activityData.homeChargerKwh}
              batteryDischargedKwh={activityData.batteryStorageDischarged}
              nftsEarned={activityData.nftsEarned}
              lifetimeMinted={activityData.lifetimeMinted}
              isNewUser={true}
              initialCategory="ev_miles"
              featuredNftId="ev_8"
            />
          </div>
        </AnimatedItem>

        {/* NFT Mint Button + Refresh - matches real dashboard */}
        <AnimatedItem className="space-y-3">
          <div id="demo-mint-button" data-hint-target="mint">
            <MintEffectButton
              onClick={() => rewardActionsRef.current?.openTokenMintDialog()}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 animate-pulse-glow h-11 rounded-md px-8 text-primary-foreground font-medium"
            >
              <Images className="mr-2 h-4 w-4" />
              MINT ZENSOLAR NFTs
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white hover:bg-white/30">
                {totalNftsAvailable}
              </Badge>
            </MintEffectButton>
          </div>
          
          <Button
            onClick={refreshDashboard}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                REFRESHING...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                REFRESH DASHBOARD
              </>
            )}
          </Button>
        </AnimatedItem>

        {/* Got Questions CTA */}
        <AnimatedItem>
          <GotQuestionsCTA />
        </AnimatedItem>
      </AnimatedContainer>
      
      {/* Dashboard Footer */}
      <DashboardFooter />
    </div>
  );
}

function EnergyFlowGlowCard() {
  const [burstDone, setBurstDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBurstDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden bg-card/5"
      style={{
        border: '2px solid hsla(170, 80%, 40%, 0.45)',
        boxShadow: '0 0 12px 3px hsla(170, 80%, 40%, 0.25), 0 0 28px 6px hsla(170, 80%, 40%, 0.12), inset 0 0 10px 2px hsla(170, 80%, 40%, 0.06)',
      }}
    >
      <AnimatedEnergyFlow className="w-full" />
    </div>
  );
}

// Animated count-up hook
function useCountUp(target: number, duration = 1200, decimals = 1, enabled = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) { setValue(0); return; }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals, enabled]);
  return value;
}

function TodaysCleanEnergyStats() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const solar = useCountUp(24.7, 1400, 1, isVisible);
  const evCharge = useCountUp(18.3, 1200, 1, isVisible);
  const evMiles = useCountUp(62, 1000, 0, isVisible);
  const battery = useCountUp(8.1, 1100, 1, isVisible);

  const kpis = [
    { color: '#F59E0B', label: 'Solar Produced', value: solar, unit: 'kWh', decimals: 1 },
    { color: '#22C55E', label: 'Battery Exported', value: battery, unit: 'kWh', decimals: 1 },
    { color: '#3B82F6', label: 'EV Charging', value: evCharge, unit: 'kWh', decimals: 1 },
    { color: '#06B6D4', label: 'EV Mileage', value: evMiles, unit: 'mi', decimals: 0 },
  ];

  return (
    <div ref={ref} className="emerald-glow-card rounded-2xl p-4 pt-3 relative overflow-hidden">
      {/* Tinted background for less transparency */}
      <div className="absolute inset-0" style={{ background: 'hsl(220 20% 10% / 0.45)' }} />
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #3B82F6 25%, #22C55E 50%, #8B5CF6 75%, #F59E0B 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient-shift 8s ease infinite',
      }} />
      {/* Orbiting particle ring */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{
          background: 'conic-gradient(from 0deg, transparent 0%, hsla(142, 76%, 36%, 0.08) 10%, transparent 20%, hsla(45, 93%, 47%, 0.06) 30%, transparent 40%, hsla(217, 91%, 60%, 0.06) 50%, transparent 60%, hsla(142, 76%, 36%, 0.08) 70%, transparent 80%, hsla(188, 94%, 43%, 0.06) 90%, transparent 100%)',
          animation: 'spin 12s linear infinite',
        }} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground tracking-wide">Today's Clean Energy Stats —</h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {kpis.map((k, i) => (
            <motion.div 
              key={k.label} 
              animate={{ y: [0, 2, 0], scale: [1, 0.97, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: i * 0.5 + 0.8, ease: 'easeInOut' as const }}
              whileTap={{ scale: 0.95, y: 3, boxShadow: `0 1px 0 0 ${k.color}30`, transition: { duration: 0.08 } }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-xl p-3 border cursor-pointer select-none touch-manipulation"
              style={{
                background: `linear-gradient(135deg, ${k.color}48, ${k.color}28)`,
                borderColor: `${k.color}60`,
                boxShadow: `0 4px 0 0 ${k.color}50`,
                animation: isVisible ? `fade-in 0.5s ease-out ${i * 0.1}s both` : 'none',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: k.color }} />
                <p className="text-[10px] uppercase tracking-wider font-mono" style={{ color: k.color, opacity: 0.8 }}>{k.label}</p>
              </div>
              <p className="text-xl font-bold tabular-nums" style={{ color: k.color }}>
                {k.decimals > 0 ? k.value.toFixed(k.decimals) : k.value} <span className="text-xs font-normal text-muted-foreground">{k.unit}</span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GotQuestionsCTA() {
  return (
    <div className="emerald-glow-card rounded-2xl p-5 text-center space-y-3 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary)), transparent 70%)',
      }} />
      <div className="relative z-10">
        <p className="text-lg font-bold text-foreground">Got Questions? 🤔</p>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          This is truly cutting-edge tech — we'd love to hear what you're thinking. Tap the 
          <span className="text-primary font-medium"> 💬 button</span> below or reach out directly.
        </p>
        <a
          href="mailto:joe@zen.solar?subject=Question%20about%20ZenSolar"
          className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
        >
          ✉️ joe@zen.solar
        </a>
      </div>
    </div>
  );
}
