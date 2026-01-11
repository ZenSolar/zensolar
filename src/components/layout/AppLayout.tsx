import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { MenuTooltip } from "./MenuTooltip";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen min-h-[100dvh] flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh]">
          {/* Sticky header with safe area - min-h ensures content fits below notch */}
          <header className="min-h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex items-center justify-between px-4 pt-safe pb-2">
            <SidebarTrigger id="zen-sidebar-trigger" className="text-foreground touch-target" />
            <ThemeToggle />
          </header>
          <MenuTooltip />
          {/* Main content with smooth scrolling */}
          <main className="flex-1 scroll-ios pb-safe">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
