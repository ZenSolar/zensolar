import { useEffect, useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, Hash, Shield, Sparkles, Fingerprint, Anchor, Hand } from 'lucide-react';
import { Link } from 'react-router-dom';

export type VerifyFocusKey =
  | 'poa'
  | 'tap-to-mint'
  | 'proof-of-delta'
  | 'proof-of-origin'
  | 'mint-on-proof'
  | 'proof-of-permanence';

/**
 * VerifyOnChainDrawer
 *
 * The first-class consumer surface for the full TM stack on a per-mint basis.
 * Surfaces Proof-of-Delta™, Proof-of-Origin™, Mint-on-Proof™, Tap-to-Mint™
 * provenance, the SEGI™ source, and the Proof-of-Permanence™ Merkle anchor.
 *
 * Used as a slide-up drawer on the Proof-of-Genesis™ Receipt.
 */

export interface VerifyOnChainData {
  /** Short PoA hash (7 chars) shown on receipt face */
  poaHashShort: string;
  /** Full PoA hash for the public verify URL */
  poaHashFull: string;
  /** Proof-of-Delta hash chain element */
  deltaProof: string;
  /** Proof-of-Origin device hash (keccak256(mfr_id + device_id)) */
  originDeviceHash: string;
  /** Mint transaction hash on Base L2 */
  mintTxHash: string;
  /** Block number */
  blockNumber: string;
  /** Most recent Proof-of-Permanence™ Merkle root that includes this watermark */
  permanenceRoot: string;
  /** ISO timestamp the Permanence anchor was published on-chain */
  permanenceAnchoredAt: string;
  /** SEGI source provider name */
  segiProvider: string;
  /** Whether the user actively tapped to mint */
  tapToMint: boolean;
  /** Optional explorer URL */
  explorerUrl?: string;
}

interface Props {
  data: VerifyOnChainData;
  trigger?: React.ReactNode;
  /** When provided, drawer opens scrolled to this primitive and highlights it */
  focus?: VerifyFocusKey;
  /** Controlled open state (optional). When omitted, drawer is uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* noop */
        }
      }}
      className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 hover:bg-muted/70 border border-border/50 transition-colors text-[11px] font-mono text-foreground/80"
      aria-label={`Copy ${label}`}
    >
      <span className="truncate max-w-[180px] sm:max-w-[260px]">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-primary shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0" />
      )}
    </button>
  );
}

