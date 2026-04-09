import { useId } from 'react';

export function DashboardHexBackground() {
  const baseId = useId().replace(/:/g, '');
  const patternId = `${baseId}-hex-grid`;
  const washId = `${baseId}-hex-wash`;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(circle at 50% 14%, hsl(var(--secondary) / 0.14), transparent 28%)',
            'radial-gradient(circle at 50% 46%, hsl(var(--primary) / 0.08), transparent 42%)',
            'linear-gradient(180deg, hsl(var(--background) / 0.92) 0%, hsl(var(--background)) 100%)',
          ].join(', '),
        }}
      />

      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <pattern id={patternId} width="108" height="94" patternUnits="userSpaceOnUse">
            <path
              d="M27 1L81 1L107 47L81 93L27 93L1 47Z"
              fill="none"
              strokeWidth="1"
              style={{ stroke: 'hsl(var(--primary))', opacity: 0.17 }}
            />
            <path
              d="M27 1L81 1L107 47L81 93L27 93L1 47Z"
              fill="none"
              strokeWidth="2"
              style={{ stroke: 'hsl(var(--secondary))', opacity: 0.04 }}
            />
          </pattern>
          <linearGradient id={washId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.08" />
            <stop offset="45%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
            <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        <rect width="100%" height="100%" fill={`url(#${washId})`} />
      </svg>

      <div
        className="absolute inset-0"
        style={{
          background: [
            'linear-gradient(90deg, hsl(var(--background) / 0.42) 0%, transparent 18%, transparent 82%, hsl(var(--background) / 0.42) 100%)',
            'radial-gradient(circle at 50% 18%, transparent 0%, transparent 52%, hsl(var(--background) / 0.26) 78%, hsl(var(--background) / 0.56) 100%)',
          ].join(', '),
        }}
      />
    </div>
  );
}
