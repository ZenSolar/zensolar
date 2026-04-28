import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sparkles, Link2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DemoSidebar } from '@/components/demo/DemoSidebar';
import { TopNav } from '@/components/layout/TopNav';
import { DemoProvider } from '@/contexts/DemoContext';
import { useDemoScreenshotDetector } from '@/hooks/useDemoScreenshotDetector';
import { FeedbackFab } from '@/components/FeedbackFab';
import { Badge } from '@/components/ui/badge';
import { resetFirstMintCelebration } from '@/lib/firstMintCelebration';
import { toast } from 'sonner';

export function DemoLayout() {
  useDemoScreenshotDetector();
  const location = useLocation();
  const navigate = useNavigate();
  const host = typeof window === 'undefined' ? '' : window.location.hostname;
  const showRouteBanner = import.meta.env.DEV || host.includes('lovableproject.com') || host.includes('id-preview--') || new URLSearchParams(location.search).has('routeqa');

  // Convenience: ?replayCinematic=1 (anywhere) clears the flags so the next
  // mint plays the full Cinematic D again. Also exposes window.zenReplayCinematic().
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('replayCinematic') === '1') {
      resetFirstMintCelebration();
      toast.success('Cinematic D armed — your next mint will play it.');
      params.delete('replayCinematic');
      navigate(
        { pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' },
        { replace: true },
      );
    }
  }, [location.pathname, location.search, navigate]);

  const handleReplay = () => {
    resetFirstMintCelebration();
    toast.success('Cinematic D armed — your next mint will play it.');
  };

  const handleCopyReplayUrl = async () => {
    // Always share the canonical demo URL — never lovable.app/.dev preview hosts.
    const url = 'https://beta.zen.solar/demo?replayCinematic=1';
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Replay link copied', { description: url });
    } catch {
      toast.error('Could not copy', { description: url });
    }
  };

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
              {showRouteBanner && (
                <div className="mx-auto mt-2 max-w-4xl px-4">
                  <div className="flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-[11px] text-primary">
                    <span className="font-semibold uppercase tracking-[0.14em]">Demo route QA</span>
                    <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
                      {location.pathname}
                    </Badge>
                  </div>
                </div>
              )}
              <Outlet />
            </main>
          </div>
        </div>
        <FeedbackFab />
        {/* Demo-only: arm Cinematic D so the next mint replays the full ~11s sequence. */}
        <button
          type="button"
          onClick={handleReplay}
          aria-label="Replay first-mint cinematic on next mint"
          className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/80 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-[0_0_18px_hsl(var(--primary)/0.25)] backdrop-blur hover:bg-primary/10 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Replay cinematic
        </button>
      </SidebarProvider>
    </DemoProvider>
  );
}
