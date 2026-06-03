// @vitest-environment jsdom
/**
 * End-to-end-ish coverage for the /investor → /demo handoff.
 *
 * What we are guarding:
 *   1. When a visitor lands on `/demo?demo=investor` AND has the long-lived
 *      `zs_investor_pass` (proof they cleared PIN + NDA on /investor), the
 *      DemoAccessGate must render its `children` immediately — no PIN prompt,
 *      no NDA modal.
 *   2. When that pass is missing, the gate must NOT render the demo content
 *      (it falls back to its normal locked / NDA flow).
 *
 * We mount the *real* `DemoAccessGate` against jsdom with `?demo=investor`
 * in the URL and assert on the rendered DOM, which is the user-observable
 * contract that the live investor flow depends on.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

import { writeInvestorPass, clearInvestorPass } from '@/lib/investorPass';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0`;
    });
  // jsdom location.search is read by the gate at mount; reset it.
  window.history.replaceState({}, '', '/demo?demo=investor');
});

// Mock heavy / browser-only deps the gate pulls in.
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

vi.mock('@/lib/demoEntryFallbackAudio', () => ({
  armDemoEntryFallbackGestureAudio: vi.fn(),
  playDemoEntryFallbackRevealAudio: vi.fn(),
  preloadDemoEntryFallbackAudio: vi.fn(),
  stopDemoEntryFallbackHum: vi.fn(),
}));

vi.mock('@/hooks/useMintSound', () => ({
  getSafeAudioStartTime: vi.fn(() => 0),
  getSharedAudioContext: vi.fn(() => null),
  IMMEDIATE_SOUND_LEAD: 0,
  runWhenAudioContextRunning: (_ctx: unknown, fn: () => void) => fn(),
  useMintSound: () => ({ play: vi.fn(), preload: vi.fn() }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

// Stub the heavier visual children so we don't pull the entire dashboard tree
// into the test renderer.
vi.mock('@/components/demo/AudioDebugOverlay', () => ({ AudioDebugOverlay: () => null }));
vi.mock('@/components/demo/DemoGateDiagnosticsOverlay', () => ({ DemoGateDiagnosticsOverlay: () => null }));
vi.mock('@/components/demo/HumLoopDiagnostics', () => ({ HumLoopDiagnosticsOverlay: () => null }));
vi.mock('@/components/demo/ReleaseAudioDiagnostics', () => ({ ReleaseAudioDiagnostics: () => null }));
vi.mock('@/components/demo/GateHexBackground', () => ({ GateHexBackground: () => null }));
vi.mock('@/components/demo/PreviewBypassBar', () => ({ PreviewBypassBar: () => null }));
vi.mock('@/components/marketing/LiveEarningsCounter', () => ({ LiveEarningsCounter: () => null }));
vi.mock('@/components/demo/NdaSignatureStep', () => ({
  NdaSignatureStep: () => <div data-testid="nda-signature-step">NDA signature step</div>,
}));
vi.mock('@/components/demo/VipWelcomeScreen', () => ({
  VipWelcomeScreen: () => null,
  getVipWelcomeForCode: () => null,
}));

// Import the component AFTER the mocks above are registered.
import { DemoAccessGate } from '@/components/demo/DemoAccessGate';

function renderGate() {
  return render(
    <MemoryRouter initialEntries={['/demo?demo=investor']}>
      <DemoAccessGate>
        <div data-testid="demo-dashboard">DEMO DASHBOARD CONTENT</div>
      </DemoAccessGate>
    </MemoryRouter>,
  );
}

describe('DemoAccessGate · /investor → /demo handoff (e2e)', () => {
  it('renders the demo dashboard directly when an investor pass is present', () => {
    writeInvestorPass({
      email: 'lp@example.com',
      fullName: 'Limited Partner',
      ndaVersion: '1.0',
      signedAt: new Date().toISOString(),
    });

    renderGate();

    // Children are rendered → gate is open, investor flows straight in.
    expect(screen.getByTestId('demo-dashboard')).toBeInTheDocument();
    // The PIN / NDA UI must NOT appear.
    expect(screen.queryByTestId('nda-signature-step')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/access code/i)).not.toBeInTheDocument();
  });

  it('mirrors the pass into zen_demo_access so subsequent visits stay open', () => {
    writeInvestorPass({
      email: 'lp@example.com',
      fullName: 'Limited Partner',
      ndaVersion: '1.0',
      signedAt: new Date().toISOString(),
    });

    renderGate();

    const raw = localStorage.getItem('zen_demo_access');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as { ndaSigned: boolean };
    expect(parsed.ndaSigned).toBe(true);
  });

  it('also grants when `?demo=investor` is present even without an investor pass (public marketing surface)', () => {
    // /investor/pitch's "Live Investor Demo" CTA links to /demo?demo=investor
    // without going through the PIN+NDA flow. That marketing surface must
    // NEVER hit the private access-code gate.
    clearInvestorPass();
    renderGate();

    expect(screen.getByTestId('demo-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('nda-signature-step')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/access code/i)).not.toBeInTheDocument();
    // And we backfill the demo-access payload so a refresh stays clean.
    const raw = localStorage.getItem('zen_demo_access');
    expect(raw).toBeTruthy();
  });
});
