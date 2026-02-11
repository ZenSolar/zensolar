import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function HomeNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to content
      </a>
      <div className="container max-w-6xl mx-auto px-4 flex h-16 items-center justify-between gap-4">
        <Link to="/home" className="flex items-center shrink-0">
          <img src={zenLogo} alt="ZenSolar" width="108" height="32" className="h-8 w-auto dark:animate-logo-glow" />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#tokenomics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tokenomics</a>
          <a href="#integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          <Link to="/white-paper" className="text-sm text-muted-foreground hover:text-foreground transition-colors">White Paper</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="px-3">Log In</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-primary hover:bg-primary/90 px-3 sm:px-4">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
