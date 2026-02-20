import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const sections = [
  { id: 'how-it-works',        label: 'How It Works' },
  { id: 'dashboard-showcase',  label: 'Dashboard' },
  { id: 'nft-milestones',      label: 'NFT Milestones' },
  { id: 'why-zensolar',        label: 'Why ZenSolar' },
  { id: 'tokenization-wave',   label: 'Tokenization' },
  { id: 'pricing',             label: 'Pricing' },
  { id: 'testimonials',        label: 'Reviews' },
  { id: 'faq',                 label: 'FAQ' },
];

export function FloatingSectionNav() {
  const [visible, setVisible]       = useState(false);
  const [activeId, setActiveId]     = useState('');
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [sheetOpen, setSheetOpen]   = useState(false);
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

  const haptic = useCallback(async (style: ImpactStyle = ImpactStyle.Light) => {
    try { await Haptics.impact({ style }); } catch { /* web — no-op */ }
  }, []);

  const scrollTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSheetOpen(false);
  }, []);

  const activeLabel = sections.find(s => s.id === activeId)?.label ?? 'Sections';

  return (
    <>
      <div ref={sentinelRef} className="absolute top-[500px] h-px w-px pointer-events-none" aria-hidden />

      {/* ── Desktop: vertical dot pips ── */}
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
                {/* Label tooltip */}
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

                {/* Dot pip */}
                <motion.span
                  animate={{
                    scale: isActive ? 1.2 : isHovered ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className="block rounded-full"
                  style={{
                    width:           isActive ? 8 : 6,
                    height:          isActive ? 8 : 6,
                    backgroundColor: isActive
                      ? 'hsl(var(--primary))'
                      : isHovered
                      ? 'hsl(var(--foreground) / 0.5)'
                      : 'hsl(var(--muted-foreground) / 0.3)',
                    transition: 'background-color 0.2s, width 0.2s, height 0.2s',
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile: floating section chip ── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden"
          >
            <button
              onClick={() => { haptic(ImpactStyle.Light); setSheetOpen(true); }}
              aria-label="Open section navigation"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-xl shadow-black/30 text-[13px] font-semibold text-foreground/90 active:scale-95 transition-transform"
            >
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'hsl(var(--primary))' }}
              />
              <span>{activeLabel}</span>
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile: bottom sheet ── */}
      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="md:hidden pb-safe">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">
              Navigate
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 flex flex-col gap-1">
            {sections.map(({ id, label }) => {
              const isActive = activeId === id;
              return (
                <button
                  key={id}
                  onClick={() => { haptic(ImpactStyle.Medium); scrollTo(id); }}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-left transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground/80 hover:bg-muted/60 active:bg-muted'
                  )}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: isActive
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--muted-foreground) / 0.4)',
                    }}
                  />
                  <span className="text-[15px]">{label}</span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
