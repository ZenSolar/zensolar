import { ArrowUpRight } from 'lucide-react';

const links = [
  { label: 'Full Seed Round Deck', href: '/deck' },
  { label: 'One-Pager', href: '/investor/one-pager' },
  { label: 'Pitch', href: '/investor/pitch' },
];

export function InvestorStrip() {
  return (
    <section className="py-10 border-y border-border/40 bg-background/40">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground uppercase tracking-widest text-xs">
            Investor materials
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {link.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
