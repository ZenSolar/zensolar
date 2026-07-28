import { useEffect, useState, useId } from "react";

/**
 * ProofChain — structural visualization of the Proof-of-Delta hash chain.
 *
 * HARD RULE: this component renders structural labels ONLY. No currency, no
 * balances, no minted totals, no counters. Do not add props for any of those.
 *
 * device → Δ → SHA-256(device_id ‖ ts ‖ Δ ‖ prev_hash) → proof_n
 */
export function ProofChain({ compact = false }: { compact?: boolean }) {
  const gradId = useId();
  const [tick, setTick] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = () => setReduced(mq.matches);
    mq.addEventListener?.("change", listener);
    if (mq.matches) return () => mq.removeEventListener?.("change", listener);
    const id = window.setInterval(() => setTick((t) => (t + 1) % 4), 3000);
    return () => {
      window.clearInterval(id);
      mq.removeEventListener?.("change", listener);
    };
  }, []);

  const w = compact ? 320 : 560;
  const h = compact ? 120 : 220;
  const cy = h / 2;

  // Four nodes: device, delta, hash-op, proof (and a trailing proof that fades in).
  const positions = [0.08, 0.32, 0.58, 0.82, 1.02].map((p) => p * w);
  const nodeSize = compact ? 22 : 30;

  const labels = ["device", "Δ", "SHA-256(device_id ‖ ts ‖ Δ ‖ prev_hash)", "proofₙ", "proofₙ₊₁"];
  const strokeW = 1.5;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "#121417",
        borderColor: "#1B1E22",
      }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height="auto"
        role="img"
        aria-label="Proof-of-Delta hash chain: device to delta to SHA-256 to chained proof."
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00E19B" />
            <stop offset="100%" stopColor="#00C2FF" />
          </linearGradient>
          <linearGradient id={`${gradId}-fade`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00E19B" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#00E19B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00C2FF" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* connecting lines */}
        {positions.slice(0, -1).map((x, i) => {
          const x2 = positions[i + 1];
          const isActive = !reduced && i === tick;
          return (
            <line
              key={i}
              x1={x + nodeSize / 2}
              y1={cy}
              x2={x2 - nodeSize / 2}
              y2={cy}
              stroke={isActive ? `url(#${gradId})` : "#2A2D31"}
              strokeWidth={isActive ? 2 : 1}
              style={{
                transition: "stroke 300ms ease-out, stroke-width 300ms ease-out",
              }}
            />
          );
        })}

        {/* nodes */}
        {positions.map((x, i) => {
          const isEmerging = i === 4;
          const opacity = isEmerging ? (reduced ? 0.5 : 0.15 + (tick / 3) * 0.7) : 1;
          const isPulse = !reduced && i === 2 && tick === 2;
          return (
            <g
              key={i}
              transform={`translate(${x} ${cy})`}
              opacity={opacity}
              style={{ transition: "opacity 300ms ease-out" }}
            >
              <NodeShape kind={nodeKind(i)} size={nodeSize} pulse={isPulse} strokeUrl={`url(#${gradId})`} strokeW={strokeW} />
            </g>
          );
        })}

        {/* labels */}
        {positions.slice(0, -1).map((x, i) => (
          <text
            key={i}
            x={x}
            y={cy + nodeSize + (compact ? 16 : 22)}
            fill="#8B9198"
            fontSize={compact ? 9 : 11}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            {truncate(labels[i], compact)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function nodeKind(i: number): "hex" | "diamond" | "rect" | "circle" {
  if (i === 0) return "hex";
  if (i === 1) return "diamond";
  if (i === 2) return "rect";
  return "circle";
}

function truncate(label: string, compact: boolean): string {
  if (!compact) return label;
  if (label.length <= 14) return label;
  return label.slice(0, 12) + "…";
}

function NodeShape({
  kind,
  size,
  pulse,
  strokeUrl,
  strokeW,
}: {
  kind: "hex" | "diamond" | "rect" | "circle";
  size: number;
  pulse: boolean;
  strokeUrl: string;
  strokeW: number;
}) {
  const s = size;
  const common = {
    fill: "#0A0C0E",
    stroke: strokeUrl,
    strokeWidth: strokeW,
    style: pulse
      ? { filter: "drop-shadow(0 0 6px #00E19B)", transition: "filter 400ms ease-out" }
      : { transition: "filter 400ms ease-out" },
  } as const;
  if (kind === "hex") {
    const pts = hexPoints(s / 2);
    return <polygon points={pts} {...common} />;
  }
  if (kind === "diamond") {
    return <polygon points={`0,${-s / 2} ${s / 2},0 0,${s / 2} ${-s / 2},0`} {...common} />;
  }
  if (kind === "rect") {
    return <rect x={-s / 1.4} y={-s / 2} width={s * 1.4} height={s} rx={4} {...common} />;
  }
  return <circle r={s / 2} {...common} />;
}

function hexPoints(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
  }
  return pts.join(" ");
}
