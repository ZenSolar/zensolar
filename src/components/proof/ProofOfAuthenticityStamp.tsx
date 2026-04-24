import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

/**
 * ProofOfAuthenticityStamp — the visible "notarization" mark on every
 * Proof-of-Genesis™ Receipt. Acts like a passport stamp: short hash on the
 * face, full hash links to the public verify page.
 *
 * Variants:
 *   - "stamp"  → emboss-style circular seal (hero placement)
 *   - "chip"   → compact pill (header / inline)
 *
 * Accessibility:
 *   - Wrapped in <Link> with descriptive aria-label
 *   - Decorative SVG ring marked aria-hidden
 */

interface Props {
  /** Short PoA hash (typically 7 chars) shown on the stamp face */
  poaHashShort: string;
  /** Full PoA hash used to build the public /verify/:poa URL */
  poaHashFull: string;
  /** ISO timestamp the receipt was certified */
  issuedAt: string;
  variant?: 'stamp' | 'chip';
  className?: string;
}

function fmtIssued(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ProofOfAuthenticityStamp({
  poaHashShort,
  poaHashFull,
  issuedAt,
  variant = 'stamp',
  className = '',
}: Props) {
  const verifyHref = `/verify/${poaHashFull}`;
  const a11y = `Proof-of-Authenticity hash ${poaHashShort}, issued ${fmtIssued(
    issuedAt,
  )}. Open public verification page.`;

  if (variant === 'chip') {
    return (
      <Link
        to={verifyHref}
        aria-label={a11y}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-primary/40 bg-primary/[0.08] hover:bg-primary/[0.14] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className}`}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-bold">
          PoA
        </span>
        <span className="font-mono text-[12px] font-bold text-primary tracking-tight">
          {poaHashShort}
        </span>
      </Link>
    );
  }

  // Stamp variant — circular emboss with rotating ring text
  return (
    <Link
      to={verifyHref}
      aria-label={a11y}
      className={`group relative inline-flex items-center justify-center h-[120px] w-[120px] sm:h-[140px] sm:w-[140px] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform hover:scale-[1.02] ${className}`}
    >
      {/* Outer ring with curved text */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full text-primary"
        aria-hidden
      >
        <defs>
          <path
            id="poa-ring-text"
            d="M 100,100 m -82,0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0"
          />
        </defs>
        {/* Outer ring */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
        />
        {/* Inner double ring */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.5"
        />
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.4"
        />
        {/* Curved text — top half */}
        <text
          fill="currentColor"
          fontSize="11"
          fontWeight="700"
          letterSpacing="3.2"
          opacity="0.85"
        >
          <textPath href="#poa-ring-text" startOffset="0%">
            PROOF-OF-AUTHENTICITY™ · ZENSOLAR · CERTIFIED ·
          </textPath>
        </text>
      </svg>

      {/* Inner content */}
      <div className="relative flex flex-col items-center justify-center text-center px-2">
        <ShieldCheck className="h-5 w-5 text-primary mb-0.5" aria-hidden />
        <div className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground font-bold leading-none">
          PoA Hash
        </div>
        <div className="font-mono text-[15px] sm:text-base font-bold text-primary tracking-tight leading-tight mt-0.5">
          {poaHashShort}
        </div>
        <div className="text-[8px] uppercase tracking-wider text-muted-foreground/80 font-medium mt-1 leading-none">
          {fmtIssued(issuedAt)}
        </div>
      </div>

      {/* Subtle hover glow */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/[0.06] transition-colors"
      />
    </Link>
  );
}
