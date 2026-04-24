import { useParams, Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Fingerprint, Anchor, Hash, Loader2, Cpu, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { VaultPinGate } from '@/components/founders/VaultPinGate';

/**
 * Per-device Proof-of-Origin™ page — `/devices/:deviceId/origin`
 *
 * Founder + PIN gated (Phase 1). Phase 2: open to device owner.
 *
 * Surfaces the keccak256 device hash, cumulative tokenized watermark,
 * Proof-of-Permanence™ anchor history for this device, and a Genesis Anchor™
 * commemorative for the device's first-ever mint.
 */

interface DeviceOriginData {
  deviceId: string;
  deviceLabel: string;
  provider: string;
  deviceHash: string; // keccak256(mfr_id + device_id)
  cumulativeKwh: number;
  cumulativeTokens: number;
  lifetimeMints: number;
  genesisMintTxHash: string;
  genesisMintedAt: string;
  lastPermanenceRoot: string;
  lastPermanenceAnchoredAt: string;
  registryStatus: 'active' | 'frozen' | 'blacklisted';
}

// Phase 1: mock lookup. Phase 1.5: real query against connected_devices + mint_transactions.
const MOCK_DEVICES: Record<string, DeviceOriginData> = {
  'enphase-envoy-7821': {
    deviceId: 'enphase-envoy-7821',
    deviceLabel: 'Enphase Envoy 7821',
    provider: 'Enphase Enlighten',
    deviceHash: '0x4a7c1e9d8b2f5e0c3a6b9d2f5e8c1a4b7d0e3f6a9c2b5e8d1f4a7c0e3b6d9f2',
    cumulativeKwh: 18353.18,
    cumulativeTokens: 61177.27,
    lifetimeMints: 247,
    genesisMintTxHash: '0x8f3c2e9b1d7a4c6f0b3e8d5a2c9f6b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9',
    genesisMintedAt: '2025-11-08T14:22:00Z',
    lastPermanenceRoot: '0x9c4e7b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6',
    lastPermanenceAnchoredAt: '2026-04-24T00:00:00Z',
    registryStatus: 'active',
  },
  'tesla-powerwall-3-A91': {
    deviceId: 'tesla-powerwall-3-A91',
    deviceLabel: 'Tesla Powerwall 3 (A91)',
    provider: 'Tesla Energy',
    deviceHash: '0x9b2e4a7c1f8d3e6b0c5a9f2d7e4b1c8a3f6e9d2c5b8a1f4e7d0c3b6a9f2e5d8',
    cumulativeKwh: 9824.49,
    cumulativeTokens: 32735.0,
    lifetimeMints: 198,
    genesisMintTxHash: '0x2d8f1c5e9b4a7d3f0c6e2b9d5a8c1f4e7b0d3a6c9f2e5b8d1a4c7f0e3b6d9a2',
    genesisMintedAt: '2025-12-15T09:11:00Z',
    lastPermanenceRoot: '0x9c4e7b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6',
    lastPermanenceAnchoredAt: '2026-04-24T00:00:00Z',
    registryStatus: 'active',
  },
};

function DeviceOriginContent({ device }: { device: DeviceOriginData }) {
  return (
    <div className="min-h-[100svh] bg-background pb-12">
      <div className="container max-w-3xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <header className="space-y-3 mb-8">
          <Badge variant="outline" className="border-secondary/40 text-secondary">
            <Fingerprint className="h-3 w-3 mr-1" />
            Proof-of-Origin™
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{device.deviceLabel}</h1>
          <p className="text-sm text-muted-foreground">
            Device-bound watermark registry · {device.provider} ·{' '}
            <span className="text-eco font-medium uppercase">{device.registryStatus}</span>
          </p>
        </header>

        {/* Device hash */}
        <Card className="border-secondary/30 bg-secondary/[0.04] mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-secondary" />
              Device Hash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground mb-2">
              keccak256(manufacturer_id + device_id) — this hash is bound to the physical hardware,
              not your account. If this device ever transfers, the watermark stays.
            </p>
            <div className="font-mono text-[11px] text-foreground/90 break-all bg-muted/40 rounded p-2.5">
              {device.deviceHash}
            </div>
          </CardContent>
        </Card>

        {/* Watermark stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Cumulative kWh" value={device.cumulativeKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} accent="text-energy" />
          <StatCard label="$ZSOLAR Minted" value={device.cumulativeTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} accent="text-primary" />
          <StatCard label="Mints" value={device.lifetimeMints.toString()} accent="text-secondary" />
        </div>

        {/* Genesis Anchor */}
        <Card className="border-amber-400/30 bg-amber-400/[0.04] mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Anchor className="h-4 w-4 text-amber-400" />
              Genesis Anchor™
              <Badge variant="outline" className="text-[9px] border-amber-400/40 text-amber-400">
                First Mint
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              The first-ever mint for this device. Permanently anchored — the moment this device
              entered the Eternal Ledger.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Anchored</div>
                <div className="font-medium mt-0.5">
                  {new Date(device.genesisMintedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
              <div>
                <a
                  href={`https://basescan.org/tx/${device.genesisMintTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-400 hover:underline text-xs"
                >
                  Genesis tx <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="font-mono text-[10px] text-foreground/70 break-all bg-muted/30 rounded p-2 mt-2">
              {device.genesisMintTxHash}
            </div>
          </CardContent>
        </Card>

        {/* Permanence anchor */}
        <Card className="border-border/60 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4 text-amber-400" />
              Latest Proof-of-Permanence™ Anchor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              The most recent Merkle root that includes this device's watermark. Anchored on Base L2 —
              The Eternal Ledger.
            </p>
            <div className="font-mono text-[11px] text-foreground/80 break-all bg-muted/30 rounded p-2">
              {device.lastPermanenceRoot}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Anchored {new Date(device.lastPermanenceAnchoredAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/wallet">Back to Wallet</Link>
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground italic text-center mt-6">
          Patent-pending. App. 19/634,402.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg sm:text-xl font-bold ${accent} mt-1`}>{value}</div>
    </div>
  );
}

export default function DeviceProofOfOrigin() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsFounder(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (cancelled) return;
      const set = new Set((roles ?? []).map((r) => r.role));
      setIsFounder(set.has('founder') || set.has('admin'));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const device = deviceId ? MOCK_DEVICES[deviceId] : undefined;

  if (authLoading || isFounder === null) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isFounder) return <Navigate to="/" replace />;

  if (!device) {
    return (
      <>
        <SEO title="Device not found — Proof-of-Origin™" description="Device not found." url="https://beta.zen.solar/devices" />
        <div className="min-h-[100svh] flex items-center justify-center bg-background p-6">
          <Card className="max-w-sm">
            <CardContent className="p-6 text-center space-y-3">
              <Fingerprint className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No device with id <span className="font-mono">{deviceId}</span> in the registry.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/wallet">Back to Wallet</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${device.deviceLabel} — Proof-of-Origin™`}
        description={`Device-bound watermark registry for ${device.deviceLabel}. Cumulative tokenized energy verified on Base L2.`}
        url={`https://beta.zen.solar/devices/${device.deviceId}/origin`}
      />
      <VaultPinGate userId={user.id}>
        <DeviceOriginContent device={device} />
      </VaultPinGate>
    </>
  );
}
