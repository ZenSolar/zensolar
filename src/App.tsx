import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyWeb3Provider } from "@/components/providers/LazyWeb3Provider";

// Single shared QueryClient — must wrap everything that may use react-query,
// including components that render before LazyWeb3Provider mounts wagmi.
const queryClient = new QueryClient();
import { DemoAccessGate } from "@/components/demo/DemoAccessGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BotProtection } from "@/components/BotProtection";
import { BrandedSpinner } from "@/components/ui/BrandedSpinner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewAsUserProvider } from "@/contexts/ViewAsUserContext";
import { useServiceWorkerMessages } from "@/hooks/useServiceWorkerMessages";
import { RootRoute } from "./components/RootRoute";
import Home from "./pages/Home";

// Lazy load layout and auth components to reduce main bundle size
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));
const FounderRoute = lazy(() => import("@/components/FounderRoute").then(m => ({ default: m.FounderRoute })));
const AppLayout = lazy(() => import("@/components/layout/AppLayout").then(m => ({ default: m.AppLayout })));
const Auth = lazy(() => import("./pages/Auth"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

// Lazy load all other pages for code splitting
const Install = lazy(() => import("./pages/Install"));
const Demo = lazy(() => import("./pages/Demo"));
const DwightPreview = lazy(() => import("./pages/DwightPreview"));
const TaylorPreview = lazy(() => import("./pages/TaylorPreview"));
const DemoLayout = lazy(() => import("./components/demo/DemoLayout").then(m => ({ default: m.DemoLayout })));
const DemoDashboard = lazy(() => import("./components/demo/DemoDashboardSwitcher").then(m => ({ default: m.DemoDashboardSwitcher })));
const DemoNftCollection = lazy(() => import("./components/demo/DemoNftCollection").then(m => ({ default: m.DemoNftCollection })));
const DemoEnergyLog = lazy(() => import("./components/demo/DemoEnergyLog").then(m => ({ default: m.DemoEnergyLog })));
const DemoWallet = lazy(() => import("./components/demo/DemoWallet").then(m => ({ default: m.DemoWallet })));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminContracts = lazy(() => import("./pages/AdminContracts"));
const AdminEvApiReference = lazy(() => import("./pages/AdminEvApiReference"));
const AdminRevenueFlywheel = lazy(() => import("./pages/AdminRevenueFlywheel"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminMintRequests = lazy(() => import("./pages/AdminMintRequests"));
const Tokenomics = lazy(() => import("./pages/Tokenomics"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const MintHistory = lazy(() => import("./pages/MintHistory"));
const Feedback = lazy(() => import("./pages/Feedback"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FoundersVault = lazy(() => import("./pages/FoundersVault"));
const FounderPack = lazy(() => import("./pages/FounderPack"));
const WhitepaperPhase1 = lazy(() => import("./pages/WhitepaperPhase1"));
const WhitepaperPhase2 = lazy(() => import("./pages/WhitepaperPhase2"));
const FoundersSpaceX = lazy(() => import("./pages/FoundersSpaceX"));
const FoundersAppOverhaul = lazy(() => import("./pages/FoundersAppOverhaul"));
const FoundersDeasonV3 = lazy(() => import("./pages/FoundersDeasonV3"));
const FoundersProofOfGenesis = lazy(() => import("./pages/FoundersProofOfGenesis"));
const V2App = lazy(() => import("./pages/V2App"));
const FounderSeedAsk = lazy(() => import("./pages/FounderSeedAsk"));
const Deason = lazy(() => import("./pages/Deason"));
import { DeasonFloatingBubble } from "./components/deason/DeasonFloatingBubble";
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
const NftCollection = lazy(() => import("./pages/NftCollection"));
const Wallet = lazy(() => import("./pages/Wallet"));
// Combined pages
const NFTs = lazy(() => import("./pages/NFTs"));
const Learn = lazy(() => import("./pages/Learn"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const InvestmentThesis = lazy(() => import("./pages/InvestmentThesis"));
const GridPayCompetition = lazy(() => import("./pages/GridPayCompetition"));
const AdminPatentMapping = lazy(() => import("./pages/AdminPatentMapping"));
const AdminFundraising = lazy(() => import("./pages/AdminFundraising"));
const AdminTokenEstimator = lazy(() => import("./pages/AdminTokenEstimator"));
const AdminTokenomics10B = lazy(() => import("./pages/AdminTokenomics10B"));
const AdminInvestorOnePager = lazy(() => import("./pages/AdminInvestorOnePager"));
const AdminCostSavings = lazy(() => import("./pages/AdminCostSavings"));
const AdminTokenomicsFramework = lazy(() => import("./pages/AdminTokenomicsFramework"));
const AdminAIFeedbackLoop = lazy(() => import("./pages/AdminAIFeedbackLoop"));
const AdminAIAgentOpportunities = lazy(() => import("./pages/AdminAIAgentOpportunities"));
const AdminFlywheelTracker = lazy(() => import("./pages/AdminFlywheelTracker"));
const AdminFinalTokenomics = lazy(() => import("./pages/AdminFinalTokenomics"));
const AdminGlossary = lazy(() => import("./pages/AdminGlossary"));
const AdminGrowthProjections = lazy(() => import("./pages/AdminGrowthProjections"));
const AdminLiveBetaEconomics = lazy(() => import("./pages/AdminLiveBetaEconomics"));
const AdminCompetitiveIntel = lazy(() => import("./pages/AdminCompetitiveIntel"));
const AdminSecurityArchitecture = lazy(() => import("./pages/AdminSecurityArchitecture"));
const AdminBootstrapCalculator = lazy(() => import("./pages/AdminBootstrapCalculator"));
const AdminBootstrapSimulator = lazy(() => import("./pages/AdminBootstrapSimulator"));
const AdminLPCapacityCalculator = lazy(() => import("./pages/AdminLPCapacityCalculator"));
const AdminBetaDeployment = lazy(() => import("./pages/AdminBetaDeployment"));
const AdminTodo = lazy(() => import("./pages/AdminTodo"));
const AdminWalletProviders = lazy(() => import("./pages/AdminWalletProviders"));
const AdminYCApplication = lazy(() => import("./pages/AdminYCApplication"));
const A16ZSpeedrunApplication = lazy(() => import("./pages/A16ZSpeedrunApplication"));
const AdminFutureRoadmap = lazy(() => import("./pages/AdminFutureRoadmap"));
const AdminMarketDefenseMechanisms = lazy(() => import("./pages/AdminMarketDefenseMechanisms"));
const AdminPatentMintOnProof = lazy(() => import("./pages/AdminPatentMintOnProof"));
const AdminPatentProofOfDelta = lazy(() => import("./pages/AdminPatentProofOfDelta"));
const AdminPatentApplication = lazy(() => import("./pages/AdminPatentApplication"));
const AdminPatentUpdatedLanguage = lazy(() => import("./pages/AdminPatentUpdatedLanguage"));
const AdminPatentComparison = lazy(() => import("./pages/AdminPatentComparison"));
const AdminUtilityPatentDraft = lazy(() => import("./pages/AdminUtilityPatentDraft"));
const EmbeddedWalletDemo = lazy(() => import("./pages/EmbeddedWalletDemo"));
const WhitePaper = lazy(() => import("./pages/WhitePaper"));
const Engineering = lazy(() => import("./pages/Engineering"));
const WhitePaperWrapper = lazy(() => import("./components/WhitePaperWrapper"));
const AdminLiveEnergyFlow = lazy(() => import("./pages/AdminLiveEnergyFlow"));
const AdminProjectSummary = lazy(() => import("./pages/AdminProjectSummary"));
const AdminSeoStrategy = lazy(() => import("./pages/admin/SeoStrategy"));
const AdminContentCalendar = lazy(() => import("./pages/admin/ContentCalendar"));
const AdminBlogManager = lazy(() => import("./pages/admin/BlogManager"));
const EnergyLog = lazy(() => import("./pages/EnergyLog"));
const AdminEnergyDataArchitecture = lazy(() => import("./pages/admin/EnergyDataArchitecture"));
const WorkJournal = lazy(() => import("./pages/admin/WorkJournal"));
const AdminEmailAnalytics = lazy(() => import("./pages/admin/EmailAnalytics"));
const AdminEmailPreview = lazy(() => import("./pages/admin/EmailPreview"));
const AdminCoffeePitch = lazy(() => import("./pages/AdminCoffeePitch"));
const AdminInvestorPitch = lazy(() => import("./pages/AdminInvestorPitch"));
const HeroTest = lazy(() => import("./pages/HeroTest"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogWhatIsSolar = lazy(() => import("./pages/blog/WhatIsSolarBlockchainRewards"));
const BlogHowToEarn = lazy(() => import("./pages/blog/HowToEarnCryptoFromSolar"));
const BlogProofOfDelta = lazy(() => import("./pages/blog/ProofOfDeltaExplained"));

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

// Minimal loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <BrandedSpinner size="lg" />
    </div>
  );
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
      forcedTheme={undefined}
    >
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewAsUserProvider>
          <LazyWeb3Provider>
            <TooltipProvider>
            <ErrorBoundary>
              <BotProtection blockBots>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <GoogleAnalytics />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/unsubscribe" element={<Suspense fallback={<PageLoader />}><Unsubscribe /></Suspense>} />
                    <Route path="/install" element={<Install />} />
                    <Route path="/hero-test" element={<Suspense fallback={<PageLoader />}><HeroTest /></Suspense>} />
                    <Route path="/dwight-preview" element={<DwightPreview />} />
                    <Route path="/taylor-preview" element={<TaylorPreview />} />
                    
                    {/* Demo routes with full sidebar — gated by access code + NDA */}
                    <Route path="/demo" element={<DemoAccessGate><DemoLayout /></DemoAccessGate>}>
                      <Route index element={<DemoDashboard />} />
                      <Route path="energy-log" element={<DemoEnergyLog />} />
                      <Route path="nft-collection" element={<DemoNftCollection />} />
                      <Route path="mint-history" element={<MintHistory />} />
                      <Route path="learn" element={<Learn />} />
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
                      {/* Legacy demo redirects */}
                      <Route path="how-it-works" element={<Navigate to="/demo/learn?tab=how-it-works" replace />} />
                      <Route path="tokenomics" element={<Navigate to="/demo/learn?tab=tokenomics" replace />} />
                      <Route path="help" element={<Navigate to="/demo/help-center?tab=help" replace />} />
                      <Route path="feedback" element={<Navigate to="/demo/help-center?tab=feedback" replace />} />
                      <Route path="about" element={<Navigate to="/demo/profile" replace />} />
                      <Route path="terms" element={<Terms />} />
                      <Route path="privacy" element={<Privacy />} />
                      <Route path="blog" element={<Blog />} />
                    </Route>
                    <Route path="/home" element={<Home />} />
                    <Route path="/competition/gridpay" element={<GridPayCompetition />} />
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
                    <Route path="/yc-application" element={<AdminYCApplication />} />
                    <Route path="/a16z-speedrun" element={<A16ZSpeedrunApplication />} />
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
                    <Route path="/how-it-works" element={<Navigate to="/learn?tab=how-it-works" replace />} />
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
                    <Route 
                      path="/admin/investment-thesis" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <InvestmentThesis />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
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
                    <Route 
                      path="/admin/token-estimator" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminTokenEstimator />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/tokenomics-10b" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminTokenomics10B />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/investor-one-pager" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminInvestorOnePager />
                      </AppLayout>
                    </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/investor-pitch" 
                      element={
                        <ProtectedRoute>
                          <AdminInvestorPitch />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/coffee-pitch" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminCoffeePitch />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/cost-savings" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminCostSavings />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/tokenomics-framework" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminTokenomicsFramework />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/flywheel-tracker" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminFlywheelTracker />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
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
                    <Route 
                      path="/admin/glossary" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminGlossary />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/growth-projections" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminGrowthProjections />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/ai-feedback-loop" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminAIFeedbackLoop />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/ai-agents" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminAIAgentOpportunities />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/admin/live-beta-economics" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminLiveBetaEconomics />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
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
                    <Route 
                      path="/admin/bootstrap-calculator" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminBootstrapCalculator />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/bootstrap-simulator" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminBootstrapSimulator />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/lp-capacity" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminLPCapacityCalculator />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
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
                      path="/admin/wallet-providers" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminWalletProviders />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/yc-application" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminYCApplication />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/a16z-speedrun" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <A16ZSpeedrunApplication />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/embedded-wallet-demo" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <EmbeddedWalletDemo />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/future-roadmap" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminFutureRoadmap />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/market-defense" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminMarketDefenseMechanisms />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
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
                    {/* Founders Vault - direct URL only, no nav link. All gated by FounderRoute. */}
                    <Route path="/founder" element={<Navigate to="/founders" replace />} />
                    <Route path="/founders" element={<FounderRoute><FoundersVault /></FounderRoute>} />
                    <Route path="/founder-pack" element={<FounderRoute><FounderPack /></FounderRoute>} />
                    <Route path="/whitepaper-phase-1" element={<FounderRoute><WhitepaperPhase1 /></FounderRoute>} />
                    <Route path="/whitepaper-phase-2" element={<FounderRoute><WhitepaperPhase2 /></FounderRoute>} />
                    <Route path="/founders/spacex" element={<FounderRoute><FoundersSpaceX /></FounderRoute>} />
                    <Route path="/founders/app-overhaul-plan" element={<FounderRoute><FoundersAppOverhaul /></FounderRoute>} />
                    <Route path="/founders/proof-of-genesis" element={<FounderRoute><FoundersProofOfGenesis /></FounderRoute>} />
                    <Route path="/founders/v2app" element={<FounderRoute><V2App /></FounderRoute>} />
                    <Route path="/founders/deason-v3" element={<FounderRoute><FoundersDeasonV3 /></FounderRoute>} />
                    <Route path="/founders/seed-ask" element={<FounderRoute><FounderSeedAsk /></FounderRoute>} />
                    {/* Deason — founders-only AI agent */}
                    <Route path="/deason" element={<FounderRoute><Deason /></FounderRoute>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                    <DeasonFloatingBubble />
                  </Suspense>
                </BrowserRouter>
              </BotProtection>
            </ErrorBoundary>
          </TooltipProvider>
        </LazyWeb3Provider>
      </ViewAsUserProvider>
    </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
