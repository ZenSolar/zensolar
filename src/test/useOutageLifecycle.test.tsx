// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

const h = vi.hoisted(() => {
  const invoke = vi.fn().mockResolvedValue({ data: null, error: null });
  const insertMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 'evt-1' }, error: null });
  const insertSelect = vi.fn().mockReturnValue({ maybeSingle: insertMaybeSingle });
  const insertFn = vi.fn().mockReturnValue({ select: insertSelect });
  const updateEq = vi.fn().mockResolvedValue({ data: null, error: null });
  const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
  const fromFn = vi.fn((_table: string) => ({
    insert: insertFn,
    update: updateFn,
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
  }));
  const accessRef = { hasAccess: true, reason: 'beta' as const, loading: false, refresh: vi.fn() };
  return { invoke, insertFn, updateFn, updateEq, fromFn, accessRef };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: h.invoke }, from: h.fromFn },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/hooks/useDeasonOutageAccess', () => ({
  useDeasonOutageAccess: () => h.accessRef,
}));

const { invoke, insertFn, updateFn, updateEq, fromFn, accessRef } = h;

import { useOutageLifecycle, type OutageLifecycleInput } from '@/hooks/useOutageLifecycle';

const baseInput = (over: Partial<OutageLifecycleInput> = {}): OutageLifecycleInput => ({
  isGridOutage: false,
  since: null,
  source: 'tesla',
  batteryStats: { soc: 80, capacityKwh: 13.5, powerKw: -2 },
  solarKw: 0,
  primaryBattery: { device_id: 'd1', device_name: 'Powerwall', oem: 'tesla' },
  batteryCount: 1,
  ...over,
});

