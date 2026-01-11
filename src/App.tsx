import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BotProtection } from "@/components/BotProtection";
import { toast } from "sonner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import Demo from "./pages/Demo";
import Admin from "./pages/Admin";
import AdminEvApiReference from "./pages/AdminEvApiReference";
import Tokenomics from "./pages/Tokenomics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import MintHistory from "./pages/MintHistory";
import Feedback from "./pages/Feedback";
import OAuthCallback from "./pages/OAuthCallback";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Notifications from "./pages/Notifications";
import Referrals from "./pages/Referrals";
import Store from "./pages/Store";

const queryClient = new QueryClient();

const App = () => {
  // Foreground fallback: if a push arrives while the app is open, show an in-app toast.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'PUSH_RECEIVED' && msg.payload) {
        const title = msg.payload.title || 'ZenSolar';
        const description = msg.payload.body || 'You have a new notification';
        toast(title, { description });
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <ErrorBoundary>
              <BotProtection blockBots>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                <Route path="/install" element={<Install />} />
                <Route path="/demo" element={<Demo />} />
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
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </BotProtection>
            </ErrorBoundary>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;

