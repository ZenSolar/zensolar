import { Link } from 'react-router-dom';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'Demo', to: '/demo' },
      { label: 'Technology', to: '/technology' },
      { label: 'White Paper', to: '/white-paper' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', to: '#faq' },
      { label: 'Tokenomics', to: '#tokenomics' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/help' },
    ],
  },
];

export function HomeFooter() {
  return (
    <footer className="border-t border-border/40 pt-12 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <img src={zenLogo} alt="ZenSolar" width="108" height="32" className="h-8 w-auto dark:animate-logo-glow mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              The world's first mint-on-proof clean energy rewards platform. Patent pending.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Built on</span>
              <span className="text-xs font-semibold text-primary">Base L2</span>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.to.startsWith('#') ? (
                      <a href={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">© 2026 ZenSolar. All rights reserved. Patent Pending.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">🛡️ Patent Pending</span>
            <span className="text-xs text-muted-foreground">🌐 Base L2</span>
            <span className="text-xs text-muted-foreground">⬡ Mint-on-Proof</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
