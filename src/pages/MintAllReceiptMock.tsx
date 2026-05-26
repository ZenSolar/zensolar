import { VerifyPoAContent, type VerifyReceipt } from '@/components/proof/VerifyPoAContent';
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
 * No DB rows are written — the receipt component is rendered with a
 * synthetic VerifyReceipt object via the `mockReceipt` prop.
 */
const MOCK_RECEIPT: VerifyReceipt = {
  found: true,
  is_valid: true,
  chain_hash: 'm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ckm0ck'.replace(/m/g, 'a'),
  chain_seq: 42,
  tx_hash: '0xmint_all_preview_tx_hash_not_a_real_chain_anchor_000000000000',
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

      <VerifyPoAContent poa={MOCK_RECEIPT.chain_hash} mockReceipt={MOCK_RECEIPT} />
    </div>
  );
}