function TmRow({
  icon: Icon,
  tm,
  label,
  value,
  description,
  accent = 'text-primary',
  focusKey,
  isFocused,
  registerRef,
}: {
  icon: typeof Hash;
  tm: string;
  label: string;
  value: string;
  description: string;
  accent?: string;
  focusKey: VerifyFocusKey;
  isFocused: boolean;
  registerRef: (key: VerifyFocusKey, el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={(el) => registerRef(focusKey, el)}
      data-focus-key={focusKey}
      className={`rounded-lg border bg-card/60 p-3 space-y-2 transition-all duration-300 ${
        isFocused
          ? 'border-primary/70 ring-2 ring-primary/30 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.35)]'
          : 'border-border/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <div className="mt-0.5 h-7 w-7 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
            <Icon className={`h-3.5 w-3.5 ${accent}`} aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
              <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${accent} border-current/30`}>
                {tm}
              </Badge>
            </div>
            <p className="text-[11.5px] text-foreground/70 leading-snug mt-1">{description}</p>
          </div>
        </div>
      </div>
      <div className="pl-9">
        <CopyChip value={value} label={label} />
      </div>
    </div>
  );
}

export function VerifyOnChainDrawer({
  data,
  trigger,
  focus,
  open: openProp,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const refs = useRef<Partial<Record<VerifyFocusKey, HTMLDivElement | null>>>({});
  const registerRef = (key: VerifyFocusKey, el: HTMLDivElement | null) => {
    refs.current[key] = el;
  };

  // When opened with a focus key, scroll the matching row into view
  useEffect(() => {
    if (!open || !focus) return;
    const t = setTimeout(() => {
      const target = refs.current[focus] ?? refs.current.poa ?? null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
    return () => clearTimeout(t);
  }, [open, focus]);

  const focusedKey: VerifyFocusKey | undefined = focus;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Verify on-chain
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[88vh] sm:h-[80vh] overflow-y-auto rounded-t-2xl bg-background border-border/60"
        aria-label="Verify mint on-chain"
      >
        <SheetHeader className="text-left space-y-2 mb-4">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden />
            Verify on-chain
          </SheetTitle>
          <SheetDescription className="text-sm">
            Every primitive that produced this mint, exposed for public verification.
          </SheetDescription>
        </SheetHeader>

        {/* PoA face hash */}
        <div
          ref={(el) => registerRef('poa', el)}
          data-focus-key="poa"
          className={`rounded-lg border bg-primary/[0.06] p-3 mb-4 transition-all duration-300 ${
            focusedKey === 'poa'
              ? 'border-primary/70 ring-2 ring-primary/30'
              : 'border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                Proof-of-Authenticity™
              </div>
              <div className="font-mono text-2xl font-bold text-primary tracking-tight mt-0.5">
                {data.poaHashShort}
              </div>
            </div>
            <Link
              to={`/verify/${data.poaHashFull}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Public verify page
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="space-y-2.5">
          <TmRow
            icon={Hand}
            tm="Tap-to-Mint™"
            label="User intent"
            value={data.tapToMint ? 'Tap confirmed' : 'Auto-verified mint'}
            description="The signature interaction. One tap reads device data, runs the proofs, and mints $ZSOLAR."
            accent="text-primary"
            focusKey="tap-to-mint"
            isFocused={focusedKey === 'tap-to-mint'}
            registerRef={registerRef}
          />
          <TmRow
            icon={Hash}
            tm="Proof-of-Delta™"
            label="Incremental verification"
            value={data.deltaProof}
            description="SHA-256 hash chain proving this mint represents only new, never-before-tokenized activity."
            accent="text-primary"
            focusKey="proof-of-delta"
            isFocused={focusedKey === 'proof-of-delta'}
            registerRef={registerRef}
          />
          <TmRow
            icon={Fingerprint}
            tm="Proof-of-Origin™"
            label="Device-bound hash"
            value={data.originDeviceHash}
            description="keccak256(manufacturer_id + device_id) — bound to physical hardware, not your account."
            accent="text-secondary"
            focusKey="proof-of-origin"
            isFocused={focusedKey === 'proof-of-origin'}
            registerRef={registerRef}
          />
          <TmRow
            icon={Sparkles}
            tm="Mint-on-Proof™"
            label="Mint transaction"
            value={data.mintTxHash}
            description={`Atomically minted on Base L2 only after cryptographic proof was validated. Block ${data.blockNumber}.`}
            accent="text-eco"
            focusKey="mint-on-proof"
            isFocused={focusedKey === 'mint-on-proof'}
            registerRef={registerRef}
          />
          <TmRow
            icon={Anchor}
            tm="Proof-of-Permanence™"
            label="Eternal Ledger anchor"
            value={data.permanenceRoot}
            description={`Merkle root of all device watermarks anchored on-chain at ${new Date(
              data.permanenceAnchoredAt,
            ).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}. The Eternal Ledger.`}
            accent="text-amber-400"
            focusKey="proof-of-permanence"
            isFocused={focusedKey === 'proof-of-permanence'}
            registerRef={registerRef}
          />

          {/* SEGI provenance */}
          <div className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">SEGI™ Source</span>
            </div>
            <div className="text-foreground/90 font-medium text-sm">{data.segiProvider}</div>
          </div>

          {data.explorerUrl && (
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                <a href={data.explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  View on Basescan
                </a>
              </Button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground italic text-center mt-6">
          Patent-pending. App. 19/634,402. All marks are trademarks of ZenCorp Inc.
        </p>
      </SheetContent>
    </Sheet>
  );
}
