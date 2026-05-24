import { forwardRef } from 'react';
import { Sparkles, Zap, Leaf, Shield, Car, Sun } from 'lucide-react';

/**
 * ProofOfGenesisShareCard — a fixed-size, beautifully condensed card
 * used ONLY for image capture (Web Share / Save as image).
 *
 * Rendered off-screen at a fixed 1080×1350 (Instagram-portrait ratio) so
 * the resulting PNG is sharp, consistent across devices, and unmistakably
 * a "Proof-of-Genesis pass" — not a screenshot of a long scrolling page.
 *
 * The full receipt page stays rich for viewing; THIS is what people see
 * when the image lands in iMessage / WhatsApp / Twitter / Instagram.
 */
export type ShareCardData = {
  co2Headline: string;          // e.g. "0.42 tons CO₂" or "18.93 kg CO₂"
  co2Sub: string;               // e.g. "avoided vs. average gas car"
  tokensMinted: string;         // e.g. "104.16"
  primaryStatLabel: string;     // "Miles Driven" | "Verified Energy"
  primaryStatValue: string;     // "139" | "30.81"
  primaryStatSuffix: string;    // "mi" | "kWh"
  primarySource: 'solar' | 'battery' | 'ev_charging' | 'mixed';
  provider: string;             // "Tesla Vehicle API"
  deviceLabel: string;          // "tesla-model-y-VIN9XJ"
  mintedAt: string;             // ISO
  txHashShort: string;          // "0xa3f5b2…d3f6a9c2"
  vsBtcKg: number;              // 707
  isLive: boolean;
};

const ICON_FOR_SOURCE = {
  solar: Sun,
  battery: Zap,
  ev_charging: Car,
  mixed: Sun,
} as const;

export const ProofOfGenesisShareCard = forwardRef<HTMLDivElement, { data: ShareCardData }>(
  ({ data }, ref) => {
    const SourceIcon = ICON_FOR_SOURCE[data.primarySource];
    const dateStr = new Date(data.mintedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1350,
          // Inline colors — html2canvas can struggle with CSS variables in
          // off-screen contexts. Keep this card visually self-contained.
          background:
            'radial-gradient(ellipse at top, #0d2818 0%, #050a0a 55%, #000 100%)',
          color: '#fafafa',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: 64,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        {/* Ambient glow accents */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(52,211,153,0.18), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -240,
            left: -160,
            width: 700,
            height: 700,
            background: 'radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* ===== Top: brand row ===== */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(52,211,153,0.15)',
                border: '1px solid rgba(52,211,153,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={28} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: 14, letterSpacing: 4, color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                Proof-of-Genesis™
              </div>
              <div style={{ fontSize: 18, color: '#a1a1aa', marginTop: 2 }}>ZenSolar · Base L2</div>
            </div>
          </div>
          {data.isLive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.4)',
                fontSize: 14,
                fontWeight: 700,
                color: '#34d399',
                letterSpacing: 1.5,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#34d399' }} />
              LIVE MINT
            </div>
          )}
        </div>

        {/* ===== Middle: the headline ===== */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontSize: 20, letterSpacing: 6, color: '#71717a', textTransform: 'uppercase', marginBottom: 24 }}>
            CO₂ Avoided
          </div>
          <div
            style={{
              fontSize: 140,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: -4,
              background: 'linear-gradient(180deg, #6ee7b7 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {data.co2Headline}
          </div>
          <div style={{ fontSize: 26, color: '#d4d4d8', marginTop: 18, fontWeight: 400 }}>
            {data.co2Sub}
          </div>
        </div>

        {/* ===== Stats row: tokens + energy/miles + vs BTC ===== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
            position: 'relative',
          }}
        >
          <StatBlock
            icon={<Zap size={22} color="#34d399" />}
            label="Minted"
            value={data.tokensMinted}
            suffix="$ZSOLAR"
          />
          <StatBlock
            icon={<SourceIcon size={22} color="#34d399" />}
            label={data.primaryStatLabel}
            value={data.primaryStatValue}
            suffix={data.primaryStatSuffix}
          />
          <StatBlock
            icon={<Leaf size={22} color="#34d399" />}
            label="vs. BTC tx"
            value={`~${data.vsBtcKg}`}
            suffix="kg avoided"
          />
        </div>

        {/* ===== Verified source strip ===== */}
        <div
          style={{
            position: 'relative',
            padding: '20px 24px',
            borderRadius: 18,
            border: '1px solid rgba(52,211,153,0.25)',
            background: 'rgba(16,185,129,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Shield size={28} color="#34d399" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, letterSpacing: 3, color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
              Verified Source
            </div>
            <div
              style={{
                fontSize: 22,
                color: '#fafafa',
                fontWeight: 600,
                marginTop: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {data.provider}
            </div>
            <div
              style={{
                fontSize: 16,
                color: '#a1a1aa',
                marginTop: 2,
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {data.deviceLabel} · {dateStr}
            </div>
          </div>
        </div>

        {/* ===== Footer: tx hash + brand ===== */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, letterSpacing: 3, color: '#71717a', textTransform: 'uppercase' }}>Tx</div>
            <div
              style={{
                fontSize: 18,
                color: '#d4d4d8',
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                marginTop: 4,
              }}
            >
              {data.txHashShort}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, letterSpacing: 3, color: '#71717a', textTransform: 'uppercase' }}>Verify</div>
            <div style={{ fontSize: 22, color: '#34d399', fontWeight: 700, marginTop: 2 }}>zen.solar</div>
          </div>
        </div>
      </div>
    );
  },
);
ProofOfGenesisShareCard.displayName = 'ProofOfGenesisShareCard';

function StatBlock({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div
      style={{
        padding: '20px 18px',
        borderRadius: 18,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <span
          style={{
            fontSize: 12,
            letterSpacing: 2,
            color: '#a1a1aa',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 38,
          fontWeight: 800,
          color: '#fafafa',
          lineHeight: 1.05,
          letterSpacing: -1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 14, color: '#71717a', marginTop: 4 }}>{suffix}</div>
    </div>
  );
}
