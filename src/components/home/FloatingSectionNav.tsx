import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'how-it-works',   label: 'How It Works' },
  { id: 'tokenization-wave', label: 'Tokenization' },
  { id: 'pricing',        label: 'Pricing' },
  { id: 'testimonials',   label: 'Reviews' },
  { id: 'faq',            label: 'FAQ' },
];

export function FloatingSectionNav() {
  const [visible, setVisible]   = useState(false);
  const [activeId, setActiveId] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

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

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    return () => {
      visibilityObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  const scrollTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="absolute top-[500px] h-px w-px pointer-events-none" aria-hidden />
      <nav
        aria-label="Page sections"
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-full border border-border/40 bg-background/85 backdrop-blur-2xl shadow-xl shadow-black/25">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 whitespace-nowrap',
                activeId === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
