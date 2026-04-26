import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { useLearnTheme } from '@/hooks/useLearnTheme';

interface LearnSubPageShellProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  seoTitle: string;
  seoUrl: string;
  children: ReactNode;
}

/**
 * Wrapper used by every Learn sub-page so they share the same theme,
 * back-to-hub link, and PageShell config — keeps navigation predictable.
 */
export function LearnSubPageShell({
  title,
  description,
  icon,
  seoTitle,
  seoUrl,
  children,
}: LearnSubPageShellProps) {
  const learnTheme = useLearnTheme();

  useEffect(() => {
    document.documentElement.dataset.learnTheme = learnTheme;
    return () => {
      delete document.documentElement.dataset.learnTheme;
    };
  }, [learnTheme]);

  return (
    <>
      <SEO title={seoTitle} url={seoUrl} />
      <div data-learn-theme={learnTheme} className="learn-surface">
        <PageShell
          title={title}
          description={description}
          icon={icon}
          width="4xl"
          actions={
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/demo/learn">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Learn hub
              </Link>
            </Button>
          }
        >
          <div className="space-y-10">{children}</div>
        </PageShell>
      </div>
    </>
  );
}
