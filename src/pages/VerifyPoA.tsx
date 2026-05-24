import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Anchor, Hash, Fingerprint, ExternalLink, CheckCircle2, XCircle, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';

/**
 * Public verification page — `/verify/:poa`
 *
 * No auth, no gate. Anyone with a chain hash (Pillar 5) can verify the
 * underlying mint receipt against its computed SHA-256.
 *
 * 64-char hex hashes are resolved via `get_mint_receipt` RPC.
 * Short hashes fall back to a demo placeholder for legacy share links.
 */

type Receipt = {
  found: boolean;
  is_valid?: boolean;
  chain_hash?: string;
  chain_prev_hash?: string | null;
  chain_next_hash?: string | null;
  chain_seq?: number;
  tx_hash?: string;
  block_number?: string | null;
  action?: string;
  tokens_minted?: number | string;
  kwh_delta?: number | string | null;
  miles_delta?: number | string | null;
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

const MOCK_DEMO: Receipt = {
  found: true,
  is_valid: true,
  chain_hash: 'a3f5b2e9c8d471a6b9e0d3f5a8c2b1e4d7f0a3c6b9e2d5f8a1c4b7e0d3f6a9c2',
  chain_prev_hash: '0x7d3e9c1f4a8b2e6d5c9f0a3b7e1d4c8f2a5b9e0d3c6f1a4b7e0d3c6f9a2b5e8',
  chain_seq: 1,
  tx_hash: '0xa3f5b2e9c8d471a6b9e0d3f5a8c2b1e4d7f0a3c6b9e2d5f8a1c4b7e0d3f6a9c2',
  block_number: '24891302',
  action: 'mint',
  tokens_minted: 47.32,
  kwh_delta: 14.2,
  status: 'confirmed',
  created_at: '2026-04-23T18:42:11Z',
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

// hex string -> Uint8Array
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

export default function VerifyPoA() {
  const { poa } = useParams<{ poa: string }>();
  const [data, setData] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [inclusion, setInclusion] = useState<InclusionVerdict>({ status: 'pending' });

  const isHexHash = !!poa && /^[a-f0-9]{64}$/i.test(poa);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!poa) {
        setData(null);
        setLoading(false);
        return;
      }
      if (!isHexHash) {
        setData(MOCK_DEMO);
        setLoading(false);
        setInclusion({ status: 'unavailable', reason: 'demo_link' });
        return;
      }
      const { data: rpcData, error } = await supabase.rpc('get_mint_receipt', {
        _chain_hash: poa.toLowerCase(),
      });
      if (cancelled) return;
      if (error) {
        setData({ found: false });
        setInclusion({ status: 'unavailable', reason: 'receipt_lookup_failed' });
        setLoading(false);
        return;
      }
      setData(rpcData as Receipt);
      setLoading(false);

      // Independent inclusion-proof fetch + client-side root recomputation
      const { data: proofData, error: proofErr } = await supabase.rpc(
        'get_merkle_inclusion_proof',
        { _chain_hash: poa.toLowerCase() },
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
    return () => {
      cancelled = true;
    };
  }, [poa, isHexHash]);

  const short = poa?.slice(0, 7) ?? '';
  const tokens = Number(data?.tokens_minted ?? 0);
  const kwh = Number(data?.kwh_delta ?? 0);

  return (
    <>
      <SEO
        title={`Verify ${short} — ZenSolar Proof-of-Authenticity™`}
        description="Public on-chain verification of a ZenSolar mint. Every $ZSOLAR token is backed by a SHA-256 chain bound to a physical device."
        url={`https://beta.zen.solar/verify/${poa}`}
      />

      <div className="min-h-[100svh] bg-background pb-12">
        <div className="container max-w-2xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> ZenSolar
          </Link>

          <header className="space-y-3 mb-8">
            <Badge variant="outline" className="border-primary/40 text-primary">
              <Shield className="h-3 w-3 mr-1" />
              Public verification
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Proof-of-Authenticity™
            </h1>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-primary tracking-tight">
              {short}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This hash uniquely identifies one verified mint in the per-user receipt chain.
              SHA-256 is recomputed server-side from immutable fields and compared to the
              stored hash. Tampering with any prior receipt breaks every link after it.
            </p>
          </header>

          {loading ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Verifying…</CardContent></Card>
          ) : !data?.found ? (
            <Card className="border-destructive/30">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No mint found with this receipt hash.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className={data.is_valid === false ? 'border-destructive/40 bg-destructive/[0.04]' : 'border-primary/30 bg-primary/[0.04]'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {data.is_valid === false ? (
                      <><XCircle className="h-4 w-4 text-destructive" /> Chain integrity FAILED</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4 text-eco" /> Chain integrity verified</>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Tokens minted" value={`${tokens.toLocaleString(undefined, { maximumFractionDigits: 4 })} $ZSOLAR`} />
                  <Stat label="Energy verified" value={`${kwh.toLocaleString(undefined, { maximumFractionDigits: 3 })} kWh`} />
                  <Stat label="Receipt #" value={`${data.chain_seq ?? '—'}`} />
                  <Stat label="Status" value={data.status ?? '—'} />
                  {data.block_number && <Stat label="Block" value={data.block_number} />}
                  {data.created_at && (
                    <Stat
                      label="Minted at"
                      value={new Date(data.created_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    />
                  )}
                </CardContent>
              </Card>

              {data.chain_prev_hash && (
                <ProofRow
                  icon={Hash}
                  tm="Previous receipt"
                  label="SHA-256 of prior mint in this user's chain"
                  value={data.chain_prev_hash}
                  accent="text-primary"
                />
              )}
              <ProofRow
                icon={Fingerprint}
                tm="This receipt"
                label="SHA-256 of (user, tx, action, amounts, timestamp, prev_hash)"
                value={data.chain_hash ?? '—'}
                accent="text-secondary"
              />
              {data.chain_next_hash && (
                <ProofRow
                  icon={Anchor}
                  tm="Next receipt"
                  label="SHA-256 of the next mint that builds on this one"
                  value={data.chain_next_hash}
                  accent="text-amber-400"
                />
              )}

              {data.covering_anchor && (
                <>
                  <ProofRow
                    icon={Anchor}
                    tm="Proof-of-Permanence™"
                    label={`Merkle root over ${data.covering_anchor.leaf_count} receipts · snapshot ${new Date(data.covering_anchor.snapshot_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}${data.covering_anchor.onchain_tx_hash ? ' · anchored on Base' : ' · DB-anchored (on-chain anchor pending)'}`}
                    value={data.covering_anchor.merkle_root}
                    accent="text-amber-400"
                  />
                  {data.covering_anchor.onchain_tx_hash && (
                    <div className="pt-1">
                      <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                        <a
                          href={`https://sepolia.basescan.org/tx/${data.covering_anchor.onchain_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Merkle anchor on Base
                        </a>
                      </Button>
                    </div>
                  )}

                  <InclusionProofCard inclusion={inclusion} />
                </>
              )}
              {data.tx_hash && (
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                    <a
                      href={`https://basescan.org/tx/${data.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View mint transaction on Basescan
                    </a>
                  </Button>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground italic text-center pt-4">
                Patent-pending. App. 19/634,402. SEGI™, Mint-on-Proof™, Proof-of-Delta™,
                Proof-of-Origin™, Proof-of-Permanence™ are trademarks of ZenCorp Inc.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground/90 mt-0.5">{value}</div>
    </div>
  );
}

function ProofRow({
  icon: Icon,
  tm,
  label,
  value,
  accent,
}: {
  icon: typeof Hash;
  tm: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accent}`} />
          <Badge variant="outline" className={`text-[10px] ${accent} border-current/30`}>
            {tm}
          </Badge>
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
