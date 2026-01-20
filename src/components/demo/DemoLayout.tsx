import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoSidebar } from '@/components/demo/DemoSidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

export function DemoLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DemoSidebar />
        <SidebarInset className="flex flex-col flex-1">
          {/* Fixed Header (always visible while scrolling) */}
          <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Badge variant="outline" className="gap-1.5 text-xs bg-primary/10 text-primary border-primary/20">
                  <Play className="h-3 w-3" />
                  Demo Mode
                </Badge>
              </div>
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 pt-14">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
