import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";

import { ViewAsUserBanner } from "@/components/admin/ViewAsUserBanner";
import { useViewAsUser } from "@/contexts/ViewAsUserContext";
import { ViewAsUserIdProvider } from "@/hooks/useViewAsUserId";

import { usePresence } from "@/hooks/usePresence";
import { useActivityTracker } from "@/hooks/useActivityTracker";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { targetUserId } = useViewAsUser();
  usePresence(); // Track all authenticated users for real-time presence
  useActivityTracker(); // Track last_seen_at, last_login_at, login_count
  
  return (
    <ViewAsUserIdProvider value={targetUserId}>
      <SidebarProvider>
        <div className="min-h-screen min-h-[100dvh] flex w-full min-w-0 overflow-x-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] min-w-0">
            {/* Fixed header - always visible */}
            <TopNav />
            
            {/* Main content with padding-top to offset fixed header */}
            <main className="flex-1 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-safe min-w-0 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
        {/* Floating banner when viewing as another user */}
        <ViewAsUserBanner />
      </SidebarProvider>
    </ViewAsUserIdProvider>
  );
}
