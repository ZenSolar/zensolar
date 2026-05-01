import { Profiler, type ReactNode } from 'react';
import { onRenderCallback } from '@/lib/perfProfiler';

/**
 * Dev-only render profiler. In production it returns children unchanged so React's
 * <Profiler> wrapper (which has a small overhead) is stripped from the tree.
 */
export function PerfProbe({ id, children }: { id: string; children: ReactNode }) {
  if (!import.meta.env.DEV) return <>{children}</>;
  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}
