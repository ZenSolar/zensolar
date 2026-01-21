import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DemoSidebar } from '@/components/demo/DemoSidebar';
import { TopNav } from '@/components/layout/TopNav';

export function DemoLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full min-w-0 overflow-x-hidden bg-background">
        <DemoSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 w-full max-w-full overflow-x-hidden">
          {/* Fixed Header - shared component */}
          <TopNav isDemo />

          {/* Main Content - mobile-safe with constrained width */}
          <main className="flex-1 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-safe min-w-0 w-full max-w-full overflow-x-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
