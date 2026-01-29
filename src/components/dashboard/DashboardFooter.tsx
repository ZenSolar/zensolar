import { Link } from 'react-router-dom';
import { Store, BookOpen, FileText, ExternalLink } from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border/50 bg-muted/30 backdrop-blur-sm">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center text-center mb-6">
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            className="h-8 w-auto object-contain mb-2 dark:animate-logo-glow" 
          />
          <p className="text-xs text-muted-foreground">
            The World's First One-Tap, Mint-on-Proof Clean Energy Platform
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-6">
          <Link 
            to="/store" 
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Store className="h-4 w-4" />
            $ZSOLAR Store
          </Link>
          <Link 
            to="/how-it-works" 
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            How It Works
          </Link>
          <Link 
            to="/white-paper" 
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <FileText className="h-4 w-4" />
            White Paper
          </Link>
        </nav>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

        {/* Legal Links and Copyright */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/help" className="hover:text-foreground transition-colors">
              Help & Support
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/70">
            © {currentYear} ZenSolar. All rights reserved.
          </p>
          <p className="text-[10px] text-muted-foreground/50 font-mono">
            v1.0.0-beta · Built Jan 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
