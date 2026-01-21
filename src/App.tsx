import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LazyWeb3Provider } from "@/components/providers/LazyWeb3Provider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BotProtection } from "@/components/BotProtection";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/hooks/useAuth";

// Eagerly load critical path pages
import Auth from "./pages/Auth";
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const Install = lazy(() => import("./pages/Install"));
const Demo = lazy(() => import("./pages/Demo"));
const DemoLayout = lazy(() => import("./components/demo/DemoLayout").then(m => ({ default: m.DemoLayout })));
const DemoDashboard = lazy(() => import("./components/demo/DemoDashboard").then(m => ({ default: m.DemoDashboard })));
const DemoNftCollection = lazy(() => import("./components/demo/DemoNftCollection").then(m => ({ default: m.DemoNftCollection })));
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
const InvestmentThesis = lazy(() => import("./pages/InvestmentThesis"));
const AdminPatentMapping = lazy(() => import("./pages/AdminPatentMapping"));
const AdminFundraising = lazy(() => import("./pages/AdminFundraising"));
const AdminTokenEstimator = lazy(() => import("./pages/AdminTokenEstimator"));

// Minimal loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => {
  // Foreground fallback: if a push arrives while the app is open, show an in-app toast.
  useEffect(() => {
    // Early return if service workers aren't supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'PUSH_RECEIVED' && msg.payload) {
        const title = msg.payload.title || 'ZenSolar';
        const description = msg.payload.body || 'You have a new notification';
        toast(title, { description });
      }
    };

    // Ensure controller exists before adding listener
    if (navigator.serviceWorker.controller || navigator.serviceWorker.ready) {
      navigator.serviceWorker.addEventListener('message', onMessage);
      return () => navigator.serviceWorker.removeEventListener('message', onMessage);
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
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
                      <Route path="nft-collection" element={<DemoNftCollection />} />
                      <Route path="how-it-works" element={<HowItWorks />} />
                      <Route path="technology" element={<Technology />} />
                      <Route path="store" element={<Store />} />
                      <Route path="tokenomics" element={<Tokenomics />} />
                      <Route path="mint-history" element={<MintHistory />} />
                      <Route path="referrals" element={<Referrals />} />
                      <Route path="notifications" element={<Notifications />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="about" element={<About />} />
                      <Route path="help" element={<Help />} />
                      <Route path="feedback" element={<Feedback />} />
                    </Route>
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
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
                      path="/" 
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Index />
                          </AppLayout>
                        </ProtectedRoute>
                      } 
                    />
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
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </BotProtection>
            </ErrorBoundary>
          </TooltipProvider>
        </LazyWeb3Provider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
