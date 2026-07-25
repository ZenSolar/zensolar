import { ReactNode, useEffect, useRef, useState, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

/**
 * Quiet Current — premium onboarding primitives.
 * Graphite surfaces, emerald→cyan signature gradient, motion as instrumentation.
 * No emoji. No spinners. No bounce. No purple/gold.
 */

// ─── Screen wrapper: cross-fade + upward drift ───────────────────────────────
export function QCScreen({ children, ambient = true }: { children: ReactNode; ambient?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
      className={cn('relative min-h-screen qc-canvas qc-font overflow-hidden', ambient && 'qc-ambient')}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ─── Progress rail (Home · Devices · Proof · Account · Done) ─────────────────
export type QCStage = 'home' | 'devices' | 'proof' | 'account' | 'done';
const STAGES: QCStage[] = ['home', 'devices', 'proof', 'account', 'done'];
export function QCProgress({ stage }: { stage: QCStage }) {
  const idx = STAGES.indexOf(stage);
  return (
    <div className="flex items-center gap-1.5 px-6 pt-5">
      {STAGES.map((s, i) => (
        <div key={s} className="h-[3px] flex-1 rounded-full overflow-hidden qc-elevated">
          <motion.div
            initial={false}
            animate={{ width: i <= idx ? '100%' : '0%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full qc-current-bg"
          />
        </div>
      ))}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────
export function QCHeader({ onBack, right }: { onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between px-6 pt-6 h-14">
      {onBack ? (
        <button
          onClick={onBack}
          className="text-sm qc-muted hover:qc-text transition-colors -ml-1"
          aria-label="Back"
        >
          ← Back
        </button>
      ) : <span className="w-10" />}
      <img
        src={zenLogo}
        alt="ZenSolar"
        className="h-9 w-auto object-contain opacity-90"
      />
      <span className="w-10 text-right">{right}</span>
    </header>
  );
}

// ─── Live pulse indicator ────────────────────────────────────────────────────
export function QCPulse({ className }: { className?: string }) {
  return (
    <span className={cn('inline-block h-2 w-2 rounded-full qc-current-bg qc-pulse', className)} />
  );
}

// ─── Count-up number ─────────────────────────────────────────────────────────
export function QCCountUp({
  value,
  unit,
  decimals = 0,
  duration = 550,
  className,
}: {
  value: number;
  unit?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const from = display;
    const to = value;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    startRef.current = null;
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);
  return (
    <span className={cn('qc-numeric', className)}>
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {unit && <span className="ml-1 text-[0.7em] qc-muted">{unit}</span>}
    </span>
  );
}

// ─── Custom monoline device glyphs ───────────────────────────────────────────
export type QCGlyphName = 'vehicle' | 'solar' | 'battery' | 'charger' | 'signal' | 'home';
export type QCGlyphState = 'idle' | 'active' | 'live' | 'muted';

const GRADIENT_ID = 'qc-glyph-gradient';

export function QCGlyph({
  name,
  state = 'idle',
  size = 40,
  className,
}: {
  name: QCGlyphName;
  state?: QCGlyphState;
  size?: number;
  className?: string;
}) {
  const stroke = state === 'muted' ? '#5A6068' : state === 'idle' ? '#8B9198' : `url(#${GRADIENT_ID})`;
  const path = GLYPH_PATHS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={stroke}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(state === 'live' && 'qc-pulse', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00E19B" />
          <stop offset="1" stopColor="#00C2FF" />
        </linearGradient>
      </defs>
      {path}
    </svg>
  );
}

const GLYPH_PATHS: Record<QCGlyphName, ReactNode> = {
  vehicle: (
    <>
      <path d="M3 14l1.6-4.8A2 2 0 0 1 6.5 8h11a2 2 0 0 1 1.9 1.2L21 14v4h-2v-2H5v2H3v-4z" />
      <circle cx="7" cy="16.5" r="1.4" />
      <circle cx="17" cy="16.5" r="1.4" />
    </>
  ),
  solar: (
    <>
      <path d="M4 5h16l-1.5 10H5.5L4 5z" />
      <path d="M8 5v10M12 5v10M16 5v10M4.5 10h15" />
      <path d="M12 15v4M9 19h6" />
    </>
  ),
  battery: (
    <>
      <rect x="4" y="7" width="15" height="10" rx="1.5" />
      <path d="M19 10v4h2v-4h-2z" />
      <path d="M8 11v2M11 10v4M14 11v2" />
    </>
  ),
  charger: (
    <>
      <path d="M10 3v3M14 3v3" />
      <rect x="8" y="6" width="8" height="7" rx="1.5" />
      <path d="M12 13v3a3 3 0 0 0 3 3h1" />
      <path d="M17 19v2" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9z" />
    </>
  ),
  signal: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8" />
      <path d="M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
    </>
  ),
};

// ─── Primary CTA button ──────────────────────────────────────────────────────
interface QCButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'quiet';
}
export function QCButton({ variant = 'primary', className, children, ...rest }: QCButtonProps) {
  if (variant === 'ghost')
    return (
      <button
        {...rest}
        className={cn(
          'w-full h-12 rounded-xl qc-elevated qc-text text-[15px] font-medium transition-all',
          'border qc-border hover:border-[#3A3F45] disabled:opacity-40',
          className
        )}
      >
        {children}
      </button>
    );
  if (variant === 'quiet')
    return (
      <button
        {...rest}
        className={cn('text-[13px] qc-muted hover:qc-text transition-colors py-2', className)}
      >
        {children}
      </button>
    );
  return (
    <button
      {...rest}
      className={cn(
        'relative w-full h-12 rounded-xl qc-current-border qc-text text-[15px] font-medium',
        'transition-all disabled:opacity-40 disabled:cursor-not-allowed',
        'hover:qc-glow-soft active:translate-y-[1px]',
        'qc-glow-soft',
        className
      )}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export const QCInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      'w-full h-14 px-4 rounded-xl qc-elevated qc-text placeholder:qc-muted',
      'border qc-border outline-none transition-all',
      'focus:border-transparent focus:qc-glow-soft',
      props.className
    )}
  />
);

// ─── Selection card (device picker, no checkbox) ─────────────────────────────
export function QCSelectCard({
  selected,
  glyph,
  label,
  sub,
  onClick,
  disabled,
}: {
  selected: boolean;
  glyph?: QCGlyphName;
  label: string;
  sub?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative w-full text-left p-4 rounded-2xl transition-all duration-200',
        'border qc-elevated',
        selected
          ? 'qc-current-border qc-glow-soft'
          : 'qc-border hover:border-[#3A3F45]'
      )}
    >
      <div className="flex items-center gap-3.5">
        {glyph && <QCGlyph name={glyph} state={selected ? 'active' : 'idle'} size={28} />}
        <div className="flex-1 min-w-0">
          <div className={cn('text-[15px] font-medium', selected ? 'qc-text' : 'qc-text')}>{label}</div>
          {sub && <div className="text-[12px] qc-muted mt-0.5">{sub}</div>}
        </div>
      </div>
    </button>
  );
}

// ─── Loader (pulse, never spinner) ───────────────────────────────────────────
export function QCLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <QCPulse className="h-3 w-3" />
      {label && <span className="text-[13px] qc-muted">{label}</span>}
    </div>
  );
}

// ─── Screen main column ──────────────────────────────────────────────────────
export function QCMain({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn('flex-1 flex flex-col px-6 pt-8 pb-10 max-w-md w-full mx-auto', className)}>
      {children}
    </main>
  );
}

export { AnimatePresence };
