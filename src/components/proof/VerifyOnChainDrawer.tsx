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
}: {
  icon: typeof Hash;
  tm: string;
  label: string;
  value: string;
  description: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <div className={`mt-0.5 h-7 w-7 rounded-md bg-muted/50 flex items-center justify-center shrink-0`}>
            <Icon className={`h-3.5 w-3.5 ${accent}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
              <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${accent} border-current/30`}>
                {tm}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-snug mt-1">{description}</p>
          </div>
        </div>
      </div>
      <div className="pl-9">
        <CopyChip value={value} label={label} />
      </div>
    </div>
  );
}

export function VerifyOnChainDrawer({ data, trigger }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Verify on-chain
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[88vh] sm:h-[80vh] overflow-y-auto rounded-t-2xl bg-background border-border/60"
      >
        <SheetHeader className="text-left space-y-2 mb-4">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verify on-chain
          </SheetTitle>
          <SheetDescription className="text-sm">
            Every primitive that produced this mint, exposed for public verification.
          </SheetDescription>
        </SheetHeader>

        {/* PoA face hash */}
        <div className="rounded-lg border border-primary/40 bg-primary/[0.06] p-3 mb-4">
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
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="space-y-2.5">
          <TmRow
            icon={Hash}
            tm="Proof-of-Delta™"
            label="Incremental verification"
            value={data.deltaProof}
            description="SHA-256 hash chain proving this mint represents only new, never-before-tokenized activity."
            accent="text-primary"
          />
          <TmRow
            icon={Fingerprint}
            tm="Proof-of-Origin™"
            label="Device-bound hash"
            value={data.originDeviceHash}
            description="keccak256(manufacturer_id + device_id) — bound to physical hardware, not your account."
            accent="text-secondary"
          />
          <TmRow
            icon={Sparkles}
            tm="Mint-on-Proof™"
            label="Mint transaction"
            value={data.mintTxHash}
            description={`Atomically minted on Base L2 only after cryptographic proof was validated. Block ${data.blockNumber}.`}
            accent="text-eco"
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
          />

          {/* SEGI + Tap-to-Mint provenance */}
          <div className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Provenance</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">SEGI™ Source</div>
                <div className="text-foreground/90 font-medium mt-0.5">{data.segiProvider}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trigger</div>
                <div className="text-foreground/90 font-medium mt-0.5">
                  {data.tapToMint ? 'Tap-to-Mint™' : 'Auto-verified'}
                </div>
              </div>
            </div>
          </div>

          {data.explorerUrl && (
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                <a href={data.explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
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
