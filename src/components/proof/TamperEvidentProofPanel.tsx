/**
 * TamperEvidentProofPanel
 * -----------------------
 * The unified "Proof-of-Authenticity™" verification block.
 *
 * Used in two places:
 *   1. Inside the Proof-of-Genesis™ receipt (owner view) — promotes
 *      authenticity from a tiny corner stamp into a real, visible section.
 *   2. As the primary content of `/verify/:poa` (public view) — same UI,
 *      same data path, so anyone can independently verify a mint.
 *
 * Why it exists:
 *   Previously the PoA + PoG receipts were two separate pages with the
 *   same purpose ("prove this mint is real"). This panel unifies the
 *   verification logic so there is ONE share URL and ONE visual treatment
 *   for tamper-evident proof — no more "where do I look?" confusion.
 *
 * Data sources (both public, no-auth, anon-key RPCs):
 *   - get_mint_receipt(chain_hash)            → receipt + covering anchor
 *   - get_merkle_inclusion_proof(chain_hash)  → siblings for client-side
 *                                               root recomputation
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Anchor,
  CheckCircle2,
  CircleDashed,
  CopyIcon,
  ExternalLink,
  Fingerprint,
  GitBranch,
  Hash,
  Share2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ReceiptSourceLines } from './ReceiptSourceLines';

// ----- Types (mirror VerifyPoA shape) ---------------------------------------

type Receipt = {
  found: boolean;
  is_valid?: boolean;
  chain_hash?: string;
  chain_prev_hash?: string | null;
  chain_next_hash?: string | null;
  chain_seq?: number;
  tx_hash?: string;
  block_number?: string | null;
  status?: string;
  created_at?: string;
  covering_anchor?: {
    id: string;
    snapshot_at: string;
    merkle_root: string;
    leaf_count: number;
    max_chain_seq_global: number;
    onchain_tx_hash: string | null;
    block_number: string | null;
  } | null;
};

type InclusionSibling = { hash: string; position: 'left' | 'right' };
type InclusionProof = {
  found: boolean;
  reason?: string;
  chain_hash?: string;
  leaf_index?: number;
  leaf_count?: number;
  siblings?: InclusionSibling[];
  computed_root?: string;
  anchor_root?: string;
  root_match?: boolean;
};

type InclusionVerdict = {
  status: 'pending' | 'verified' | 'mismatch' | 'unavailable';
  serverRootMatch?: boolean;
  clientComputedRoot?: string;
  clientRootMatch?: boolean;
  reason?: string;
  proof?: InclusionProof;
};

// ----- Crypto helpers -------------------------------------------------------

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function sha256Concat(a: Uint8Array, b: Uint8Array): Promise<Uint8Array> {
  const combined = new Uint8Array(a.length + b.length);
  combined.set(a, 0);
  combined.set(b, a.length);
  const digest = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(digest);
}
async function recomputeRoot(leaf: string, siblings: InclusionSibling[]): Promise<string> {
  let current = hexToBytes(leaf);
  for (const sib of siblings) {
    const sibBytes = hexToBytes(sib.hash);
    current = sib.position === 'left'
      ? await sha256Concat(sibBytes, current)
      : await sha256Concat(current, sibBytes);
  }
  return bytesToHex(current);
}

// ----- Props ----------------------------------------------------------------

interface Props {
  /** 64-char lowercase hex chain_hash (preferred). If absent and txHashFallback
   *  is given, panel renders the share/copy actions but skips RPC verification. */
  chainHash?: string | null;
  /** Used for the BaseScan link when chain_hash isn't enough on its own. */
  txHashFallback?: string | null;
  /** `compact` hides the long explainer copy. Use when embedding inside the
   *  PoG receipt where surrounding text already sets context. */
  variant?: 'standalone' | 'compact';
  className?: string;
  /** If true, render the "Share public proof page" button (default true). */
  showShareAction?: boolean;
}

// ----- Component ------------------------------------------------------------

