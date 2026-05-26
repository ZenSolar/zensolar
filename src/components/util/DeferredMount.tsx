import { useEffect, useState, type ReactNode } from "react";

/**
 * Mounts children after the browser is idle (or after a small timeout fallback).
 * Used to keep non-critical floating widgets / nudges out of the initial paint.
 */
export function DeferredMount({
  children,
  timeout = 1500,
}: {
  children: ReactNode;
  timeout?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const mount = () => {
      if (!cancelled) setReady(true);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    let handle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (ric) {
      handle = ric(mount, { timeout });
    } else {
      timer = setTimeout(mount, timeout);
    }
    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cic = (window as any).cancelIdleCallback as
        | ((h: number) => void)
        | undefined;
      if (handle != null && cic) cic(handle);
      if (timer) clearTimeout(timer);
    };
  }, [timeout]);

  if (!ready) return null;
  return <>{children}</>;
}