describe('useOutageLifecycle', () => {
  beforeEach(() => {
    invoke.mockClear();
    insertFn.mockClear();
    updateFn.mockClear();
    updateEq.mockClear();
    fromFn.mockClear();
    accessRef.hasAccess = true;
  });

  it('on outage start: inserts a row, sends push, opens Deason when access', async () => {
    const opened = vi.fn();
    const nudged = vi.fn();
    window.addEventListener('deason:open', opened);
    window.addEventListener('deason:nudge', nudged);

    const { rerender } = renderHook(({ p }: { p: OutageLifecycleInput }) => useOutageLifecycle(p), {
      initialProps: { p: baseInput() },
    });

    await act(async () => {
      rerender({ p: baseInput({ isGridOutage: true, since: new Date() }) });
    });

    expect(fromFn).toHaveBeenCalledWith('grid_outage_events');
    expect(insertFn).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith(
      'send-push-notification',
      expect.objectContaining({
        body: expect.objectContaining({
          user_id: 'user-1',
          title: 'Grid outage detected',
        }),
      }),
    );
    expect(opened).toHaveBeenCalledTimes(1);
    expect(nudged).toHaveBeenCalledTimes(1);

    window.removeEventListener('deason:open', opened);
    window.removeEventListener('deason:nudge', nudged);
  });

  it('without access: sends push but does NOT auto-open Deason', async () => {
    accessRef.hasAccess = false;
    const opened = vi.fn();
    window.addEventListener('deason:open', opened);

    const { rerender } = renderHook(({ p }: { p: OutageLifecycleInput }) => useOutageLifecycle(p), {
      initialProps: { p: baseInput() },
    });
    await act(async () => {
      rerender({ p: baseInput({ isGridOutage: true, since: new Date() }) });
    });

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(opened).not.toHaveBeenCalled();
    window.removeEventListener('deason:open', opened);
  });

  it('on recovery: updates row with ended_at and sends restore push', async () => {
    const start = new Date();
    const { rerender } = renderHook(({ p }: { p: OutageLifecycleInput }) => useOutageLifecycle(p), {
      initialProps: { p: baseInput({ isGridOutage: true, since: start }) },
    });
    // Let insert resolve so eventIdRef is populated.
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      rerender({ p: baseInput({ isGridOutage: false }) });
    });

    expect(updateFn).toHaveBeenCalledTimes(1);
    expect(updateFn.mock.calls[0][0]).toEqual(expect.objectContaining({ ended_at: expect.any(String) }));
    expect(updateEq).toHaveBeenCalledWith('id', 'evt-1');
    const titles = invoke.mock.calls.map((c) => (c[1] as { body: { title: string } }).body.title);
    expect(titles).toContain('Power restored');
  });

  it('re-rendering with same state does not re-fire start side effects', async () => {
    const input = baseInput({ isGridOutage: true, since: new Date() });
    const { rerender } = renderHook(({ p }: { p: OutageLifecycleInput }) => useOutageLifecycle(p), {
      initialProps: { p: input },
    });
    await act(async () => { rerender({ p: { ...input } }); });
    await act(async () => { rerender({ p: { ...input } }); });

    expect(insertFn).toHaveBeenCalledTimes(1);
    // Only the "start" push so far (no long-outage threshold crossed).
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('on recovery: records peak load and deason_interacted=true after user message', async () => {
    const start = new Date();
    const { rerender } = renderHook(({ p }: { p: OutageLifecycleInput }) => useOutageLifecycle(p), {
      initialProps: { p: baseInput({ isGridOutage: true, since: start, homeKw: 3.2 }) },
    });
    await act(async () => { await Promise.resolve(); });

    // User taps Deason and sends a message mid-outage.
    await act(async () => {
      window.dispatchEvent(new CustomEvent('deason:user-message'));
    });

    // Household load spikes higher.
    await act(async () => {
      rerender({ p: baseInput({ isGridOutage: true, since: start, homeKw: 7.4 }) });
    });

    // Recovery
    await act(async () => {
      rerender({ p: baseInput({ isGridOutage: false }) });
    });

    const updatePayload = updateFn.mock.calls.at(-1)?.[0] as {
      peak_load_kw: number;
      deason_interacted: boolean;
    };
    expect(updatePayload.peak_load_kw).toBeGreaterThanOrEqual(7.4);
    expect(updatePayload.deason_interacted).toBe(true);
  });

  it('on recovery: deason_interacted=false when user never sent a message', async () => {
    const start = new Date();
    const { rerender } = renderHook(({ p }: { p: OutageLifecycleInput }) => useOutageLifecycle(p), {
      initialProps: { p: baseInput({ isGridOutage: true, since: start, homeKw: 2 }) },
    });
    await act(async () => { await Promise.resolve(); });
    await act(async () => { rerender({ p: baseInput({ isGridOutage: false }) }); });

    const updatePayload = updateFn.mock.calls.at(-1)?.[0] as { deason_interacted: boolean };
    expect(updatePayload.deason_interacted).toBe(false);
  });

  it('on outage start: nudge carries a contextual assistantSeed with backup label + meta', async () => {
    const nudges: CustomEvent[] = [];
    const handler = (e: Event) => nudges.push(e as CustomEvent);
    window.addEventListener('deason:nudge', handler);

    const { rerender } = renderHook(({ p }: { p: OutageLifecycleInput }) => useOutageLifecycle(p), {
      initialProps: { p: baseInput() },
    });
    await act(async () => {
      rerender({
        p: baseInput({
          isGridOutage: true,
          since: new Date(),
          batteryStats: { soc: 87, capacityKwh: 13.5, powerKw: -0.6 },
          homeKw: 0.6,
        }),
      });
    });

    expect(nudges.length).toBeGreaterThanOrEqual(1);
    const detail = nudges[0].detail as { assistant: string; meta: Record<string, unknown> };
    expect(detail.assistant).toMatch(/Grid outage detected/i);
    expect(detail.assistant).toMatch(/0\.6 kW/);
    expect(detail.meta).toEqual(
      expect.objectContaining({ kind: 'grid_outage', phase: 'start', source: 'tesla' }),
    );
    window.removeEventListener('deason:nudge', handler);
  });
});
