import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LazyWeb3Provider } from "@/components/providers/LazyWeb3Provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BotProtection } from "@/components/BotProtection";
import { Loader2 } from "lucide-react";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewAsUserProvider } from "@/contexts/ViewAsUserContext";
import { useServiceWorkerMessages } from "@/hooks/useServiceWorkerMessages";

// Lazy load layout and auth components to reduce main bundle size
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));
const AppLayout = lazy(() => import("@/components/layout/AppLayout").then(m => ({ default: m.AppLayout })));
const Auth = lazy(() => import("./pages/Auth"));
import { RootRoute } from "./components/RootRoute";

// Lazy load all other pages for code splitting
const Install = lazy(() => import("./pages/Install"));
const Demo = lazy(() => import("./pages/Demo"));
const DemoLayout = lazy(() => import("./components/demo/DemoLayout").then(m => ({ default: m.DemoLayout })));
const DemoDashboard = lazy(() => import("./components/demo/DemoDashboard").then(m => ({ default: m.DemoDashboard })));
const DemoNftCollection = lazy(() => import("./components/demo/DemoNftCollection").then(m => ({ default: m.DemoNftCollection })));
const DemoEnergyLog = lazy(() => import("./components/demo/DemoEnergyLog").then(m => ({ default: m.DemoEnergyLog })));
const DemoWallet = lazy(() => import("./components/demo/DemoWallet").then(m => ({ default: m.DemoWallet })));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminContracts = lazy(() => import("./pages/AdminContracts"));
const AdminEvApiReference = lazy(() => import("./pages/AdminEvApiReference"));
const AdminRevenueFlywheel = lazy(() => import("./pages/AdminRevenueFlywheel"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Tokenomics = lazy(() => import("./pages/Tokenomics"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const MintHistory = lazy(() => import("./pages/MintHistory"));
const Feedback = lazy(() => import("./pages/Feedback"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Store = lazy(() => import("./pages/Store"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Technology = lazy(() => import("./pages/Technology"));
const NftCollection = lazy(() => import("./pages/NftCollection"));
const Wallet = lazy(() => import("./pages/Wallet"));
const InvestmentThesis = lazy(() => import("./pages/InvestmentThesis"));
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
const AdminBetaDeployment = lazy(() => import("./pages/AdminBetaDeployment"));
const AdminTodo = lazy(() => import("./pages/AdminTodo"));
const AdminWalletProviders = lazy(() => import("./pages/AdminWalletProviders"));
const AdminYCApplication = lazy(() => import("./pages/AdminYCApplication"));
const AdminFutureRoadmap = lazy(() => import("./pages/AdminFutureRoadmap"));
const AdminMarketDefenseMechanisms = lazy(() => import("./pages/AdminMarketDefenseMechanisms"));
const AdminPatentMintOnProof = lazy(() => import("./pages/AdminPatentMintOnProof"));
const AdminPatentProofOfDelta = lazy(() => import("./pages/AdminPatentProofOfDelta"));
const AdminPatentApplication = lazy(() => import("./pages/AdminPatentApplication"));
const AdminPatentUpdatedLanguage = lazy(() => import("./pages/AdminPatentUpdatedLanguage"));
const EmbeddedWalletDemo = lazy(() => import("./pages/EmbeddedWalletDemo"));
const WhitePaper = lazy(() => import("./pages/WhitePaper"));
const WhitePaperWrapper = lazy(() => import("./components/WhitePaperWrapper"));
const AdminViewAsUser = lazy(() => import("./pages/AdminViewAsUser"));
const AdminLiveEnergyFlow = lazy(() => import("./pages/AdminLiveEnergyFlow"));
const AdminProjectSummary = lazy(() => import("./pages/AdminProjectSummary"));
const EnergyLog = lazy(() => import("./pages/EnergyLog"));
const AdminEnergyDataArchitecture = lazy(() => import("./pages/admin/EnergyDataArchitecture"));
const WorkJournal = lazy(() => import("./pages/admin/WorkJournal"));
const AdminCoffeePitch = lazy(() => import("./pages/AdminCoffeePitch"));

// Minimal loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      forcedTheme={isStandalone ? "dark" : undefined}
    >
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
                    <Route path="/install" element={<Install />} />
                    
                    {/* Demo routes with full sidebar */}
                    <Route path="/demo" element={<DemoLayout />}>
                      <Route index element={<DemoDashboard />} />
                      <Route path="energy-log" element={<DemoEnergyLog />} />
                      <Route path="nft-collection" element={<DemoNftCollection />} />
                      <Route path="how-it-works" element={<HowItWorks />} />
                      <Route path="white-paper" element={<WhitePaper />} />
                      <Route path="technology" element={<Technology />} />
                      <Route path="store" element={<Store />} />
                      <Route path="tokenomics" element={<Tokenomics />} />
                      <Route path="mint-history" element={<MintHistory />} />
                      <Route path="referrals" element={<Referrals />} />
                      <Route path="notifications" element={<Notifications />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="wallet" element={<DemoWallet />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="about" element={<About />} />
                      <Route path="help" element={<Help />} />
                      <Route path="feedback" element={<Feedback />} />
                    </Route>
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/yc-application" element={<AdminYCApplication />} />
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
                      path="/admin/view-as-user" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <AdminViewAsUser />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    {/* Root route - shows Landing for guests, Dashboard for auth users */}
                    <Route path="/" element={<RootRoute />} />
                    <Route 
                      path="/how-it-works" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <HowItWorks />
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
                    <Route 
                      path="/tokenomics"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Tokenomics />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
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
                      path="/help" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Help />
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
                      path="/about" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <About />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
                    {/* White Paper - conditionally wrapped in AppLayout based on auth */}
                    <Route path="/white-paper" element={<WhitePaperWrapper />} />
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
                      path="/feedback" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Feedback />
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
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </BotProtection>
            </ErrorBoundary>
          </TooltipProvider>
        </LazyWeb3Provider>
      </ViewAsUserProvider>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
