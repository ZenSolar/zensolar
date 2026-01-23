import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import WhitePaper from "@/pages/WhitePaper";

/**
 * Wrapper component that conditionally renders WhitePaper 
 * with or without AppLayout based on authentication state.
 * 
 * - Authenticated users (PWA): WhitePaper wrapped in AppLayout with sidebar
 * - Unauthenticated users (landing): WhitePaper standalone with its own header
 */
export default function WhitePaperWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Authenticated users get the full app layout with sidebar
  if (isAuthenticated) {
    return (
      <AppLayout>
        <WhitePaper />
      </AppLayout>
    );
  }

  // Unauthenticated users get standalone WhitePaper with its own header
  return <WhitePaper />;
}
