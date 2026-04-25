import { lazy, Suspense } from 'react';
import { HelpCircle, MessageSquarePlus, LifeBuoy } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { PageSectionNav, PageShell } from '@/components/layout/PageShell';
import { PageLoader } from '@/components/ui/empty-state';

const Help = lazy(() => import('./Help'));
const Feedback = lazy(() => import('./Feedback'));

const tabs = [
  { id: 'help' as const, label: 'Help & FAQ', icon: HelpCircle },
  { id: 'feedback' as const, label: 'Feedback', icon: MessageSquarePlus },
];
type TabId = typeof tabs[number]['id'];

export default function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = ((searchParams.get('tab') as TabId) || 'help');

  return (
    <>
      <SEO title="Help & Feedback" url="https://beta.zen.solar/help-center" />
      <PageShell
        title="Help & Feedback"
        description="Find answers, report issues, or share what you'd like to see next."
        icon={LifeBuoy}
        width="4xl"
        sticky={
          <PageSectionNav
            items={tabs}
            active={tab}
            onSelect={(id) => setSearchParams({ tab: id })}
            ariaLabel="Help sections"
          />
        }
      >
        <Suspense fallback={<PageLoader label="Loading…" />}>
          {tab === 'help' ? <Help /> : <Feedback />}
        </Suspense>
      </PageShell>
    </>
  );
}
