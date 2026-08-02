/**
 * useSpriteAspect — measures a sprite's intrinsic aspect ratio (w/h) so the
 * scene can auto-fit it into a parking bay instead of letterboxing it inside
 * a fixed box. Returns the fallback until the image has decoded, and caches
 * per-URL so re-renders and second vehicles never re-measure.
 */
import { useEffect, useState } from 'react';
import { DEFAULT_SPRITE_ASPECT } from '@/components/dashboard/carAutoFit';

const cache = new Map<string, number>();

export function useSpriteAspect(src?: string | null): number {
  const [aspect, setAspect] = useState<number>(() =>
    src && cache.has(src) ? (cache.get(src) as number) : DEFAULT_SPRITE_ASPECT,
  );

  useEffect(() => {
    if (!src) {
      setAspect(DEFAULT_SPRITE_ASPECT);
      return;
    }
    const cached = cache.get(src);
    if (cached) {
      setAspect(cached);
      return;
    }
    if (typeof window === 'undefined' || typeof window.Image === 'undefined') {
      return;
    }
    let alive = true;
    const img = new window.Image();
    img.onload = () => {
      if (!alive) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && h > 0) {
        const ratio = w / h;
        cache.set(src, ratio);
        setAspect(ratio);
      }
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  return aspect;
}
