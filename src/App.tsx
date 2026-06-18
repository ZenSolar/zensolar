import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppThemeProvider } from "@/contexts/AppThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyWeb3Provider } from "@/components/providers/LazyWeb3Provider";

// Single shared QueryClient — must wrap everything that may use react-query,
// including components that render before LazyWeb3Provider mounts wagmi.
// Pass G · #2 — tuned defaults so cross-page nav (Dashboard ↔ Energy Log ↔
// Mint History) feels instant. Data stays fresh for 60s, cached for 5min,
// no refetch on window focus to avoid surprise spinners.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
// DemoAccessGate is a 2,000+ line component used only on /demo/*; lazy it
// out of the entry bundle.
const DemoAccessGate = lazy(() =>
  import("@/components/demo/DemoAccessGate").then((m) => ({ default: m.DemoAccessGate })),
);
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BotProtection } from "@/components/BotProtection";
import { BrandedSpinner } from "@/components/ui/BrandedSpinner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewAsUserProvider } from "@/contexts/ViewAsUserContext";
import { useServiceWorkerMessages } from "@/hooks/useServiceWorkerMessages";
import { RootRoute } from "./components/RootRoute";
import { PathNormalizer } from "./components/PathNormalizer";
import { AppHistoryTracker } from "./components/AppHistoryTracker";
import { ScrollManager } from "./components/ScrollManager";
import { SwipeBackHandler } from "./components/SwipeBackHandler";
import { DeferredMount } from "./components/util/DeferredMount";
// Non-critical chrome — lazy + deferred-mount past first paint
const PageCleanupFlagger = lazy(() =>
  import("./components/admin/PageCleanupFlagger").then((m) => ({ default: m.PageCleanupFlagger })),
);
const InstallNudge = lazy(() =>
  import("./components/install/InstallNudge").then((m) => ({ default: m.InstallNudge })),
);
// Home only renders on `/` for unauthed visitors — keep it out of entry bundle
const Home = lazy(() => import("./pages/Home"));

