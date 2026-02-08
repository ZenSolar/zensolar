import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DemoSidebar } from '@/components/demo/DemoSidebar';
import { TopNav } from '@/components/layout/TopNav';
import { MenuTooltip } from '@/components/layout/MenuTooltip';
import { DemoProvider } from '@/contexts/DemoContext';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export function DemoLayout() {
  const { setTheme } = useTheme();

  // Default demo mode to dark theme for consistent brand presentation
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  return (
    <DemoProvider>
      <SidebarProvider>
        <div className="min-h-screen min-h-[100dvh] flex w-full min-w-0 overflow-x-hidden">
          <DemoSidebar />
          <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] min-w-0">
            {/* Fixed header - always visible */}
            <TopNav isDemo />
            <MenuTooltip />
            {/* Main content with padding-top to offset fixed header */}
            <main className="flex-1 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-safe min-w-0 overflow-x-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </DemoProvider>
  );
}
