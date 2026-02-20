import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const sections = [
  { id: 'how-it-works',      label: 'How It Works' },
  { id: 'dashboard-showcase', label: 'Dashboard' },
  { id: 'nft-milestones',    label: 'NFT Milestones' },
  { id: 'why-zensolar',      label: 'Why ZenSolar' },
  { id: 'tokenization-wave', label: 'Tokenization' },
  { id: 'pricing',           label: 'Pricing' },
  { id: 'testimonials',      label: 'Reviews' },
  { id: 'faq',               label: 'FAQ' },
];

export function FloatingSectionNav() {
  const [visible, setVisible]     = useState(false);
  const [activeId, setActiveId]   = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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
        // Find the topmost intersecting section
        const intersecting = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (intersecting.length > 0) setActiveId(intersecting[0].target.id);
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: 0 }
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
          'fixed right-5 top-1/2 -translate-y-1/2 z-[100] transition-all duration-500 hidden md:flex',
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3 pointer-events-none'
        )}
      >
        <div className="flex flex-col items-end gap-3">
          {sections.map(({ id, label }) => {
            const isActive  = activeId === id;
            const isHovered = hoveredId === id;

            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                aria-label={label}
                className="group relative flex items-center justify-end gap-2.5 focus:outline-none"
              >
                {/* Label */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 6 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="text-[11px] font-semibold tracking-wide text-foreground/80 bg-background/90 backdrop-blur-md border border-border/40 px-2.5 py-1 rounded-full shadow-lg shadow-black/20 whitespace-nowrap pointer-events-none select-none"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Dot */}
                <motion.span
                  animate={{
                    scale:           isActive ? 1.2 : isHovered ? 1.1 : 1,
                    backgroundColor: isActive
                      ? 'hsl(var(--primary))'
                      : isHovered
                      ? 'hsl(var(--foreground) / 0.5)'
                      : 'hsl(var(--muted-foreground) / 0.3)',
                  }}
                  transition={{ duration: 0.2 }}
                  className="block rounded-full"
                  style={{
                    width:  isActive ? 8 : 6,
                    height: isActive ? 8 : 6,
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
