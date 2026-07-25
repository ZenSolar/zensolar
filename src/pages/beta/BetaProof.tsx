import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BetaShell } from './BetaShell';
import { useBetaFlow, type BetaCategory } from '@/hooks/useBetaFlow';
import {
  QCButton,
  QCCountUp,
  QCGlyph,
  QCPulse,
  type QCGlyphName,
} from '@/components/onboarding/quiet/QuietCurrent';

/**
 * Live Proof — the convergence moment.
 * Each connected category's glyph sits at an edge; thin gradient lines travel
 * inward to a central pulsing node while its number counts up in sync.
 * Kept ~2.5s so it never becomes a loading screen on repeat visits.
 */

const GLYPH: Record<BetaCategory, QCGlyphName> = {
  vehicle: 'vehicle',
  solar: 'solar',
  battery: 'battery',
  charger: 'charger',
};

// Category → visible number (placeholder units; real values come from telemetry hooks
// downstream, but the choreography works with any positive number the user recognizes).
const SAMPLE: Record<BetaCategory, { value: number; unit: string; label: string; decimals?: number }> = {
  solar: { value: 18.4, unit: 'kWh today', label: 'Solar', decimals: 1 },
  battery: { value: 82, unit: '% charge', label: 'Battery' },
  vehicle: { value: 247, unit: 'mi range', label: 'Vehicle' },
  charger: { value: 6.6, unit: 'kW ready', label: 'Charger', decimals: 1 },
};

// Positions around a 320×320 central stage (screen-independent).
const POS: Record<BetaCategory, { x: number; y: number }> = {
  vehicle: { x: 40, y: 60 },
  solar: { x: 280, y: 60 },
  battery: { x: 40, y: 260 },
  charger: { x: 280, y: 260 },
};

export default function BetaProof() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const [phase, setPhase] = useState<'draw' | 'settle'>('draw');

  const connected = useMemo<BetaCategory[]>(() => {
    const cats: BetaCategory[] = ['vehicle', 'solar', 'battery', 'charger'];
    return cats.filter((c) => (flow.status[c]?.state ?? '').startsWith('connected'));
  }, [flow.status]);

  useEffect(() => {
    const t = setTimeout(() => setPhase('settle'), 2200);
    return () => clearTimeout(t);
  }, []);

  const proceed = async () => {
    // mark proof seen inside beta_status blob
    const patch = { ...(flow.status as Record<string, unknown>), proof: { state: 'seen' } };
    await flow.setStatus(patch as never);
    await flow.setStep('account');
    navigate('/onboarding/account');
  };

  const anyConnected = connected.length > 0;

  return (
    <BetaShell stage="proof" eyebrow="Live" ambient={false}>
      <h1 className="text-[28px] leading-tight font-semibold qc-text mb-2 tracking-tight">
        Your home is now one system.
      </h1>
      <p className="text-[14px] qc-muted mb-6">
        Real data, arriving now.
      </p>

      <div className="relative mx-auto" style={{ width: 320, height: 320 }}>
        <svg viewBox="0 0 320 320" width={320} height={320} className="absolute inset-0">
          <defs>
            <linearGradient id="qc-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#00E19B" />
              <stop offset="1" stopColor="#00C2FF" />
            </linearGradient>
            <radialGradient id="qc-core" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#00E19B" stopOpacity="0.9" />
              <stop offset="1" stopColor="#00C2FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {connected.map((c, i) => {
            const { x, y } = POS[c];
            return (
              <motion.line
                key={c}
                x1={x}
                y1={y}
                x2={160}
                y2={160}
                stroke="url(#qc-line)"
                strokeWidth={1.4}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.85 }}
                transition={{ duration: 0.9, delay: 0.35 + i * 0.18, ease: 'easeOut' }}
              />
            );
          })}

          <motion.circle
            cx={160}
            cy={160}
            r={44}
            fill="url(#qc-core)"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: anyConnected ? 1 : 0.4, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.6, ease: 'easeOut' }}
          />
        </svg>

        {/* Edge glyphs */}
        {connected.map((c) => {
          const { x, y } = POS[c];
          return (
            <div
              key={c}
              className="absolute"
              style={{ left: x - 22, top: y - 22, width: 44, height: 44 }}
            >
              <div className="w-full h-full rounded-full qc-elevated qc-current-border flex items-center justify-center">
                <QCGlyph name={GLYPH[c]} state="active" size={22} />
              </div>
            </div>
          );
        })}

        {/* Central pulse */}
        <div className="absolute" style={{ left: 160 - 10, top: 160 - 10 }}>
          <QCPulse className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 mb-8">
        {connected.map((c, i) => {
          const s = SAMPLE[c];
          return (
            <motion.div
              key={c}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.18, duration: 0.4, ease: 'easeOut' }}
              className="rounded-xl qc-elevated border qc-border p-3"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] qc-muted mb-1">{s.label}</div>
              <QCCountUp
                value={s.value}
                unit={s.unit}
                decimals={s.decimals ?? 0}
                className="text-[22px] qc-text"
              />
            </motion.div>
          );
        })}
        {!anyConnected && (
          <div className="col-span-2 rounded-xl qc-elevated border qc-border p-4 text-[13px] qc-muted">
            Nothing connected yet. You can add devices anytime from your account.
          </div>
        )}
      </div>

      <QCButton onClick={proceed} disabled={phase === 'draw'}>
        Secure your account
      </QCButton>
    </BetaShell>
  );
}
