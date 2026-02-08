import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

const WhitePaper = lazy(() => import("@/pages/WhitePaper"));

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

  const fallback = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return fallback;
  }

  // Authenticated users get the full app layout with sidebar
  if (isAuthenticated) {
    return (
      <AppLayout>
        <Suspense fallback={fallback}>
          <WhitePaper />
        </Suspense>
      </AppLayout>
    );
  }

  // Unauthenticated users get standalone WhitePaper with its own header
  return (
    <Suspense fallback={fallback}>
      <WhitePaper />
    </Suspense>
  );
}