// Lazy load layout and auth components to reduce main bundle size
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));
const FounderRoute = lazy(() => import("@/components/FounderRoute").then(m => ({ default: m.FounderRoute })));
const ReviewerOrFounderRoute = lazy(() => import("@/components/ReviewerOrFounderRoute").then(m => ({ default: m.ReviewerOrFounderRoute })));
const DemoReviewerHub = lazy(() => import("./pages/DemoReviewerHub"));
const AppLayout = lazy(() => import("@/components/layout/AppLayout").then(m => ({ default: m.AppLayout })));
const Auth = lazy(() => import("./pages/Auth"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

// Lazy load all other pages for code splitting
const Install = lazy(() => import("./pages/Install"));
const Demo = lazy(() => import("./pages/Demo"));
const DemoLayout = lazy(() => import("./components/demo/DemoLayout").then(m => ({ default: m.DemoLayout })));
const ZenSolarDashboard = lazy(() => import("./components/ZenSolarDashboard").then(m => ({ default: m.ZenSolarDashboard })));

const DemoDashboard = lazy(() => import("./components/demo/DemoDashboardSwitcher").then(m => ({ default: m.DemoDashboardSwitcher })));
const DemoNftCollection = lazy(() => import("./components/demo/DemoNftCollection").then(m => ({ default: m.DemoNftCollection })));
const DemoEnergyLog = lazy(() => import("./components/demo/DemoEnergyLog").then(m => ({ default: m.DemoEnergyLog })));
const DemoWallet = lazy(() => import("./components/demo/DemoWallet").then(m => ({ default: m.DemoWallet })));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminContracts = lazy(() => import("./pages/AdminContracts"));
const AdminEvApiReference = lazy(() => import("./pages/AdminEvApiReference"));
const AdminRevenueFlywheel = lazy(() => import("./pages/AdminRevenueFlywheel"));
const AdminSubscriptionPanel = lazy(() => import("./pages/AdminSubscriptionPanel"));
const FlywheelSimulation = lazy(() => import("./pages/archive/FlywheelSimulation"));
const FoundersSimulator = lazy(() => import("./pages/archive/FoundersSimulator"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminMintRequests = lazy(() => import("./pages/AdminMintRequests"));
const AdminPageCleanup = lazy(() => import("./pages/AdminPageCleanup"));
const AdminProtocolIntegrity = lazy(() => import("./pages/AdminProtocolIntegrity"));
const AdminKpiReconciliation = lazy(() => import("./pages/AdminKpiReconciliation"));
const Tokenomics = lazy(() => import("./pages/Tokenomics"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Security = lazy(() => import("./pages/Security"));
const Help = lazy(() => import("./pages/Help"));
const MintHistory = lazy(() => import("./pages/MintHistory"));
const Feedback = lazy(() => import("./pages/Feedback"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrototypeEnergyFlow = lazy(() => import("./pages/PrototypeEnergyFlow"));
const Ecosystem = lazy(() => import("./pages/Ecosystem"));
const StarlinkMint = lazy(() => import("./pages/StarlinkMint"));
const FoundersVault = lazy(() => import("./pages/FoundersVault"));
const FoundersRevenueModels = lazy(() => import("./pages/archive/FoundersRevenueModels"));
const FounderPack = lazy(() => import("./pages/archive/FounderPack"));
const WhitepaperPhase1 = lazy(() => import("./pages/archive/WhitepaperPhase1"));
const WhitepaperPhase2 = lazy(() => import("./pages/archive/WhitepaperPhase2"));
const FoundersSpaceX = lazy(() => import("./pages/archive/FoundersSpaceX"));
const FoundersAppOverhaul = lazy(() => import("./pages/archive/FoundersAppOverhaul"));
const FoundersDeasonV3 = lazy(() => import("./pages/archive/FoundersDeasonV3"));
const FoundersDeasonUtilityAI = lazy(() => import("./pages/archive/FoundersDeasonUtilityAI"));
const FoundersProofOfGenesis = lazy(() => import("./pages/archive/FoundersProofOfGenesis"));


const FoundersCompetitiveLandscape = lazy(() => import("./pages/FoundersCompetitiveLandscape"));
const FoundersTheAsk = lazy(() => import("./pages/archive/FoundersTheAsk"));
const FoundersSeedAllocation = lazy(() => import("./pages/archive/FoundersSeedAllocation"));
const FoundersCurrentStatus = lazy(() => import("./pages/archive/FoundersCurrentStatus"));
const FoundersChangelog = lazy(() => import("./pages/archive/FoundersChangelog"));
const FoundersCatchup = lazy(() => import("./pages/archive/FoundersCatchup"));
const FoundersCreative1to1Tokenomics = lazy(() => import("./pages/archive/FoundersCreative1to1Tokenomics"));
const FoundersLyndonOnePager = lazy(() => import("./pages/archive/FoundersLyndonOnePager"));
const FoundersLyndonPitchV2 = lazy(() => import("./pages/archive/FoundersLyndonPitchV2"));
const FoundersSeedPitch = lazy(() => import("./pages/archive/FoundersSeedPitch"));
const FoundersSeedPitchCompanionDeck = lazy(() => import("./pages/archive/FoundersSeedPitchCompanionDeck"));
const FoundersSecondaryRevenue = lazy(() => import("./pages/archive/FoundersSecondaryRevenue"));
const FoundersVPPRoadmap = lazy(() => import("./pages/archive/FoundersVPPRoadmap"));
const FoundersEnergyOracle = lazy(() => import("./pages/archive/FoundersEnergyOracle"));
const FoundersPatentExpansion = lazy(() => import("./pages/archive/FoundersPatentExpansion"));
const FoundersMasterOutline = lazy(() => import("./pages/archive/FoundersMasterOutline"));
const FoundersSsotZen = lazy(() => import("./pages/archive/FoundersSsotZen"));
const FoundersSsotOnePager = lazy(() => import("./pages/archive/FoundersSsotOnePager"));
const FoundersBitcoinThesis = lazy(() => import("./pages/archive/FoundersBitcoinThesis"));
const FoundersFundedLP = lazy(() => import("./pages/archive/FoundersFundedLP"));
const FoundersTschida = lazy(() => import("./pages/archive/FoundersTschida"));
const Transparency = lazy(() => import("./pages/Transparency"));
const Pulse = lazy(() => import("./pages/Pulse"));
const Deason = lazy(() => import("./pages/Deason"));
const DeasonFloatingBubble = lazy(() =>
  import("./components/deason/DeasonFloatingBubble").then((m) => ({ default: m.DeasonFloatingBubble })),
);
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Store = lazy(() => import("./pages/Store"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Technology = lazy(() => import("./pages/Technology"));
const ProofOfGenesis = lazy(() => import("./pages/ProofOfGenesis"));
const ProofOfGenesisMainnetReadiness = lazy(() => import("./pages/ProofOfGenesisMainnetReadiness"));
const ProofOfGenesisReceiptPreview = lazy(() => import("./pages/ProofOfGenesisReceiptPreview"));
const NftCollection = lazy(() => import("./pages/NftCollection"));
const Wallet = lazy(() => import("./pages/Wallet"));
// (NFTs combined page removed — /nfts now redirects to /nft-collection)

const Learn = lazy(() => import("./pages/Learn"));
const LearnHowItWorks = lazy(() => import("./pages/learn/LearnHowItWorks"));
const LearnTokenomics = lazy(() => import("./pages/learn/LearnTokenomics"));
const LearnProofOfGenesis = lazy(() => import("./pages/learn/LearnProofOfGenesis"));
const LearnPatentTech = lazy(() => import("./pages/learn/LearnPatentTech"));
const LearnTour = lazy(() => import("./pages/learn/LearnTour"));
const LearnGlossary = lazy(() => import("./pages/learn/LearnGlossary"));
const Glossary = lazy(() => import("./pages/Glossary"));
const LearnThemes = lazy(() => import("./pages/archive/LearnThemes"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const InvestmentThesis = lazy(() => import("./pages/archive/InvestmentThesis"));
const GridPayCompetition = lazy(() => import("./pages/archive/GridPayCompetition"));
const AdminPatentMapping = lazy(() => import("./pages/AdminPatentMapping"));
const AdminFundraising = lazy(() => import("./pages/AdminFundraising"));
const AdminTokenEstimator = lazy(() => import("./pages/archive/AdminTokenEstimator"));
const AdminTokenomics10B = lazy(() => import("./pages/archive/AdminTokenomics10B"));
const AdminInvestorOnePager = lazy(() => import("./pages/archive/AdminInvestorOnePager"));
const AdminCostSavings = lazy(() => import("./pages/archive/AdminCostSavings"));
const AdminTokenomicsFramework = lazy(() => import("./pages/archive/AdminTokenomicsFramework"));
const AdminAIFeedbackLoop = lazy(() => import("./pages/archive/AdminAIFeedbackLoop"));
const AdminAIAgentOpportunities = lazy(() => import("./pages/archive/AdminAIAgentOpportunities"));
const AdminFlywheelTracker = lazy(() => import("./pages/archive/AdminFlywheelTracker"));
const AdminFinalTokenomics = lazy(() => import("./pages/AdminFinalTokenomics"));
const AdminGlossary = lazy(() => import("./pages/archive/AdminGlossary"));
const AdminGrowthProjections = lazy(() => import("./pages/archive/AdminGrowthProjections"));
const AdminLiveBetaEconomics = lazy(() => import("./pages/archive/AdminLiveBetaEconomics"));
const AdminCompetitiveIntel = lazy(() => import("./pages/AdminCompetitiveIntel"));
const AdminSecurityArchitecture = lazy(() => import("./pages/AdminSecurityArchitecture"));
const AdminBootstrapCalculator = lazy(() => import("./pages/archive/AdminBootstrapCalculator"));
const AdminBootstrapSimulator = lazy(() => import("./pages/archive/AdminBootstrapSimulator"));
const AdminLPCapacityCalculator = lazy(() => import("./pages/archive/AdminLPCapacityCalculator"));
const AdminBetaDeployment = lazy(() => import("./pages/AdminBetaDeployment"));
const AdminTodo = lazy(() => import("./pages/AdminTodo"));
const AdminStarlinkPlan = lazy(() => import("./pages/AdminStarlinkPlan"));
const AdminWalletProviders = lazy(() => import("./pages/AdminWalletProviders"));
const AdminYCApplication = lazy(() => import("./pages/archive/AdminYCApplication"));
const A16ZSpeedrunApplication = lazy(() => import("./pages/archive/A16ZSpeedrunApplication"));
const AdminFutureRoadmap = lazy(() => import("./pages/archive/AdminFutureRoadmap"));
const AdminMarketDefenseMechanisms = lazy(() => import("./pages/archive/AdminMarketDefenseMechanisms"));
const AdminPatentMintOnProof = lazy(() => import("./pages/AdminPatentMintOnProof"));
const AdminPatentProofOfDelta = lazy(() => import("./pages/AdminPatentProofOfDelta"));
const AdminPatentApplication = lazy(() => import("./pages/AdminPatentApplication"));
const AdminPatentUpdatedLanguage = lazy(() => import("./pages/AdminPatentUpdatedLanguage"));
const AdminPatentComparison = lazy(() => import("./pages/AdminPatentComparison"));
const AdminUtilityPatentDraft = lazy(() => import("./pages/AdminUtilityPatentDraft"));
const EmbeddedWalletDemo = lazy(() => import("./pages/archive/EmbeddedWalletDemo"));
const WhitePaper = lazy(() => import("./pages/WhitePaper"));
const Engineering = lazy(() => import("./pages/Engineering"));
const WhitePaperWrapper = lazy(() => import("./components/WhitePaperWrapper"));
const AdminLiveEnergyFlow = lazy(() => import("./pages/AdminLiveEnergyFlow"));
const AdminCockpit = lazy(() => import("./pages/AdminCockpit"));
const AdminProjectSummary = lazy(() => import("./pages/AdminProjectSummary"));
const AdminSSOT = lazy(() => import("./pages/AdminSSOT"));
const AdminSeoStrategy = lazy(() => import("./pages/admin/SeoStrategy"));
const AdminContentCalendar = lazy(() => import("./pages/admin/ContentCalendar"));
const AdminBlogManager = lazy(() => import("./pages/admin/BlogManager"));
const EnergyLog = lazy(() => import("./pages/EnergyLog"));
const OutageHistory = lazy(() => import("./pages/OutageHistory"));
const AdminEnergyDataArchitecture = lazy(() => import("./pages/admin/EnergyDataArchitecture"));
const WorkJournal = lazy(() => import("./pages/admin/WorkJournal"));
const AdminEmailAnalytics = lazy(() => import("./pages/admin/EmailAnalytics"));
const AdminEmailPreview = lazy(() => import("./pages/admin/EmailPreview"));
const AdminWeeklyDigest = lazy(() => import("./pages/admin/WeeklyDigestPreview"));
const AdminWeeklyDigestEmailPreview = lazy(() => import("./pages/admin/WeeklyDigestEmailPreview"));
const AdminWeeklyNarrativePreview = lazy(() => import("./pages/admin/WeeklyNarrativePreview"));
const WeeklyNarrative = lazy(() => import("./pages/energy-insights/WeeklyNarrative"));
const EnergyInsightsPage = lazy(() => import("./pages/energy-insights/Insights"));
const AdminCoffeePitch = lazy(() => import("./pages/archive/AdminCoffeePitch"));
const AdminInvestorPitch = lazy(() => import("./pages/archive/AdminInvestorPitch"));
const DeckPinGated = lazy(() => import("./pages/DeckPinGated"));
const Investor = lazy(() => import("./pages/Investor"));
const InvestorPitch = lazy(() => import("./pages/InvestorPitch"));
const InvestorOnePager = lazy(() => import("./pages/InvestorOnePager"));
const InvestorDataRoom = lazy(() => import("./pages/InvestorDataRoom"));
const InvestorDataRoomPoG = lazy(() => import("./pages/InvestorDataRoomPoG"));
const InvestorWhyThisRound = lazy(() => import("./pages/InvestorWhyThisRound"));
const InvestorSolarCoinComparison = lazy(() => import("./pages/InvestorSolarCoinComparison"));
const Seed = lazy(() => import("./pages/Seed"));
const SeedOnePager = lazy(() => import("./pages/SeedOnePager"));
const SeedDeck = lazy(() => import("./pages/SeedDeck"));
const SeedDataRoom = lazy(() => import("./pages/SeedDataRoom"));
const HeroTest = lazy(() => import("./pages/archive/HeroTest"));

const Blog = lazy(() => import("./pages/Blog"));
const BlogWhatIsSolar = lazy(() => import("./pages/blog/WhatIsSolarBlockchainRewards"));
const BlogHowToEarn = lazy(() => import("./pages/blog/HowToEarnCryptoFromSolar"));
const BlogProofOfDelta = lazy(() => import("./pages/blog/ProofOfDeltaExplained"));
const VerifyPoA = lazy(() => import("./pages/VerifyPoA"));
const DeviceProofOfOrigin = lazy(() => import("./pages/DeviceProofOfOrigin"));

// Archive (frozen 10B-era pages — read-only time capsule)
import { ArchivedPageWrapper } from "./components/admin/ArchivedPageWrapper";
const AdminArchive = lazy(() => import("./pages/AdminArchive"));
const ArchivedFinalTokenomics10B = lazy(() => import("./pages/archive/AdminFinalTokenomics_v1_10B"));
const ArchivedContracts10B = lazy(() => import("./pages/archive/AdminContracts_v1_10B"));
const ArchivedFundraising10B = lazy(() => import("./pages/archive/AdminFundraising_v1_10B"));
const ArchivedPatentMintOnProofV1 = lazy(() => import("./pages/archive/AdminPatentMintOnProof_v1"));
const BlogTeslaSolar = lazy(() => import("./pages/blog/TeslaSolarCryptoRewards"));
const BlogEnphase = lazy(() => import("./pages/blog/EnphaseSolarBlockchain"));
const BlogEVCharging = lazy(() => import("./pages/blog/EVChargingCryptoEarnings"));
const BlogV2GHub = lazy(() => import("./pages/blog/V2GV2HBidirectionalCharging"));
const BlogV2G = lazy(() => import("./pages/blog/V2GVehicleToGrid"));
const BlogV2H = lazy(() => import("./pages/blog/V2HVehicleToHome"));
const BlogV2X = lazy(() => import("./pages/blog/V2XVehicleToEverything"));
const BlogV2L = lazy(() => import("./pages/blog/V2LVehicleToLoad"));
const BlogVPP = lazy(() => import("./pages/blog/VirtualPowerPlantVPP"));

// Minimal loading fallback.
// IMPORTANT: We intentionally render `null` here. The inline `#pwa-splash`
// in index.html stays visible during the cold boot → first-route handoff,
// so a separate <BrandedSpinner /> would just stack a *second* loader on
// top of it (the "spinning circle then logo again" flash users reported).
// The first real page content calls `window.hideSplashScreen()` to dismiss.
function PageLoader() {
  return null;
}

const App = () => {
  // iOS standalone PWAs can briefly (or persistently) show the underlying page background
  // when the system theme is light while the UI is styled dark. Force dark theme tokens
  // in standalone display mode to prevent white safe-area/overscroll artifacts.
  const isStandalone =
    typeof window !== "undefined" &&
    (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      // iOS Safari legacy standalone flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any)?.standalone === true
    );

  // Foreground fallback: surface push notifications as in-app toasts
  useServiceWorkerMessages();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
    >
      <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewAsUserProvider>
          <LazyWeb3Provider>
            <TooltipProvider>
            <ErrorBoundary>
              <BotProtection blockBots>
                <Toaster />
                <Sonner />
                <DeferredMount>
                  <Suspense fallback={null}>
                    <InstallNudge />
                  </Suspense>
                </DeferredMount>
                <BrowserRouter>
                  <GoogleAnalytics />
                  <PathNormalizer />
                  <AppHistoryTracker />
                  <ScrollManager />
                  <SwipeBackHandler />
                  <DeferredMount>
                    <Suspense fallback={null}>
                      <PageCleanupFlagger />
                    </Suspense>
                  </DeferredMount>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/unsubscribe" element={<Suspense fallback={<PageLoader />}><Unsubscribe /></Suspense>} />
                   <Route path="/install" element={<Install />} />
                   <Route path="/deck" element={<Suspense fallback={<PageLoader />}><DeckPinGated /></Suspense>} />
                   <Route path="/investor" element={<Suspense fallback={<PageLoader />}><Investor /></Suspense>} />
                   <Route path="/investor/why-this-round" element={<Suspense fallback={<PageLoader />}><InvestorWhyThisRound /></Suspense>} />
                   <Route path="/investor/solarcoin-comparison" element={<Suspense fallback={<PageLoader />}><InvestorSolarCoinComparison /></Suspense>} />
                   <Route path="/investor/pitch" element={<Suspense fallback={<PageLoader />}><InvestorPitch /></Suspense>} />
                   <Route path="/investor/one-pager" element={<Suspense fallback={<PageLoader />}><InvestorOnePager /></Suspense>} />
                   <Route path="/investor/data-room" element={<Suspense fallback={<PageLoader />}><InvestorDataRoom /></Suspense>} />
                   <Route path="/investor/data-room/pog" element={<Suspense fallback={<PageLoader />}><InvestorDataRoomPoG /></Suspense>} />
                   <Route path="/seed" element={<Suspense fallback={<PageLoader />}><Seed /></Suspense>} />
                   <Route path="/seed/one-pager" element={<Suspense fallback={<PageLoader />}><SeedOnePager /></Suspense>} />
                   <Route path="/seed/deck" element={<Suspense fallback={<PageLoader />}><SeedDeck /></Suspense>} />
                   <Route path="/seed/data-room" element={<Suspense fallback={<PageLoader />}><SeedDataRoom /></Suspense>} />
                    <Route path="/hero-test" element={<Navigate to="/admin/archive/hero-test" replace />} />
                    
                    <Route path="/proof-of-genesis-receipt-preview" element={<ProofOfGenesisReceiptPreview />} />
                    <Route path="/demo/proof-of-genesis-receipt-preview" element={<ProofOfGenesisReceiptPreview />} />
                    {/* Resilient aliases — catch common typos / old paths so the link never 404s */}
                    <Route path="/proof-of-genesis-receipt" element={<Navigate to="/proof-of-genesis-receipt-preview" replace />} />
                    <Route path="/pog-receipt-preview" element={<Navigate to="/proof-of-genesis-receipt-preview" replace />} />
                    <Route path="/pog-receipt" element={<Navigate to="/proof-of-genesis-receipt-preview" replace />} />
                    <Route path="/proof-of-genesis-preview" element={<Navigate to="/proof-of-genesis-receipt-preview" replace />} />
                    <Route path="/receipt-preview" element={<Navigate to="/proof-of-genesis-receipt-preview" replace />} />
                    <Route path="/demo/proof-of-genesis-receipt" element={<Navigate to="/demo/proof-of-genesis-receipt-preview" replace />} />
                    <Route path="/demo/pog-receipt-preview" element={<Navigate to="/demo/proof-of-genesis-receipt-preview" replace />} />
                    <Route path="/demo/pog-receipt" element={<Navigate to="/demo/proof-of-genesis-receipt-preview" replace />} />
                    {/* Public Proof-of-Authenticity™ verification — no auth required */}
                    <Route path="/verify/:poa" element={<VerifyPoA />} />
                    {/* Per-device Proof-of-Origin™ — founder + PIN gated (Phase 1) */}
                    <Route path="/devices/:deviceId/origin" element={<DeviceProofOfOrigin />} />
                    
                    {/* Demo routes with full sidebar — gated by access code + NDA */}
                    <Route path="/demo" element={<DemoAccessGate><DemoLayout /></DemoAccessGate>}>
                      <Route index element={<DemoDashboard />} />
                      <Route path="energy-log" element={<DemoEnergyLog />} />
                      <Route path="nft-collection" element={<DemoNftCollection />} />
                      <Route path="mint-history" element={<MintHistory />} />
                      <Route path="learn" element={<Learn />} />
                      <Route path="learn/tour" element={<LearnTour />} />
                      <Route path="learn/glossary" element={<LearnGlossary />} />
                      <Route path="learn/how-it-works" element={<LearnHowItWorks />} />
                      <Route path="learn/tokenomics" element={<LearnTokenomics />} />
                      <Route path="learn/proof-of-genesis" element={<LearnProofOfGenesis />} />
                      <Route path="learn/patent-tech" element={<LearnPatentTech />} />
                      <Route path="proof-of-genesis" element={<ProofOfGenesis />} />
                      <Route path="white-paper" element={<WhitePaper />} />
                      <Route path="engineering" element={<Engineering />} />
                      <Route path="technology" element={<Technology />} />
                      <Route path="store" element={<Store />} />
                      <Route path="referrals" element={<Referrals />} />
                      <Route path="notifications" element={<Notifications />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="wallet" element={<DemoWallet />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="help-center" element={<HelpCenter />} />
                      {/* Learn deep-dive pages (linked from Learn hub) */}
                      <Route path="how-it-works" element={<HowItWorks />} />
                      <Route path="tokenomics" element={<Tokenomics />} />
                      <Route path="help" element={<Navigate to="/demo/help-center?tab=help" replace />} />
                      <Route path="feedback" element={<Navigate to="/demo/help-center?tab=feedback" replace />} />
                      <Route path="about" element={<Navigate to="/demo/profile" replace />} />
                      <Route path="terms" element={<Terms />} />
                      <Route path="privacy" element={<Privacy />} />
                      <Route path="blog" element={<Blog />} />
                      <Route path="reviewer" element={<DemoReviewerHub />} />
                    </Route>

                    {/* /demo-leonardo retired — redirect to /demo for any old links. */}
                    <Route path="/demo-leonardo" element={<Navigate to="/demo" replace />} />
                    <Route path="/demo-leonardo/*" element={<Navigate to="/demo" replace />} />


                    <Route path="/home" element={<Home />} />
                    {/* Subscribe wrapped in AppLayout so it inherits the
                        global top nav (back button + safe-area-top) and bottom nav. */}
                    <Route path="/subscribe" element={<Suspense fallback={<PageLoader />}><AppLayout><Subscribe /></AppLayout></Suspense>} />
                    <Route path="/demo/subscribe" element={<Suspense fallback={<PageLoader />}><AppLayout><Subscribe /></AppLayout></Suspense>} />
                    <Route path="/competition/gridpay" element={<Navigate to="/admin/archive/competition-gridpay" replace />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/what-is-solar-energy-blockchain-rewards" element={<BlogWhatIsSolar />} />
                    <Route path="/blog/how-to-earn-crypto-from-solar-panels" element={<BlogHowToEarn />} />
                    <Route path="/blog/proof-of-delta-explained" element={<BlogProofOfDelta />} />
                    <Route path="/blog/tesla-solar-panel-crypto-rewards" element={<BlogTeslaSolar />} />
                    <Route path="/blog/enphase-solar-blockchain" element={<BlogEnphase />} />
                    <Route path="/blog/ev-charging-crypto-earnings" element={<BlogEVCharging />} />
                    <Route path="/blog/v2g-v2h-bidirectional-ev-charging" element={<BlogV2GHub />} />
                    <Route path="/blog/v2g-vehicle-to-grid" element={<BlogV2G />} />
                    <Route path="/blog/v2h-vehicle-to-home" element={<BlogV2H />} />
                    <Route path="/blog/v2x-vehicle-to-everything" element={<BlogV2X />} />
                    <Route path="/blog/v2l-vehicle-to-load" element={<BlogV2L />} />
                    <Route path="/blog/virtual-power-plant-vpp" element={<BlogVPP />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/yc-application" element={<Navigate to="/admin/archive/yc-application" replace />} />
                    <Route path="/a16z-speedrun" element={<Navigate to="/admin/archive/a16z-speedrun" replace />} />
                    <Route path="/oauth/callback" element={<OAuthCallback />} />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Admin />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/analytics" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminAnalytics />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/emails" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminEmailAnalytics />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/email-preview" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminEmailPreview />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/weekly-digest" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminWeeklyDigest />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/weekly-digest/email-preview"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminWeeklyDigestEmailPreview />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />


                    <Route
                      path="/admin/weekly-narrative"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminWeeklyNarrativePreview />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/energy-insights"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<PageLoader />}><EnergyInsightsPage /></Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/energy-insights/week/:id"
                      element={
                        <ProtectedRoute>
                          <WeeklyNarrative />
                        </ProtectedRoute>
                      }
                    />



                    <Route 
                      path="/admin/ev-api-reference" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminEvApiReference />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/revenue-flywheel" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminRevenueFlywheel />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/contracts" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminContracts />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/project-summary" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminProjectSummary />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/ssot" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminSSOT />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminUsers />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/mint-requests" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminMintRequests />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/protocol-integrity" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminProtocolIntegrity />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/kpi-reconciliation" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminKpiReconciliation />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/page-cleanup" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminPageCleanup />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    {/* Root route - shows Landing for guests, Dashboard for auth users */}
                    <Route path="/" element={<RootRoute />} />
                    {/* Consolidated routes */}
                    <Route 
                      path="/learn" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Learn />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    {/* Learn sub-routes */}
                    <Route
                      path="/learn/tour"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <LearnTour />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/learn/glossary"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <LearnGlossary />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/glossary"
                      element={
                        <AppLayout>
                          <Glossary />
                        </AppLayout>
                      }
                    />
                    <Route
                      path="/learn/how-it-works"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <LearnHowItWorks />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/learn/tokenomics"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <LearnTokenomics />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/learn/proof-of-genesis"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <LearnProofOfGenesis />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/learn/patent-tech"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <LearnPatentTech />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    {/* Admin-only theme gallery for the Learn section */}
                    <Route path="/learn/themes" element={<Navigate to="/admin/archive/learn-themes" replace />} />
                    <Route
                      path="/proof-of-genesis"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <ProofOfGenesis />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/proof-of-genesis/mainnet-readiness"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <ProofOfGenesisMainnetReadiness />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/help-center" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <HelpCenter />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    {/* Standalone pages */}
                    <Route 
                      path="/nft-collection" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <NftCollection />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/mint-history" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <MintHistory />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/white-paper" element={<WhitePaperWrapper />} />
                    <Route
                      path="/engineering"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Engineering />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/technology" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Technology />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    {/* Redirects from old routes */}
                    {/* /how-it-works — public, top-level rich hub page (single source of truth) */}
                    <Route path="/how-it-works" element={<Suspense fallback={<PageLoader />}><HowItWorks /></Suspense>} />
                    <Route path="/tokenomics" element={<Navigate to="/learn?tab=tokenomics" replace />} />
                    <Route path="/help" element={<Navigate to="/help-center?tab=help" replace />} />
                    <Route path="/feedback" element={<Navigate to="/help-center?tab=feedback" replace />} />
                    <Route path="/about" element={<Navigate to="/profile" replace />} />
                    {/* P0 audit fixes — kill 404s for common deep links */}
                    <Route path="/mint" element={<Navigate to="/mint-history" replace />} />
                    <Route path="/energy-logs" element={<Navigate to="/energy-log" replace />} />
                    <Route path="/my-energy-logs" element={<Navigate to="/energy-log" replace />} />
                    <Route path="/nfts" element={<Navigate to="/nft-collection" replace />} />
                    <Route path="/referral" element={<Navigate to="/referrals" replace />} />
                    {/* /founders is registered below at line 985 — no duplicate needed */}
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Profile />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Settings />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/security" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Security />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/notifications" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Notifications />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/referrals" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Referrals />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/energy-log" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <EnergyLog />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/outage-history"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <OutageHistory />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/store" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Store />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/wallet" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Wallet />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/admin/investment-thesis" element={<Navigate to="/admin/archive/admin-investment-thesis" replace />} />
                    <Route 
                      path="/admin/patent-mapping" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminPatentMapping />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/fundraising" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminFundraising />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/admin/token-estimator" element={<Navigate to="/admin/archive/admin-token-estimator" replace />} />
                    <Route path="/admin/tokenomics-10b" element={<Navigate to="/admin/archive/admin-tokenomics-10b" replace />} />
                    {/* Legacy investor pitch routes — superseded by /investor/pitch. Redirect for any bookmarked links. */}
                    <Route path="/admin/investor-one-pager" element={<Navigate to="/investor/pitch" replace />} />
                    <Route path="/admin/investor-pitch" element={<Navigate to="/investor/pitch" replace />} />
                    <Route path="/admin/coffee-pitch" element={<Navigate to="/investor/pitch" replace />} />
                    <Route path="/admin/cost-savings" element={<Navigate to="/admin/archive/admin-cost-savings" replace />} />
                    <Route path="/admin/tokenomics-framework" element={<Navigate to="/admin/archive/admin-tokenomics-framework" replace />} />
                    <Route path="/admin/flywheel-tracker" element={<Navigate to="/admin/archive/admin-flywheel-tracker" replace />} />
                    <Route 
                      path="/admin/final-tokenomics" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminFinalTokenomics />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/admin/glossary" element={<Navigate to="/admin/archive/admin-glossary" replace />} />
                    <Route path="/admin/growth-projections" element={<Navigate to="/admin/archive/admin-growth-projections" replace />} />
                    <Route path="/admin/ai-feedback-loop" element={<Navigate to="/admin/archive/admin-ai-feedback-loop" replace />} />
                    <Route path="/admin/ai-agents" element={<Navigate to="/admin/archive/admin-ai-agents" replace />} />
                    <Route path="/admin/live-beta-economics" element={<Navigate to="/admin/archive/admin-live-beta-economics" replace />} />
                    <Route 
                      path="/admin/competitive-intel" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminCompetitiveIntel />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/energy-data-architecture" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminEnergyDataArchitecture />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/work-journal" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <WorkJournal />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/security" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminSecurityArchitecture />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/admin/bootstrap-calculator" element={<Navigate to="/admin/archive/admin-bootstrap-calculator" replace />} />
                    <Route path="/admin/bootstrap-simulator" element={<Navigate to="/admin/archive/admin-bootstrap-simulator" replace />} />
                    <Route path="/admin/lp-capacity" element={<Navigate to="/admin/archive/admin-lp-capacity" replace />} />
                    <Route 
                      path="/admin/beta-deployment" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminBetaDeployment />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/live-energy-flow" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminLiveEnergyFlow />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/cockpit" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminCockpit />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/todo" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminTodo />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/starlink-plan" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminStarlinkPlan />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/wallet-providers" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminWalletProviders />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/admin/yc-application" element={<Navigate to="/admin/archive/yc-application" replace />} />
                    <Route path="/admin/a16z-speedrun" element={<Navigate to="/admin/archive/a16z-speedrun" replace />} />
                    <Route path="/admin/embedded-wallet-demo" element={<Navigate to="/admin/archive/embedded-wallet-demo" replace />} />
                    <Route path="/admin/future-roadmap" element={<Navigate to="/admin/archive/admin-future-roadmap" replace />} />
                    <Route path="/admin/market-defense" element={<Navigate to="/admin/archive/admin-market-defense" replace />} />
                    <Route 
                      path="/admin/patent/mint-on-proof" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminPatentMintOnProof />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/patent/proof-of-delta" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminPatentProofOfDelta />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/patent/application" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminPatentApplication />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/patent/updated-language" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminPatentUpdatedLanguage />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/patent/comparison" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminPatentComparison />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/patent/utility-draft" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminUtilityPatentDraft />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/seo-strategy"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminSeoStrategy />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/content-calendar" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminContentCalendar />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/blog-manager" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminBlogManager />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    {/* Tokenomics Archive — frozen 10B-era pages */}
                    <Route path="/admin/archive" element={
                      <ProtectedRoute><AppLayout><AdminArchive /></AppLayout></ProtectedRoute>
                    } />
                    <Route path="/admin/archive/final-tokenomics-10b" element={
                      <ProtectedRoute><AppLayout>
                        <ArchivedPageWrapper
                          modelName="10B Strategy ($0.10 Floor)"
                          archivedDate="April 2026"
                          supersededBy="1T Trillionaire Strategy"
                          reason="Cap expanded 100x for trillionaire founder outcomes"
                        >
                          <ArchivedFinalTokenomics10B />
                        </ArchivedPageWrapper>
                      </AppLayout></ProtectedRoute>
                    } />
                    <Route path="/admin/archive/contracts-10b" element={
                      <ProtectedRoute><AppLayout>
                        <ArchivedPageWrapper
                          modelName="10B Strategy ($0.10 Floor)"
                          archivedDate="April 2026"
                          supersededBy="1T Trillionaire Strategy"
                        >
                          <ArchivedContracts10B />
                        </ArchivedPageWrapper>
                      </AppLayout></ProtectedRoute>
                    } />
                    <Route path="/admin/archive/fundraising-10b" element={
                      <ProtectedRoute><AppLayout>
                        <ArchivedPageWrapper
                          modelName="10B Strategy ($0.10 Floor)"
                          archivedDate="April 2026"
                          supersededBy="1T Trillionaire Strategy"
                        >
                          <ArchivedFundraising10B />
                        </ArchivedPageWrapper>
                      </AppLayout></ProtectedRoute>
                    } />
                    <Route path="/admin/archive/patent-mint-on-proof-v1" element={
                      <ProtectedRoute><AppLayout>
                        <ArchivedPageWrapper
                          modelName="Mint-on-Proof Patent (v1)"
                          archivedDate="April 2026"
                          supersededBy="Mint-on-Proof v2 (Tesla/SpaceX scope + 1T)"
                          reason="Pre-SolarCity origin story, pre-Tesla/SpaceX tokenization scope"
                        >
                          <ArchivedPatentMintOnProofV1 />
                        </ArchivedPageWrapper>
                      </AppLayout></ProtectedRoute>
                    } />
                    {/* Investor Pitch v2 archive — frozen legacy pitch pages */}
                    {([
                      { slug: 'founders-lyndon-pitch-v2', model: 'Lyndon Pitch v2', Comp: FoundersLyndonPitchV2 },
                      { slug: 'founders-seed-pitch-companion-deck', model: 'Seed Pitch Companion Deck', Comp: FoundersSeedPitchCompanionDeck },
                      { slug: 'founders-seed-pitch-greg', model: 'Seed Pitch (Greg)', Comp: FoundersSeedPitch },
                      { slug: 'founders-ssot-one-pager', model: 'SSOT One-Pager', Comp: FoundersSsotOnePager },
                      { slug: 'founders-spacex', model: 'SpaceX Comparable', Comp: FoundersSpaceX },
                      { slug: 'founders-app-overhaul', model: 'App Overhaul Plan', Comp: FoundersAppOverhaul },
                      { slug: 'founders-catchup', model: 'Founders Catchup', Comp: FoundersCatchup },
                      { slug: 'admin-coffee-pitch', model: 'Coffee Pitch', Comp: AdminCoffeePitch },
                      { slug: 'admin-investor-pitch', model: 'Investor Pitch (v1)', Comp: AdminInvestorPitch },
                      { slug: 'admin-investor-one-pager', model: 'Investor One-Pager (v1)', Comp: AdminInvestorOnePager },
                    ] as const).map(({ slug, model, Comp }) => (
                      <Route key={slug} path={`/admin/archive/${slug}`} element={
                        <ProtectedRoute><AppLayout>
                          <ArchivedPageWrapper
                            modelName={model}
                            archivedDate="May 2026"
                            supersededBy="Investor Pitch v2 (/investor/pitch)"
                            reason="Superseded by canonical Investor Pitch v2 — flywheel + three revenue engines"
                          >
                            <Comp />
                          </ArchivedPageWrapper>
                        </AppLayout></ProtectedRoute>
                      } />
                    ))}
                    {/* Founders Vault archive — Phase 3a (May 2026): superseded / one-off pages */}
                    {([
                      { slug: 'founder-pack', model: 'Founder Pack (legacy hub)', Comp: FounderPack, reason: 'Superseded by /founders Vault + Master Outline' },
                      { slug: 'founders-deason-utility-ai', model: 'Deason Utility AI (planning)', Comp: FoundersDeasonUtilityAI, reason: 'Superseded by /founders/deason-v3' },
                      { slug: 'founders-creative-1to1-tokenomics', model: 'Creative 1:1 Tokenomics Ideas', Comp: FoundersCreative1to1Tokenomics, reason: 'Superseded by Mint Split v3.1 lock (src/lib/tokenomics.ts)' },
                      { slug: 'founders-ssot-zen', model: 'SSOT Zen', Comp: FoundersSsotZen, reason: 'Duplicates /founders/master-outline' },
                      { slug: 'founders-simulator', model: 'Founders Simulator', Comp: FoundersSimulator, reason: 'One-off math sandbox — superseded by /founders/flywheel-simulation' },
                      { slug: 'founders-revenue-models', model: 'Revenue Models (founder math)', Comp: FoundersRevenueModels, reason: 'Investor narrative now lives at /investor/pitch (ThreeRevenueEngines SSOT)' },
                      { slug: 'founders-secondary-revenue', model: 'Secondary Revenue Streams', Comp: FoundersSecondaryRevenue, reason: 'Investor narrative now lives at /investor/pitch (ThreeRevenueEngines SSOT)' },
                      { slug: 'founders-the-ask', model: 'The Ask (Lyndon $5M / board seat)', Comp: FoundersTheAsk, reason: 'Stale raise framing — current ask is $2.5–3.5M Part 1 at /investor/pitch' },
                      { slug: 'founders-seed-allocation', model: 'Seed Allocation (editable $5M one-pager)', Comp: FoundersSeedAllocation, reason: 'Stale $5M / $0.25-launch numbers — canonical raise lives at /investor/pitch' },
                      { slug: 'founders-lyndon-one-pager', model: 'Lyndon One-Pager (distribution framing)', Comp: FoundersLyndonOnePager, reason: 'Superseded by /investor/pitch as the canonical outbound artifact' },
                      { slug: 'founders-tschida', model: 'Tschida Cofounder Handout (50/50 PDF)', Comp: FoundersTschida, reason: 'Archived per founder request — math remains in src/lib/subscriptionSplitModel.ts' },
                    ] as const).map(({ slug, model, Comp, reason }) => (
                      <Route key={slug} path={`/admin/archive/${slug}`} element={
                        <ProtectedRoute><AppLayout>
                          <ArchivedPageWrapper
                            modelName={model}
                            archivedDate="May 2026"
                            supersededBy="Founders Vault (canonical)"
                            reason={reason}
                          >
                            <Comp />
                          </ArchivedPageWrapper>
                        </AppLayout></ProtectedRoute>
                      } />
                    ))}
                    {/* Pre-launch cleanup — Jun 2026: bulk sweep of stale brainstorm / test / one-off pages */}
                    {([
                      { slug: 'founders-changelog', model: 'Founders Changelog', Comp: FoundersChangelog, reason: 'Internal dev bookkeeping — not a ship surface' },
                      { slug: 'founders-master-outline', model: 'Founders Master Outline', Comp: FoundersMasterOutline, reason: 'Superseded by /admin/ssot' },
                      { slug: 'founders-bitcoin-thesis', model: 'Bitcoin Thesis', Comp: FoundersBitcoinThesis, reason: 'Macro brainstorm — not tied to product surface' },
                      { slug: 'founders-funded-lp', model: 'Funded LP Scenarios', Comp: FoundersFundedLP, reason: 'Founder financial modeling — not customer-facing' },
                      { slug: 'founders-flywheel-simulation', model: 'Flywheel Simulation', Comp: FlywheelSimulation, reason: 'Tokenomics sandbox — superseded by /investor/pitch narrative' },
                      { slug: 'founders-energy-oracle', model: 'Energy Oracle (R&D)', Comp: FoundersEnergyOracle, reason: 'Concept sketch — Energy Price Oracle is parked for Series A' },
                      { slug: 'founders-deason-v3', model: 'Deason v3 (investor strategy)', Comp: FoundersDeasonV3, reason: 'Superseded by /investor/pitch ThreeRevenueEngines' },
                      { slug: 'founders-vpp-roadmap', model: 'VPP Roadmap (internal)', Comp: FoundersVPPRoadmap, reason: 'Internal planning doc — VPP narrative excluded from investor surfaces' },
                      { slug: 'founders-patent-expansion', model: 'Patent Expansion Brainstorm', Comp: FoundersPatentExpansion, reason: 'Patent SSOT lives in /admin/patent/*' },
                      { slug: 'whitepaper-phase-1', model: 'Whitepaper Phase 1 (draft)', Comp: WhitepaperPhase1, reason: 'Superseded by canonical /white-paper' },
                      { slug: 'whitepaper-phase-2', model: 'Whitepaper Phase 2 (draft)', Comp: WhitepaperPhase2, reason: 'Superseded by canonical /white-paper' },
                      { slug: 'hero-test', model: 'Hero A/B Test', Comp: HeroTest, reason: 'Test page — no production use' },
                      { slug: 'learn-themes', model: 'Learn Theme Gallery', Comp: LearnThemes, reason: 'Internal dev preview — not a user surface' },
                      { slug: 'embedded-wallet-demo', model: 'Embedded Wallet Demo', Comp: EmbeddedWalletDemo, reason: 'Dev sandbox — real wallet lives at /wallet' },
                      { slug: 'yc-application', model: 'YC Application', Comp: AdminYCApplication, reason: 'Stale application artifact' },
                      { slug: 'a16z-speedrun', model: 'a16z Speedrun Application', Comp: A16ZSpeedrunApplication, reason: 'Stale application artifact' },
                      { slug: 'admin-tokenomics-10b', model: 'Admin Tokenomics 10B', Comp: AdminTokenomics10B, reason: 'Superseded by 1T-era tokenomics SSOT' },
                      { slug: 'admin-bootstrap-calculator', model: 'Bootstrap Calculator', Comp: AdminBootstrapCalculator, reason: 'One-off math tool — superseded by /admin/kpi-reconciliation' },
                      { slug: 'admin-bootstrap-simulator', model: 'Bootstrap Simulator', Comp: AdminBootstrapSimulator, reason: 'One-off simulator — superseded by /admin/kpi-reconciliation' },
                      { slug: 'admin-lp-capacity', model: 'LP Capacity Calculator', Comp: AdminLPCapacityCalculator, reason: 'One-off calc — not referenced in active fundraising docs' },
                      { slug: 'admin-ai-feedback-loop', model: 'AI Feedback Loop', Comp: AdminAIFeedbackLoop, reason: 'Concept exploration — no active implementation' },
                      { slug: 'admin-ai-agents', model: 'AI Agent Opportunities', Comp: AdminAIAgentOpportunities, reason: 'Brainstorm doc — not actionable pre-launch' },
                    ] as const).map(({ slug, model, Comp, reason }) => (
                      <Route key={slug} path={`/admin/archive/${slug}`} element={
                        <ProtectedRoute><AppLayout>
                          <ArchivedPageWrapper
                            modelName={model}
                            archivedDate="June 2026"
                            supersededBy="Pre-launch cleanup"
                            reason={reason}
                          >
                            <Comp />
                          </ArchivedPageWrapper>
                        </AppLayout></ProtectedRoute>
                      } />
                    ))}
                    {/* Pre-launch cleanup wave 2 — Jun 2026: dupes, stale narrative artifacts, dead admin tools */}
                    {([
                      { slug: 'founders-proof-of-genesis', model: 'Founders Proof-of-Genesis', Comp: FoundersProofOfGenesis, reason: 'Duplicates canonical /proof-of-genesis receipt' },
                      { slug: 'founders-current-status', model: 'Founders Current Status', Comp: FoundersCurrentStatus, reason: 'Status lives in /admin/todo + /admin/ssot — one board, not three' },
                      { slug: 'admin-glossary', model: 'Admin Glossary', Comp: AdminGlossary, reason: 'Duplicates public /glossary — one glossary' },
                      { slug: 'admin-investment-thesis', model: 'Investment Thesis', Comp: InvestmentThesis, reason: 'Investor narrative SSOT is /investor/pitch' },
                      { slug: 'admin-cost-savings', model: 'Cost Savings Analysis', Comp: AdminCostSavings, reason: 'One-off investor artifact — not a live operational tool' },
                      { slug: 'admin-market-defense', model: 'Market Defense Mechanisms', Comp: AdminMarketDefenseMechanisms, reason: 'Moat narrative belongs in /investor/pitch' },
                      { slug: 'admin-future-roadmap', model: 'Future Roadmap', Comp: AdminFutureRoadmap, reason: 'Roadmap lives in mem://, /admin/todo, /admin/ssot' },
                      { slug: 'admin-growth-projections', model: 'Growth Projections', Comp: AdminGrowthProjections, reason: 'Superseded by /admin/fundraising (live tracker)' },
                      { slug: 'admin-tokenomics-framework', model: 'Tokenomics Framework', Comp: AdminTokenomicsFramework, reason: 'Superseded by src/lib/tokenomics.ts SSOT + /admin/final-tokenomics' },
                      { slug: 'admin-token-estimator', model: 'Token Estimator', Comp: AdminTokenEstimator, reason: 'One-off math tool — superseded by /admin/kpi-reconciliation' },
                      { slug: 'admin-flywheel-tracker', model: 'Flywheel Tracker', Comp: AdminFlywheelTracker, reason: 'Duplicates /admin/revenue-flywheel + /admin/kpi-reconciliation' },
                      { slug: 'admin-live-beta-economics', model: 'Live Beta Economics', Comp: AdminLiveBetaEconomics, reason: 'Superseded by /admin/analytics' },
                      { slug: 'competition-gridpay', model: 'GridPay Competition', Comp: GridPayCompetition, reason: 'Founder pitch artifact — not a customer-facing landing' },
                    ] as const).map(({ slug, model, Comp, reason }) => (
                      <Route key={slug} path={`/admin/archive/${slug}`} element={
                        <ProtectedRoute><AppLayout>
                          <ArchivedPageWrapper
                            modelName={model}
                            archivedDate="June 2026"
                            supersededBy="Pre-launch cleanup wave 2"
                            reason={reason}
                          >
                            <Comp />
                          </ArchivedPageWrapper>
                        </AppLayout></ProtectedRoute>
                      } />
                    ))}


                    {/* Founders Vault - direct URL only, no nav link. All gated by FounderRoute. */}
                    <Route path="/founder" element={<Navigate to="/founders" replace />} />
                    <Route path="/founders" element={<FounderRoute><FoundersVault /></FounderRoute>} />
                    <Route path="/founders/revenue-models" element={<Navigate to="/admin/archive/founders-revenue-models" replace />} />
                    <Route path="/founder-pack" element={<Navigate to="/admin/archive/founder-pack" replace />} />
                    <Route path="/whitepaper-phase-1" element={<Navigate to="/admin/archive/whitepaper-phase-1" replace />} />
                    <Route path="/whitepaper-phase-2" element={<Navigate to="/admin/archive/whitepaper-phase-2" replace />} />
                    <Route path="/founders/spacex" element={<Navigate to="/investor/pitch" replace />} />
                    <Route path="/founders/app-overhaul-plan" element={<Navigate to="/investor/pitch" replace />} />
                    <Route path="/founders/app-overhaul" element={<Navigate to="/investor/pitch" replace />} />
                    <Route path="/founders/proof-of-genesis" element={<Navigate to="/admin/archive/founders-proof-of-genesis" replace />} />
                    
                    <Route path="/founders/deason-v3" element={<Navigate to="/admin/archive/founders-deason-v3" replace />} />
                    <Route path="/founders/deason-utility-ai-revstream" element={<Navigate to="/admin/archive/founders-deason-utility-ai" replace />} />
                    <Route path="/founders/vault/deason-utility-ai-revstream" element={<Navigate to="/admin/archive/founders-deason-utility-ai" replace />} />
                    <Route path="/founders/seed-ask" element={<Navigate to="/founders/the-ask" replace />} />
                    <Route path="/founders/competitive-landscape" element={<FounderRoute><FoundersCompetitiveLandscape /></FounderRoute>} />
                    <Route path="/founders/the-ask" element={<Navigate to="/admin/archive/founders-the-ask" replace />} />
                    <Route path="/founders/seed-allocation" element={<Navigate to="/admin/archive/founders-seed-allocation" replace />} />
                    <Route path="/founders/current-status" element={<Navigate to="/admin/archive/founders-current-status" replace />} />
                    <Route path="/founders/changelog" element={<Navigate to="/admin/archive/founders-changelog" replace />} />
                    <Route path="/founders/creative-1to1-tokenomics-ideas" element={<Navigate to="/admin/archive/founders-creative-1to1-tokenomics" replace />} />
                    <Route path="/founders/catchup" element={<Navigate to="/investor/pitch" replace />} />
                    <Route path="/founders/lyndon" element={<Navigate to="/admin/archive/founders-lyndon-one-pager" replace />} />
                    <Route path="/founders/lyndon-pitch-v2" element={<Navigate to="/investor/pitch" replace />} />
                   <Route path="/founders/seed-pitch-greg" element={<Navigate to="/investor" replace />} />
                   <Route path="/founders/seed-pitch-companion-deck" element={<Navigate to="/investor/pitch" replace />} />
                    <Route path="/founders/secondary-revenue" element={<Navigate to="/admin/archive/founders-secondary-revenue" replace />} />
                    <Route path="/founders/vpp-roadmap" element={<Navigate to="/admin/archive/founders-vpp-roadmap" replace />} />
                    <Route path="/founders/energy-oracle" element={<Navigate to="/admin/archive/founders-energy-oracle" replace />} />
                    <Route path="/founders/patent-expansion" element={<Navigate to="/admin/archive/founders-patent-expansion" replace />} />
                    <Route path="/founders/master-outline" element={<Navigate to="/admin/archive/founders-master-outline" replace />} />
                    <Route path="/founders/ssot-zen" element={<Navigate to="/admin/archive/founders-ssot-zen" replace />} />
                    <Route path="/founders/ssot-one-pager" element={<Navigate to="/investor/one-pager" replace />} />
                    <Route path="/founders/bitcoin-thesis" element={<Navigate to="/admin/archive/founders-bitcoin-thesis" replace />} />
                    <Route path="/founders/funded-lp" element={<Navigate to="/admin/archive/founders-funded-lp" replace />} />
                    <Route path="/founders/tschida" element={<Navigate to="/admin/archive/founders-tschida" replace />} />
                    <Route path="/admin/subscriptions" element={<ProtectedRoute><AppLayout><AdminSubscriptionPanel /></AppLayout></ProtectedRoute>} />
                    <Route path="/founders/subscription-admin" element={<Navigate to="/admin/subscriptions" replace />} />
                    <Route path="/founders/flywheel-simulation" element={<Navigate to="/admin/archive/founders-flywheel-simulation" replace />} />
                    <Route path="/founders/simulator" element={<Navigate to="/admin/archive/founders-simulator" replace />} />
                    <Route path="/simulator" element={<Navigate to="/admin/archive/founders-simulator" replace />} />

                    <Route path="/vault/founder-funded-lp" element={<Navigate to="/founders/funded-lp" replace />} />
                    {/* Transparency page — gated inside the component to preview hosts + founders only */}
                    <Route path="/transparency" element={<Transparency />} />
                    {/* Subscriber-exclusive Pulse page — personalized network impact */}
                    <Route
                      path="/pulse"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Pulse />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    {/* Deason — founders-only AI agent */}
                    <Route path="/deason" element={<FounderRoute><Deason /></FounderRoute>} />
                    <Route path="/deason/:threadId" element={<FounderRoute><Deason /></FounderRoute>} />
                    {/* Live ZenSolar Economy dashboard */}
                    <Route
                      path="/ecosystem"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<PageLoader />}><Ecosystem /></Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    {/* Starlink — manual attestation mint (beta) */}
                    <Route
                      path="/starlink"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<PageLoader />}><StarlinkMint /></Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/prototype/energy-flow" element={<Suspense fallback={<PageLoader />}><PrototypeEnergyFlow /></Suspense>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                    <DeferredMount timeout={2000}>
                      <Suspense fallback={null}>
                        <DeasonFloatingBubble />
                      </Suspense>
                    </DeferredMount>
                  </Suspense>
                </BrowserRouter>
              </BotProtection>
            </ErrorBoundary>
          </TooltipProvider>
        </LazyWeb3Provider>
      </ViewAsUserProvider>
    </AuthProvider>
    </QueryClientProvider>
      </AppThemeProvider>
    </ThemeProvider>
  );
};

export default App;
