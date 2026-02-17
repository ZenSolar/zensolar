import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const primarySections = [
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'why-zensolar', label: 'Why Us' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

const overflowSections = [
  { id: 'dashboard-showcase', label: 'Dashboard' },
  { id: 'clean-energy-center', label: 'Energy Center' },
  { id: 'nft-milestones', label: 'NFT Milestones' },
  { id: 'store-redemption', label: 'Store & Rewards' },
  { id: 'testimonials', label: 'Testimonials' },
];

const allSections = [...primarySections, ...overflowSections];

export function FloatingSectionNav() {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    visibilityObserver.observe(sentinel);

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    allSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    return () => {
      visibilityObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  // Close menu on outside click — use click (not mousedown) so menu item clicks fire first
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    // Use setTimeout to avoid the same click that opened the menu from closing it
    const id = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handler);
    };
  }, [menuOpen]);

  const scrollTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  }, []);

  const isOverflowActive = overflowSections.some(s => s.id === activeId);

  return (
    <>
      <div ref={sentinelRef} className="absolute top-[500px] h-px w-px pointer-events-none" aria-hidden />
      <nav
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full border border-border/50 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/20">
          {primarySections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap',
                activeId === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {label}
            </button>
          ))}

          {/* Overflow trigger */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(o => !o);
              }}
              className={cn(
                'px-2.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap',
                isOverflowActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              aria-label="More sections"
            >
              •••
            </button>

            {menuOpen && (
              <div className="absolute bottom-full mb-2 right-0 min-w-[170px] rounded-xl border border-border bg-background shadow-xl shadow-black/20 py-1.5 z-[110] overflow-hidden">
                {overflowSections.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollTo(id);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap',
                      activeId === id
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
