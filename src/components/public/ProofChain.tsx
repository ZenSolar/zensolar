import { useEffect, useState, useId } from "react";

/**
 * ProofChain — structural visualization of the Proof-of-Delta hash chain.
 *
 * HARD RULE: this component renders structural labels ONLY. No currency, no
 * balances, no minted totals, no counters. Do not add props for any of those.
 *
 * device → Δ → SHA-256(device_id ‖ ts ‖ Δ ‖ prev_hash) → proofₙ → proofₙ₊₁
 *
 * Rendering contract: at every animation frame (including first paint), ALL
 * five nodes and their labels render at full legibility. Motion is limited to
 * a single traveling pulse along the connecting lines and a soft glow on the
 * currently-active node.
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
    const id = window.setInterval(() => setTick((t) => (t + 1) % 5), 1400);
    return () => {
      window.clearInterval(id);
      mq.removeEventListener?.("change", listener);
    };
  }, []);

  const w = compact ? 320 : 560;
  const h = compact ? 140 : 240;
  const cy = compact ? 58 : 96;

  const positions = [0.09, 0.30, 0.53, 0.76, 0.93].map((p) => p * w);
  const nodeSize = compact ? 22 : 30;

  const labels = ["device", "Δ", "SHA-256(device ‖ ts ‖ Δ ‖ prev)", "proofₙ", "proofₙ₊₁"];
  const labelFont = compact ? 10 : 12;
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
        </defs>

        {/* connecting lines — all visible at rest, active segment lights up */}
        {positions.slice(0, -1).map((x, i) => {
          const x2 = positions[i + 1];
          const isActive = !reduced && i === tick % 4;
          return (
            <line
              key={i}
              x1={x + nodeSize / 2}
              y1={cy}
              x2={x2 - nodeSize / 2}
              y2={cy}
              stroke={isActive ? `url(#${gradId})` : "#2F3338"}
              strokeWidth={isActive ? 2 : 1}
              style={{
                transition: "stroke 300ms ease-out, stroke-width 300ms ease-out",
              }}
            />
          );
        })}

        {/* nodes — all five always fully rendered; active gets a soft glow */}
        {positions.map((x, i) => {
          const isActive = !reduced && i === tick;
          return (
            <g key={i} transform={`translate(${x} ${cy})`}>
              <NodeShape
                kind={nodeKind(i)}
                size={nodeSize}
                pulse={isActive}
                strokeUrl={`url(#${gradId})`}
                strokeW={strokeW}
              />
            </g>
          );
        })}

        {/* labels — one per node, always rendered */}
        {positions.map((x, i) => {
          const label = labels[i];
          const isLong = label.length > 14;
          // Nudge long middle label up slightly? Keep flat baseline for now.
          const anchor: "start" | "middle" | "end" =
            i === 0 ? "start" : i === positions.length - 1 ? "end" : "middle";
          const dx = i === 0 ? -nodeSize / 2 : i === positions.length - 1 ? nodeSize / 2 : 0;
          return (
            <text
              key={i}
              x={x + dx}
              y={cy + nodeSize + (compact ? 20 : 28)}
              fill={!reduced && i === tick ? "#E8EAED" : "#8B9198"}
              fontSize={isLong ? labelFont - 1 : labelFont}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              textAnchor={anchor}
              style={{ transition: "fill 300ms ease-out" }}
            >
              {label}
            </text>
          );
        })}
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
    fill: "#121417",
    stroke: strokeUrl,
    strokeWidth: pulse ? strokeW + 0.5 : strokeW,
    style: {
      filter: pulse ? "drop-shadow(0 0 6px rgba(0, 225, 155, 0.55))" : "none",
      transition: "filter 300ms ease-out, stroke-width 300ms ease-out",
    },
  } as const;
  if (kind === "hex") {
    return <polygon points={hexPoints(s / 2)} {...common} />;
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