export function TamperEvidentProofPanel({
  chainHash,
  txHashFallback,
  variant = 'standalone',
  className,
  showShareAction = true,
}: Props) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [inclusion, setInclusion] = useState<InclusionVerdict>({ status: 'pending' });

  const cleanHash = chainHash?.replace(/^0x/, '').toLowerCase() ?? null;
  const isHexHash = !!cleanHash && /^[a-f0-9]{64}$/i.test(cleanHash);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isHexHash) {
        setReceipt(null);
        setLoading(false);
        setInclusion({ status: 'unavailable', reason: 'no_chain_hash' });
        return;
      }
      const { data: rpcData, error } = await supabase.rpc('get_mint_receipt', {
        _chain_hash: cleanHash!,
      });
      if (cancelled) return;
      if (error) {
        setReceipt({ found: false });
        setInclusion({ status: 'unavailable', reason: 'receipt_lookup_failed' });
        setLoading(false);
        return;
      }
      setReceipt(rpcData as Receipt);
      setLoading(false);

      const { data: proofData, error: proofErr } = await supabase.rpc(
        'get_merkle_inclusion_proof',
        { _chain_hash: cleanHash! },
      );
      if (cancelled) return;
      if (proofErr || !proofData) {
        setInclusion({ status: 'unavailable', reason: 'proof_rpc_failed' });
        return;
      }
      const proof = proofData as InclusionProof;
      if (!proof.found || !proof.siblings || !proof.anchor_root || !proof.chain_hash) {
        setInclusion({ status: 'unavailable', reason: proof.reason ?? 'no_proof' });
        return;
      }
      try {
        const clientRoot = await recomputeRoot(proof.chain_hash, proof.siblings);
        const clientMatch = clientRoot === proof.anchor_root;
        setInclusion({
          status: clientMatch && proof.root_match ? 'verified' : 'mismatch',
          serverRootMatch: proof.root_match,
          clientComputedRoot: clientRoot,
          clientRootMatch: clientMatch,
          proof,
        });
      } catch (e) {
        setInclusion({ status: 'unavailable', reason: `client_hash_failed:${String(e)}` });
      }
    })();
    return () => { cancelled = true; };
  }, [cleanHash, isHexHash]);

  const verifyUrl = isHexHash
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://beta.zen.solar'}/verify/${cleanHash}`
    : null;

  const handleCopy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${label} copied`); }
    catch { toast.error('Could not copy'); }
  };

  const handleShare = async () => {
    if (!verifyUrl) return;
    const text = 'Verify this ZenSolar mint independently — SHA-256 hash-chained, Merkle-anchored on Base.';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ZenSolar Proof-of-Authenticity™', text, url: verifyUrl });
        return;
      }
    } catch { /* user cancelled */ }
    await handleCopy(verifyUrl, 'Public proof link');
  };

  const status: 'ok' | 'fail' | 'pending' | 'unavailable' =
    loading ? 'pending'
    : !receipt?.found ? 'unavailable'
    : receipt.is_valid === false ? 'fail'
    : 'ok';

  const statusMeta = {
    ok:          { Icon: CheckCircle2,  label: 'Tamper-Evident: Verified',   tone: 'border-eco/40 bg-eco/[0.06]',          accent: 'text-eco' },
    fail:        { Icon: XCircle,       label: 'Chain Integrity FAILED',     tone: 'border-destructive/40 bg-destructive/[0.06]', accent: 'text-destructive' },
    pending:     { Icon: CircleDashed,  label: 'Verifying on-chain proof…',  tone: 'border-border/60 bg-card',             accent: 'text-muted-foreground animate-spin' },
    unavailable: { Icon: ShieldCheck,   label: 'Proof not yet anchored',     tone: 'border-border/60 bg-card',             accent: 'text-muted-foreground' },
  }[status];

  return (
    <section className={cn('space-y-3', className)} aria-label="Tamper-evident proof">
      {/* Header banner — instantly communicates what this is */}
      <div className={cn('rounded-2xl border p-4 sm:p-5 flex items-start gap-3', statusMeta.tone)}>
        <div className="shrink-0 mt-0.5">
          <statusMeta.Icon className={cn('h-5 w-5', statusMeta.accent)} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px] uppercase tracking-[0.14em]">
              <ShieldCheck className="h-3 w-3 mr-1" /> Proof-of-Authenticity™
            </Badge>
            <span className="text-sm font-bold text-foreground">{statusMeta.label}</span>
          </div>
          {variant === 'standalone' && (
            <p className="text-[12px] text-muted-foreground leading-snug">
              Every mint is SHA-256 hash-chained per user and anchored as a Merkle root on Base.
              Anyone with the link can re-verify this receipt — no ZenSolar account needed.
            </p>
          )}
          {verifyUrl && (
            <div className="flex flex-wrap gap-2 pt-1.5">
              {showShareAction && (
                <Button size="sm" variant="outline" onClick={handleShare} className="h-8 gap-1.5 text-xs">
                  <Share2 className="h-3.5 w-3.5" /> Share public proof
                </Button>
              )}
              <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
                <Link to={`/verify/${cleanHash}`}>
                  <ExternalLink className="h-3.5 w-3.5" /> Open public verify page
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hash rows — only when we actually have a receipt */}
      {receipt?.found && (
        <div className="space-y-2">
          {receipt.chain_prev_hash && (
            <HashRow icon={Hash}        tm="Previous receipt" label="SHA-256 of the prior mint in this chain"  value={receipt.chain_prev_hash} accent="text-primary"     onCopy={handleCopy} />
          )}
          <HashRow   icon={Fingerprint} tm="This receipt"     label="SHA-256 of (user, tx, action, amounts, ts, prev_hash)" value={receipt.chain_hash ?? '—'} accent="text-secondary" onCopy={handleCopy} highlight />
          {receipt.chain_next_hash && (
            <HashRow icon={Anchor}      tm="Next receipt"     label="SHA-256 of the next mint built on this one" value={receipt.chain_next_hash} accent="text-amber-400" onCopy={handleCopy} />
          )}

          {receipt.covering_anchor && (
            <>
              <HashRow
                icon={Anchor}
                tm="Proof-of-Permanence™"
                label={`Merkle root over ${receipt.covering_anchor.leaf_count} receipts · ${new Date(receipt.covering_anchor.snapshot_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}${receipt.covering_anchor.onchain_tx_hash ? ' · anchored on Base' : ' · DB-anchored (on-chain anchor pending)'}`}
                value={receipt.covering_anchor.merkle_root}
                accent="text-amber-400"
                onCopy={handleCopy}
              />
              {receipt.covering_anchor.onchain_tx_hash && (
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                  <a href={`https://sepolia.basescan.org/tx/${receipt.covering_anchor.onchain_tx_hash}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> View Merkle anchor on Base
                  </a>
                </Button>
              )}
              <InclusionProofCard inclusion={inclusion} />
            </>
          )}

          {(receipt.tx_hash || txHashFallback) && (
            <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
              <a href={`https://sepolia.basescan.org/tx/${receipt.tx_hash ?? txHashFallback}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> View mint transaction on BaseScan
              </a>
            </Button>
          )}
        </div>
      )}

      {/* No on-chain proof yet — still let the user copy the tx hash */}
      {!receipt?.found && !loading && txHashFallback && (
        <Card className="border-border/60">
          <CardContent className="p-3 text-[11px] text-muted-foreground">
            This mint is on-chain but not yet folded into a Merkle anchor snapshot.
            Anchors run on a rolling cadence — check back shortly.
            <div className="mt-2">
              <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                <a href={`https://sepolia.basescan.org/tx/${txHashFallback}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> View transaction on BaseScan
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

// ----- Internal subcomponents ----------------------------------------------

function HashRow({
  icon: Icon, tm, label, value, accent, onCopy, highlight = false,
}: {
  icon: typeof Hash;
  tm: string;
  label: string;
  value: string;
  accent: string;
  onCopy: (v: string, l: string) => void;
  highlight?: boolean;
}) {
  return (
    <Card className={cn('border-border/60', highlight && 'border-primary/40 bg-primary/[0.03]')}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', accent)} />
          <Badge variant="outline" className={cn('text-[10px] border-current/30', accent)}>{tm}</Badge>
          <button
            onClick={() => onCopy(value, tm)}
            className="ml-auto p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            aria-label={`Copy ${tm} hash`}
          >
            <CopyIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="font-mono text-[11px] text-foreground/80 break-all bg-muted/30 rounded p-2">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function InclusionProofCard({ inclusion }: { inclusion: InclusionVerdict }) {
  if (inclusion.status === 'pending') {
    return (
      <Card className="border-border/60">
        <CardContent className="p-3 text-[11px] text-muted-foreground">
          Recomputing Merkle inclusion proof locally…
        </CardContent>
      </Card>
    );
  }
  if (inclusion.status === 'unavailable') {
    return (
      <Card className="border-border/60">
        <CardContent className="p-3 text-[11px] text-muted-foreground">
          Inclusion proof unavailable ({inclusion.reason ?? 'unknown'}).
        </CardContent>
      </Card>
    );
  }
  const ok = inclusion.status === 'verified';
  const proof = inclusion.proof;
  return (
    <Card className={ok ? 'border-eco/40 bg-eco/[0.04]' : 'border-destructive/40 bg-destructive/[0.04]'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {ok ? (
            <><CheckCircle2 className="h-4 w-4 text-eco" /> Merkle inclusion verified in-browser</>
          ) : (
            <><XCircle className="h-4 w-4 text-destructive" /> Merkle inclusion MISMATCH</>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <GitBranch className="h-3 w-3" />
          <span>
            Leaf {proof?.leaf_index} of {proof?.leaf_count} · {proof?.siblings?.length ?? 0} sibling hashes ·
            SHA-256 recomputed by your browser
          </span>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Recomputed root (this browser)
          </div>
          <div className="font-mono text-[11px] text-foreground/80 break-all bg-muted/30 rounded p-2">
            {inclusion.clientComputedRoot}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Anchored root (on-chain)
          </div>
          <div className="font-mono text-[11px] text-foreground/80 break-all bg-muted/30 rounded p-2">
            {proof?.anchor_root}
          </div>
        </div>
        <div className="pt-1 text-muted-foreground italic">
          {ok
            ? 'No database trust required: this proof can be reverified offline against the on-chain anchor.'
            : 'Root mismatch — this receipt does not provably belong to the anchored tree. Treat as suspect.'}
        </div>
      </CardContent>
    </Card>
  );
}
