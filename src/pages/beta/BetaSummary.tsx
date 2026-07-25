import { useNavigate } from 'react-router-dom';
import { BetaShell } from './BetaShell';
import { useBetaFlow, type BetaCategory, type BetaStatusState } from '@/hooks/useBetaFlow';
import { QCButton, QCGlyph, type QCGlyphName } from '@/components/onboarding/quiet/QuietCurrent';

/**
 * Done — five status rows (Vehicle, Solar, Battery, Charger, Account).
 * Status is expressed via glyph state, not badges or checkmarks.
 * Enter dashboard triggers the glow handoff via ?fromOnboarding=1.
 */

type Row = { key: BetaCategory | 'account'; label: string; glyph: QCGlyphName };
const ROWS: Row[] = [
  { key: 'vehicle', label: 'Vehicle', glyph: 'vehicle' },
  { key: 'solar', label: 'Solar', glyph: 'solar' },
  { key: 'battery', label: 'Battery', glyph: 'battery' },
  { key: 'charger', label: 'Charger', glyph: 'charger' },
  { key: 'account', label: 'Account', glyph: 'signal' },
];

function statusLabel(row: Row, state?: string): { text: string; tone: 'live' | 'muted' | 'idle' } {
  if (row.key === 'account') {
    if (state === 'secured') return { text: 'Activated', tone: 'live' };
    if (state === 'skipped') return { text: 'Pending', tone: 'muted' };
    return { text: 'Pending', tone: 'muted' };
  }
  if (!state || state === 'not_started') return { text: 'Not connected', tone: 'idle' };
  if (state.startsWith('connected')) return { text: 'Connected', tone: 'live' };
  if (state === 'not_detected') return { text: 'Not detected', tone: 'idle' };
  if (state === 'skipped') return { text: 'Skipped', tone: 'muted' };
  return { text: 'Pending', tone: 'muted' };
}

function retryPath(cat: BetaCategory | 'account'): string {
  if (cat === 'account') return '/onboarding/account';
  if (cat === 'vehicle') return '/onboarding/tesla';
  if (cat === 'solar' || cat === 'battery') return '/onboarding/solar';
  return '/onboarding/charger';
}

export default function BetaSummary() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const accountState = (flow.status as unknown as { account?: { state?: string } }).account?.state;

  const finish = async () => {
    await flow.setStep('done');
    navigate('/?fromOnboarding=1');
  };

  return (
    <BetaShell stage="done" eyebrow="Ready">
      <h1 className="text-[28px] leading-tight font-semibold qc-text mb-2 tracking-tight">
        You're ready.
      </h1>
      <p className="text-[14px] qc-muted mb-7">Here's what's live.</p>

      <ul className="space-y-2 mb-8">
        {ROWS.map((row) => {
          const state = row.key === 'account' ? accountState : flow.status[row.key as BetaCategory]?.state as string | undefined;
          const s = statusLabel(row, state);
          const activeStyle = s.tone === 'live';
          return (
            <li
              key={row.key}
              className={
                'flex items-center justify-between p-4 rounded-xl border qc-elevated ' +
                (activeStyle ? 'qc-current-border' : 'qc-border')
              }
            >
              <div className="flex items-center gap-3">
                <QCGlyph name={row.glyph} state={activeStyle ? 'active' : 'idle'} size={24} />
                <div>
                  <div className="text-[14px] qc-text font-medium">{row.label}</div>
                  <div className={'text-[12px] ' + (activeStyle ? 'qc-current-text' : 'qc-muted')}>
                    {s.text}
                  </div>
                </div>
              </div>
              {!activeStyle && (
                <button
                  onClick={() => navigate(retryPath(row.key))}
                  className="text-[12px] qc-muted hover:qc-text transition-colors"
                >
                  {row.key === 'account' ? 'Secure' : 'Add'}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <QCButton onClick={finish}>Enter dashboard</QCButton>
    </BetaShell>
  );
}
