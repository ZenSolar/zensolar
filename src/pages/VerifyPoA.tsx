/**
 * Public Receipt — `/verify/:poa`
 *
 * This route is the unified, public face of every ZenSolar mint. Previously
 * Proof-of-Genesis (owner) and Proof-of-Authenticity (public) lived as two
 * separate pages; now they share the same brand shell so there is exactly
 * ONE share URL per mint and the tamper-evident proof is a prominent,
 * impossible-to-miss section instead of a tiny corner stamp.
 *
 *   - No auth required
 *   - Wallet address & PII are masked
 *   - Owner-only actions are hidden
 *   - The TamperEvidentProofPanel handles all verification UI
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, Zap, Flame, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { TamperEvidentProofPanel } from '@/components/proof/TamperEvidentProofPanel';
import { ProofOfAuthenticityStamp } from '@/components/proof/ProofOfAuthenticityStamp';

type Receipt = {
  found: boolean;
  is_valid?: boolean;
  chain_hash?: string;
  chain_seq?: number;
  tx_hash?: string;
  block_number?: string | null;
  action?: string;
  tokens_minted?: number | string;
  kwh_delta?: number | string | null;
  miles_delta?: number | string | null;
  status?: string;
  created_at?: string;
};

// ----- Tokenomics constants (mirror src/lib/tokenomics) ---------------------
const USER_SHARE = 0.75;
// U.S. EIA grid average kg CO₂ per kWh (also used on PoG owner page)
const GRID_KG_PER_KWH = 0.709;

function maskWallet(): string {
  // We intentionally never return wallet on the public RPC, so just placeholder
  return '0x••••••••••••••••••••';
}

function fmt(n: number, digits = 1): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function VerifyPoA() {
  const { poa } = useParams<{ poa: string }>();
  const [data, setData] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  const isHexHash = !!poa && /^[a-f0-9]{64}$/i.test(poa);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!poa || !isHexHash) { setData(null); setLoading(false); return; }
      const { data: rpcData, error } = await supabase.rpc('get_mint_receipt', {
        _chain_hash: poa.toLowerCase(),
      });
      if (cancelled) return;
      if (error) { setData({ found: false }); setLoading(false); return; }
      setData(rpcData as Receipt);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [poa, isHexHash]);

  const short = poa?.slice(0, 7) ?? '';

  const stats = useMemo(() => {
    const tokens = Number(data?.tokens_minted ?? 0);
    const kwh = Number(data?.kwh_delta ?? 0);
    const miles = Number(data?.miles_delta ?? 0);
    // tokens_minted is the 75% user share; reconstruct grand total for context
    const grossTokens = tokens > 0 ? tokens / USER_SHARE : 0;
    const burned = grossTokens * 0.20;
    const co2KgAvoided = kwh > 0 ? kwh * GRID_KG_PER_KWH : 0;
    return { tokens, kwh, miles, grossTokens, burned, co2KgAvoided };
  }, [data]);

  return (
    <>
      <SEO
        title={`Verify ${short} — ZenSolar Receipt`}
        description="Public, tamper-evident verification of a ZenSolar mint. SHA-256 hash-chained per user, Merkle-anchored on Base."
        url={`https://beta.zen.solar/verify/${poa}`}
      />

      <div className="min-h-[100svh] bg-background pb-16">
        <div className="container max-w-3xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> ZenSolar
          </Link>

          {/* ===== Hero: brand-matched to the owner Proof-of-Genesis page ===== */}
          <header className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-accent-warm/10 p-6 sm:p-8 mb-6">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-5">
              <div className="space-y-3 min-w-0 flex-1">
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px] uppercase tracking-[0.16em]">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Public Verification · No Account Needed
                </Badge>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
                  Proof-of-Genesis™ Receipt
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-snug max-w-2xl">
                  This is a verified ZenSolar mint receipt. Every $ZSOLAR token shown was earned
                  from real, signed energy readings — and the entire receipt is hash-chained and
                  Merkle-anchored on Base, so you can re-verify it independently below.
                </p>
                <div className="font-mono text-2xl sm:text-3xl font-bold text-primary tracking-tight pt-1">
                  {short}
                </div>
              </div>
              {isHexHash && (
                <div className="shrink-0 self-center sm:self-start">
                  <ProofOfAuthenticityStamp
                    poaHashShort={short}
                    poaHashFull={poa!}
                    issuedAt={data?.created_at ?? new Date().toISOString()}
                    variant="stamp"
                  />
                </div>
              )}
            </div>
          </header>

          {!isHexHash ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-sm text-muted-foreground">
              That verification link is invalid. Receipt hashes are 64-character SHA-256 hex.
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
              Loading receipt…
            </div>
          ) : !data?.found ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-center text-sm text-muted-foreground">
              No mint found with this receipt hash.
            </div>
          ) : (
            <div className="space-y-6">
              {/* ===== Receipt headline numbers ===== */}
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile
                  Icon={Sparkles}
                  label="$ZSOLAR minted"
                  value={fmt(stats.tokens, 4)}
                  sub={stats.grossTokens > 0 ? `of ${fmt(stats.grossTokens, 0)} gross` : undefined}
                  accent="text-primary"
                />
                <StatTile
                  Icon={Zap}
                  label="Energy verified"
                  value={fmt(stats.kwh, 2)}
                  sub="kWh"
                  accent="text-amber-400"
                />
                {stats.miles > 0 ? (
                  <StatTile
                    Icon={Zap}
                    label="EV miles"
                    value={fmt(stats.miles, 0)}
                    sub="driven"
                    accent="text-green-400"
                  />
                ) : (
                  <StatTile
                    Icon={Flame}
                    label="Burned"
                    value={fmt(stats.burned, 2)}
                    sub="20% of mint"
                    accent="text-destructive"
                  />
                )}
                <StatTile
                  Icon={ShieldCheck}
                  label="CO₂ displaced"
                  value={fmt(stats.co2KgAvoided, 1)}
                  sub="kg vs U.S. grid"
                  accent="text-eco"
                />
              </section>

              {/* ===== Metadata strip ===== */}
              <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Meta label="Receipt #" value={`${data.chain_seq ?? '—'}`} />
                  <Meta label="Status" value={data.status ?? '—'} />
                  <Meta label="Block" value={data.block_number ?? 'Pending'} />
                  <Meta
                    label="Minted at"
                    value={data.created_at
                      ? new Date(data.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                      : '—'}
                  />
                  <Meta label="Wallet" value={maskWallet()} mono />
                  {data.tx_hash && (
                    <Meta label="Tx" value={`${data.tx_hash.slice(0, 10)}…${data.tx_hash.slice(-6)}`} mono />
                  )}
                </div>
                <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3 w-3" />
                  Wallet address is masked on the public view — the receipt owner can see it from their dashboard.
                </p>
              </section>

              {/* ===== THE proof section — promoted from corner stamp to first-class ===== */}
              <TamperEvidentProofPanel
                chainHash={poa!}
                txHashFallback={data.tx_hash ?? null}
                variant="standalone"
              />

              <p className="text-[10px] text-muted-foreground italic text-center pt-2">
                Patent-pending. App. 19/634,402. SEGI™, Mint-on-Proof™, Proof-of-Delta™,
                Proof-of-Origin™, Proof-of-Permanence™, Proof-of-Authenticity™,
                Proof-of-Genesis™ are trademarks of ZenCorp Inc.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatTile({
  Icon, label, value, sub, accent,
}: { Icon: typeof Zap; label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl sm:text-2xl font-bold tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold text-foreground/90 mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}
