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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import Demo from "./pages/Demo";
import Admin from "./pages/Admin";
import Tokenomics from "./pages/Tokenomics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import OAuthCallback from "./pages/OAuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/demo" element={<Demo />} />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
