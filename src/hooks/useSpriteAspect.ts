/**
 * useSpriteAspect / useSpriteContentBox — measure a vehicle sprite so the
 * scene can auto-fit it into a parking bay.
 *
 * The vehicle library is exported on SQUARE canvases with a large amount of
 * transparent padding, so the PNG's own aspect ratio (1:1) says nothing about
 * the car inside it. Fitting the canvas to the bay therefore letterboxed every
 * sprite down to a fraction of the parking spot and left it floating off the
 * driveway. We instead scan the alpha channel once per URL and return the
 * OPAQUE content box, so the fit can size and seat the car itself.
 *
 * Results are cached per URL; the fallback box is returned until decode.
 */
import { useEffect, useState } from 'react';
import {
  DEFAULT_CONTENT_BOX,
  DEFAULT_SPRITE_ASPECT,
  type SpriteContentBox,
} from '@/components/dashboard/carAutoFit';

const cache = new Map<string, SpriteContentBox>();
const pending = new Map<string, Promise<SpriteContentBox | null>>();

/** Alpha above which a pixel counts as part of the car. */
const ALPHA_THRESHOLD = 12;
/** Downsample width for the alpha scan — plenty for a bounding box. */
const SCAN_WIDTH = 128;

function measure(src: string): Promise<SpriteContentBox | null> {
  const existing = pending.get(src);
  if (existing) return existing;

  const job = new Promise<SpriteContentBox | null>((resolve) => {
    if (typeof window === 'undefined' || typeof window.Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(null);
    img.onload = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) {
        resolve(null);
        return;
      }
      const boxAspect = iw / ih;
      try {
        const w = Math.min(SCAN_WIDTH, iw);
        const h = Math.max(1, Math.round(w / boxAspect));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve({ left: 0, top: 0, width: 1, height: 1, aspect: boxAspect });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let minX = w;
        let minY = h;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            if (data[(y * w + x) * 4 + 3] > ALPHA_THRESHOLD) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0 || maxY < 0) {
          resolve({ left: 0, top: 0, width: 1, height: 1, aspect: boxAspect });
          return;
        }
        const cw = (maxX - minX + 1) / w;
        const chh = (maxY - minY + 1) / h;
        resolve({
          left: minX / w,
          top: minY / h,
          width: cw,
          height: chh,
          aspect: (cw * iw) / (chh * ih),
        });
      } catch {
        // Tainted canvas or no 2d context — fall back to the whole box.
        resolve({ left: 0, top: 0, width: 1, height: 1, aspect: boxAspect });
      }
    };
    img.src = src;
  }).then((res) => {
    pending.delete(src);
    if (res) cache.set(src, res);
    return res;
  });

  pending.set(src, job);
  return job;
}

/** Opaque content box of a sprite, measured once per URL. */
export function useSpriteContentBox(src?: string | null): SpriteContentBox {
  const [box, setBox] = useState<SpriteContentBox>(() =>
    src && cache.has(src) ? (cache.get(src) as SpriteContentBox) : DEFAULT_CONTENT_BOX,
  );

  useEffect(() => {
    if (!src) {
      setBox(DEFAULT_CONTENT_BOX);
      return;
    }
    const cached = cache.get(src);
    if (cached) {
      setBox(cached);
      return;
    }
    let alive = true;
    void measure(src).then((res) => {
      if (alive && res) setBox(res);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  return box;
}

/** Legacy helper — intrinsic aspect of the sprite's opaque content. */
export function useSpriteAspect(src?: string | null): number {
  const box = useSpriteContentBox(src);
  return box.aspect || DEFAULT_SPRITE_ASPECT;
}
