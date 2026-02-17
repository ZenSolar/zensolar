import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'why-zensolar', label: 'Why Us' },
  { id: 'faq', label: 'FAQ' },
];

export function FloatingSectionNav() {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState('');
  const rafRef = useRef<number>();

  useEffect(() => {
    // Use rAF loop to reliably detect scroll position
    // This handles cases where scroll events don't fire (anchor nav, programmatic scroll)
    let lastScrollY = -1;

    const tick = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY !== lastScrollY) {
        lastScrollY = scrollY;
        setVisible(scrollY > 500);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const observer = new IntersectionObserver(
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
      if (el) observer.observe(el);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-full border border-border/50 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/20">
        {sections.map(({ id, label }) => (
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
      </div>
    </nav>
  );
}
