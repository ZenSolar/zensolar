import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import { MenuTooltip } from "./MenuTooltip";
import { ViewAsUserBanner } from "@/components/admin/ViewAsUserBanner";
import { useViewAsUser } from "@/contexts/ViewAsUserContext";
import { ViewAsUserIdProvider } from "@/hooks/useViewAsUserId";
import { PushOptInBanner } from "@/components/notifications/PushOptInBanner";
import { usePresence } from "@/hooks/usePresence";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { targetUserId } = useViewAsUser();
  usePresence(); // Track all authenticated users for real-time presence
  
  return (
    <ViewAsUserIdProvider value={targetUserId}>
      <SidebarProvider>
        <div className="min-h-screen min-h-[100dvh] flex w-full min-w-0 overflow-x-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] min-w-0">
            {/* Fixed header - always visible */}
            <TopNav />
            <MenuTooltip />
            {/* Main content with padding-top to offset fixed header */}
            <main className="flex-1 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-safe min-w-0 overflow-x-hidden">
              <PushOptInBanner />
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
