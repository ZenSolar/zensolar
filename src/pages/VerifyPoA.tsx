import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Anchor, Hash, Fingerprint, Sparkles, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

/**
 * Public verification page — `/verify/:poa`
 *
 * No auth, no gate. Anyone with a Proof-of-Authenticity™ hash can verify
 * the underlying mint, device, and Proof-of-Permanence™ anchor.
 *
 * Phase 1: mocked lookup. Phase 1.5: edge function `GET /verify/:poa`.
 */

// Mock lookup — Phase 1.5 will replace with edge function call
const MOCK = {
  found: true,
  poaShort: 'a3f5b2e',
  mintTxHash: '0xa3f5b2e9c8d471a6b9e0d3f5a8c2b1e4d7f0a3c6b9e2d5f8a1c4b7e0d3f6a9c2',
  blockNumber: '24,891,302',
  mintedAt: '2026-04-23T18:42:11Z',
  tokensMinted: 47.32,
  totalKwh: 14.2,
  deltaProof: '0x7d3e9c1f4a8b2e6d5c9f0a3b7e1d4c8f2a5b9e0d3c6f1a4b7e0d3c6f9a2b5e8',
  originDeviceHash: '0x4a7c1e9d8b2f5e0c3a6b9d2f5e8c1a4b7d0e3f6a9c2b5e8d1f4a7c0e3b6d9f2',
  permanenceRoot: '0x9c4e7b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6',
  permanenceAnchoredAt: '2026-04-24T00:00:00Z',
  segiProvider: 'Enphase Enlighten',
  deviceLabel: 'Enphase Envoy 7821',
};

export default function VerifyPoA() {
  const { poa } = useParams<{ poa: string }>();
  const data = MOCK; // Phase 1.5: fetch by `poa`

  return (
    <>
      <SEO
        title={`Verify ${poa?.slice(0, 7)} — ZenSolar Proof-of-Authenticity™`}
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
              {poa?.slice(0, 7) ?? data.poaShort}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This hash uniquely identifies one verified mint. Below is every cryptographic primitive
              that produced it — bound to a physical device, anchored on Base L2.
            </p>
          </header>

          {!data.found ? (
            <Card className="border-destructive/30">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No mint found with this Proof-of-Authenticity™ hash.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Mint summary */}
              <Card className="border-primary/30 bg-primary/[0.04]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-eco" />
                    Mint-on-Proof™
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Tokens minted" value={`${data.tokensMinted} $ZSOLAR`} />
                  <Stat label="Energy verified" value={`${data.totalKwh} kWh`} />
                  <Stat label="Block" value={data.blockNumber} />
                  <Stat
                    label="Minted at"
                    value={new Date(data.mintedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  />
                </CardContent>
              </Card>

              <ProofRow
                icon={Hash}
                tm="Proof-of-Delta™"
                label="Hash chain proof"
                value={data.deltaProof}
                accent="text-primary"
              />
              <ProofRow
                icon={Fingerprint}
                tm="Proof-of-Origin™"
                label={`Device hash (${data.deviceLabel})`}
                value={data.originDeviceHash}
                accent="text-secondary"
              />
              <ProofRow
                icon={Anchor}
                tm="Proof-of-Permanence™"
                label={`Eternal Ledger root · anchored ${new Date(
                  data.permanenceAnchoredAt,
                ).toLocaleDateString()}`}
                value={data.permanenceRoot}
                accent="text-amber-400"
              />

              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                  <a
                    href={`https://basescan.org/tx/${data.mintTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View mint transaction on Basescan
                  </a>
                </Button>
              </div>

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
