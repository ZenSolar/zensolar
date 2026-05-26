import { VerifyPoAContent, type VerifyReceipt } from '@/components/proof/VerifyPoAContent';
import { type ApiResponse as SourceLinesResponse } from '@/components/proof/ReceiptSourceLines';
import { Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical } from 'lucide-react';

/**
 * Mock Proof-of-Genesis receipt that mirrors the Mint-All confirmation
 * screen the user attached:
 *   Solar         748 kWh → 561 $ZSOLAR
 *   Battery       100 kWh →  75 $ZSOLAR
 *   Home Charging 652 kWh → 489 $ZSOLAR
 *   EV Miles      882 mi  → 661 $ZSOLAR
 *   ─────────────────────────────────
 *   Total       2,382 units → 1,786 $ZSOLAR
 *
 * No DB rows are written — the receipt + child source-line components are
 * rendered with synthetic objects via `mockReceipt` + `mockSourceLines`.
 */
const MOCK_HASH = 'a0cca0cca0cca0cca0cca0cca0cca0cca0cca0cca0cca0cca0cca0cca0cca0cc';

const MOCK_RECEIPT: VerifyReceipt = {
  found: true,
  is_valid: true,
  chain_hash: MOCK_HASH,
  chain_seq: 42,
  tx_hash: '0xa11ce0a11ce0a11ce0a11ce0a11ce0a11ce0a11ce0a11ce0a11ce0a11ce0a11c',
  block_number: '12345678',
  action: 'mint-rewards',
  tokens_minted: 1786,
  // Combined kWh from solar + battery + home charging (EV miles tracked separately)
  kwh_delta: 1500,
  miles_delta: 882,
  source_breakdown: {
    solar_kwh: 748,
    battery_kwh: 100,
    home_charging_kwh: 652,
    ev_miles: 882,
  },
  status: 'confirmed',
  created_at: new Date().toISOString(),
};

// ---- Synthetic Proof-of-Delta lines (one per source, evenly split) ----
const now = Date.now();
const HOUR = 60 * 60 * 1000;

function mkLines(source: string, provider: string, totalKwh: number, count: number) {
  const per = totalKwh / count;
  return Array.from({ length: count }, (_, i) => ({
    source,
    fingerprint: `mock-${source}-${i.toString().padStart(2, '0')}-${'0'.repeat(40)}`.slice(0, 64),
    kwh: Number(per.toFixed(2)),
    occurred_at: new Date(now - (count - i) * HOUR * 3).toISOString(),
    provider,
    device_watermark: `wm-${source.slice(0, 4)}-${i}`,
  }));
}

const MOCK_SOURCE_LINES: SourceLinesResponse = {
  found: true,
  attributed_sources: ['solar', 'bidir_export', 'home_charger', 'ev_miles'],
  window_start: new Date(now - 7 * 24 * HOUR).toISOString(),
  window_end: new Date(now).toISOString(),
  lines: [
    ...mkLines('solar', 'enphase', 748, 6),
    ...mkLines('bidir_export', 'tesla', 100, 2),
    ...mkLines('home_charger', 'tesla', 652, 4),
  ],
  line_count: 12,
};

export default function MintAllReceiptMock() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mock banner */}
      <div className="sticky top-0 z-50 bg-accent-warm/10 border-b border-accent-warm/30 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <Link
            to="/clean-energy-center"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-accent-warm">
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Mock receipt · Mint-All preview</span>
          </div>
          <div className="w-12" />
        </div>
      </div>

      <VerifyPoAContent
        poa={MOCK_HASH}
        mockReceipt={MOCK_RECEIPT}
        mockSourceLines={MOCK_SOURCE_LINES}
      />
    </div>
  );
}
