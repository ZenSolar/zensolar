import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DemoSidebar } from '@/components/demo/DemoSidebar';
import { TopNav } from '@/components/layout/TopNav';

export function DemoLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DemoSidebar />
        <SidebarInset className="flex flex-col flex-1">
          {/* Fixed Header - shared component */}
          <TopNav isDemo />

          {/* Main Content */}
          <main className="flex-1 pt-14">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
