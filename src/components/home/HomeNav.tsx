import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, Menu, X } from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const navLinks = [
  { href: '#why-zensolar', label: 'Why ZenSolar' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#tokenomics', label: 'Tokenomics' },
  { href: '#faq', label: 'FAQ' },
];

export function HomeNav() {
  const { setTheme, theme } = useTheme();
  const previousTheme = theme;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setTheme('dark');
    return () => {
      if (previousTheme && previousTheme !== 'dark') {
        setTheme(previousTheme);
      }
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to content
      </a>
      <div className="container max-w-6xl mx-auto px-4 flex h-16 items-center justify-between gap-4">
        <Link to="/home" className="flex items-center shrink-0">
          <img src={zenLogo} alt="ZenSolar" width="108" height="32" className="h-8 w-auto dark:animate-logo-glow" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
          ))}
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/auth" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="px-3">Log In</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-primary hover:bg-primary/90 px-3 sm:px-4">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>

          {/* Hamburger toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/blog"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
          >
            Blog
          </Link>
          <Link
            to="/auth"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
          >
            Log In
          </Link>
        </nav>
      )}
    </header>
  );
}
