import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders children only when within `rootMargin` of the viewport.
 * Once visible, the section stays mounted permanently.
 *
 * Notes on scroll stability:
 * - `overflowAnchor: 'none'` prevents Safari from re-anchoring scroll when
 *   sibling lazy sections mount and change height (which was causing /home
 *   to snap back to the top while scrolling).
 * - We pre-mount with a 600px rootMargin so content arrives BEFORE entering
 *   the viewport — the height jump happens off-screen below the user.
 * - `minHeight` defaults to 1px so collapsed placeholders barely contribute
 *   to document height; the expansion happens below the fold.
 */
export function LazySection({
  children,
  rootMargin = '600px 0px',
  minHeight = '1px',
  className,
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        overflowAnchor: 'none',
        contain: 'layout',
        ...(visible ? null : { minHeight }),
      }}
    >
      {visible ? children : null}
    </div>
  );
}
