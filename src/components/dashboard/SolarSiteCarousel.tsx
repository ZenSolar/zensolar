import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SolarDeviceData } from '@/types/dashboard';
import { getSourceMeta } from '@/lib/energySources';

/**
 * Multi-site PV solar carousel.
 *
 * Pattern (Mike Pessah, 3 sites): when a user has >1 PV system, instead of
 * stacking three "Solar Energy Produced" tiles, surface them as a horizontally
 * swipeable carousel. Slide 0 is an aggregate "All Sites" view; subsequent
 * slides are one per device, each badged with its data source (Tesla /
 * Enphase / SolarEdge) so the multi-OEM moat shows up at the KPI level.
 *
 * Pure presentation: receives prebuilt slide nodes from ActivityMetrics so
 * mint plumbing (openSheet, deviceId) stays in one place.
 */

export interface SolarSiteSlide {
  /** Stable key — "all" for aggregate, deviceId for per-site slides. */
  key: string;
  /** Short caption shown under the carousel (e.g. "All Sites", "PROJ-8098"). */
  caption: string;
  /** Provider key for the source badge; undefined on aggregate slide. */
  provider?: SolarDeviceData['provider'];
  /** The already-rendered tile (typically an ActivityField). */
  node: React.ReactNode;
}

interface SolarSiteCarouselProps {
  slides: SolarSiteSlide[];
  className?: string;
}

export function SolarSiteCarousel({ slides, className }: SolarSiteCarouselProps) {
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    containScroll: 'trimSnaps',
    duration: prefersReducedMotion ? 0 : 22,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  if (slides.length === 0) return null;

  const active = slides[selectedIndex] ?? slides[0];
  const activeMeta = active?.provider ? getSourceMeta(active.provider) : null;

  return (
    <div
      className={cn('relative', className)}
      data-testid="solar-site-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Solar sites"
    >
      {/* Slide track */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((s, i) => (
            <div
              key={s.key}
              className="min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${s.caption} (${i + 1} of ${slides.length})`}
            >
              {s.node}
            </div>
          ))}
        </div>
      </div>

      {/* Caption + source badge + edge chevrons */}
      <div className="mt-1.5 flex items-center justify-between px-1">
        <button
          type="button"
          aria-label="Previous site"
          onClick={() => scrollTo(selectedIndex - 1)}
          disabled={!canPrev}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/70 transition-opacity',
            canPrev ? 'opacity-100 hover:text-foreground' : 'opacity-0 pointer-events-none',
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>

        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {activeMeta && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ring-1',
                activeMeta.className,
              )}
              title={activeMeta.verification}
            >
              <activeMeta.icon className="h-2.5 w-2.5" />
              {activeMeta.label}
            </span>
          )}
          <span>{active?.caption}</span>
        </div>

        <button
          type="button"
          aria-label="Next site"
          onClick={() => scrollTo(selectedIndex + 1)}
          disabled={!canNext}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/70 transition-opacity',
            canNext ? 'opacity-100 hover:text-foreground' : 'opacity-0 pointer-events-none',
          )}
        >
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      {/* Pagination dots */}
      <div className="mt-1 flex items-center justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            aria-label={`Go to ${s.caption}`}
            aria-current={i === selectedIndex}
            onClick={() => scrollTo(i)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === selectedIndex
                ? 'w-4 bg-primary'
                : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60',
            )}
          />
        ))}
      </div>
    </div>
  );
}
