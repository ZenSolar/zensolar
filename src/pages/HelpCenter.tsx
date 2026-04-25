import { lazy, Suspense } from 'react';
import { HelpCircle, MessageSquarePlus, Loader2, LifeBuoy } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { cn } from '@/lib/utils';

const Help = lazy(() => import('./Help'));
const Feedback = lazy(() => import('./Feedback'));

const tabs = [
  { id: 'help', label: 'Help & FAQ', icon: HelpCircle },
  { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus },
] as const;

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') || 'help') as typeof tabs[number]['id'];

  return (
    <>
      <SEO title="Help & Feedback" url="https://beta.zen.solar/help-center" />
      <PageShell
        title="Help & Feedback"
        description="Find answers, report issues, or share what you'd like to see next."
        icon={LifeBuoy}
        width="4xl"
        sticky={
          <nav className="flex gap-1 py-2" aria-label="Help sections">
            {tabs.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSearchParams({ tab: t.id })}
                  className={cn(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        }
      >
        <Suspense fallback={<Loading />}>
          {tab === 'help' ? <Help /> : <Feedback />}
        </Suspense>
      </PageShell>
    </>
  );
}
