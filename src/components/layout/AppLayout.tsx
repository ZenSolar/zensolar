import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNav } from "./TopNav";
import { MenuTooltip } from "./MenuTooltip";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen min-h-[100dvh] flex w-full min-w-0 overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] min-w-0">
          {/* Fixed header - always visible */}
          <TopNav />
          <MenuTooltip />
          {/* Main content with padding-top to offset fixed header */}
          <main className="flex-1 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-safe min-w-0 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
