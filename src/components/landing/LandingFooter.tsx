import { Link } from 'react-router-dom';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export function LandingFooter() {
  return (
    <footer className="py-8 border-t border-border/40 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="container max-w-6xl mx-auto px-4 space-y-3 text-center">
        <div className="text-sm font-medium tracking-wide">
          <p className="bg-gradient-to-r from-primary via-secondary to-energy bg-clip-text text-transparent">
            The World's First One-Tap, Mint-on-Proof
          </p>
          <p className="bg-gradient-to-r from-primary via-secondary to-energy bg-clip-text text-transparent">
            Web3 Clean Energy Platform
          </p>
        </div>

        <div className="flex justify-center">
          <img src={zenLogo} alt="ZenSolar" width="81" height="24" className="h-6 w-auto dark:animate-logo-glow" />
        </div>

        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-muted-foreground px-4">
          <Link to="/how-it-works" className="hover:text-foreground transition-colors whitespace-nowrap">How It Works</Link>
          <Link to="/technology" className="hover:text-foreground transition-colors whitespace-nowrap">Technology</Link>
          <Link to="/demo" className="hover:text-foreground transition-colors whitespace-nowrap">Demo</Link>
          <Link to="/white-paper" className="hover:text-foreground transition-colors whitespace-nowrap">White Paper</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors whitespace-nowrap">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors whitespace-nowrap">Privacy</Link>
        </div>

        <p className="text-sm text-muted-foreground">© 2026 ZenSolar. Patent Pending.</p>
      </div>
    </footer>
  );
}
