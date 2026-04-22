import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DemoSidebar } from '@/components/demo/DemoSidebar';
import { TopNav } from '@/components/layout/TopNav';
import { DemoProvider } from '@/contexts/DemoContext';
import { useDemoScreenshotDetector } from '@/hooks/useDemoScreenshotDetector';
import { FeedbackFab } from '@/components/FeedbackFab';

export function DemoLayout() {
  useDemoScreenshotDetector();

  // Force dark on /demo WITHOUT persisting to localStorage, so the user's
  // chosen light/dark preference for the rest of the app is preserved.
  // The pre-paint script in index.html already applied .dark for first paint
  // when the URL is /demo*; this effect guards against runtime changes.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    return () => {
      try {
        const stored = localStorage.getItem('theme');
        const restore = stored === 'light' ? 'light' : 'dark';
        root.classList.remove('light', 'dark');
        root.classList.add(restore);
        root.style.colorScheme = restore;
      } catch {
        /* keep dark */
      }
    };
  }, []);

  return (
    <DemoProvider>
      <SidebarProvider>
        <div className="min-h-screen min-h-[100dvh] flex w-full min-w-0 overflow-x-hidden">
          <DemoSidebar />
          <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] min-w-0">
            <TopNav isDemo />
            <main className="flex-1 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-safe min-w-0 overflow-x-hidden">
              <Outlet />
            </main>
          </div>
        </div>
        <FeedbackFab />
      </SidebarProvider>
    </DemoProvider>
  );
}
