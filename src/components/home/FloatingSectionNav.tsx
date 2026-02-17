import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'dashboard-showcase', label: 'Dashboard' },
  { id: 'clean-energy-center', label: 'Energy Center' },
  { id: 'nft-milestones', label: 'NFTs' },
  { id: 'store-redemption', label: 'Store' },
  { id: 'why-zensolar', label: 'Why Us' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'faq', label: 'FAQ' },
];

export function FloatingSectionNav() {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use IntersectionObserver on a sentinel element placed at the top
    // This is more reliable than window.scrollY in iframe contexts
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is NOT visible, we've scrolled past it → show nav
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    visibilityObserver.observe(sentinel);

    // Track active section
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    return () => {
      visibilityObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <div ref={sentinelRef} className="absolute top-[500px] h-px w-px pointer-events-none" aria-hidden />
      <nav
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 max-w-[92vw]',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="relative rounded-full border border-border/50 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/20">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 rounded-l-full bg-gradient-to-r from-background/90 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 rounded-r-full bg-gradient-to-l from-background/90 to-transparent z-10" />
          <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-hide">
            {sections.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0',
                  activeId === id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
