import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, FileText, RefreshCw, Sparkles, Scale } from 'lucide-react';

interface PatentPage {
  path: string;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
}

const patentPages: PatentPage[] = [
  { path: '/admin/patent', title: 'Patent Application Materials', shortTitle: 'Application', icon: FileText },
  { path: '/admin/patent/updated-language', title: 'Updated Patent Language', shortTitle: 'Updated Language', icon: RefreshCw },
  { path: '/admin/patent/mint-on-proof', title: 'Mint-on-Proof Documentation', shortTitle: 'Mint-on-Proof', icon: Sparkles },
  { path: '/admin/patent/proof-of-delta', title: 'Proof-of-Delta Documentation', shortTitle: 'Proof-of-Delta', icon: Scale },
];

export function PatentPageNavigation() {
  const location = useLocation();
  const currentIndex = patentPages.findIndex(page => page.path === location.pathname);
  
  const prevPage = currentIndex > 0 ? patentPages[currentIndex - 1] : null;
  const nextPage = currentIndex < patentPages.length - 1 ? patentPages[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
      <div className="flex-1">
        {prevPage ? (
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to={prevPage.path}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{prevPage.shortTitle}</span>
            </Link>
          </Button>
        ) : (
          <div />
        )}
      </div>

      <div className="flex items-center gap-1">
        {patentPages.map((page, index) => {
          const Icon = page.icon;
          const isCurrent = page.path === location.pathname;
          return (
            <Link
              key={page.path}
              to={page.path}
              className={`p-2 rounded-lg transition-colors ${
                isCurrent 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title={page.title}
            >
              <Icon className="h-4 w-4" />
            </Link>
          );
        })}
      </div>

      <div className="flex-1 flex justify-end">
        {nextPage ? (
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to={nextPage.path}>
              <span className="hidden sm:inline">{nextPage.shortTitle}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
