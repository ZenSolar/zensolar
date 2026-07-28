import { useEffect, useState, useId } from "react";

/**
 * ProofChain — structural visualization of the Proof-of-Delta hash chain.
 *
 * HARD RULE: this component renders structural labels ONLY. No currency, no
 * balances, no minted totals, no counters. Do not add props for any of those.
 *
 * device → Δ → SHA-256(device_id ‖ ts ‖ Δ ‖ prev_hash) → proofₙ → proofₙ₊₁ → …
 *
 * Rendering contract: at every animation frame (including first paint), ALL
 * five nodes and their labels render at full legibility. Motion is limited to
 * a single traveling pulse along the connecting lines and a soft glow on the
 * currently-active node. A dimmed, unlabeled partial node at the right edge
 * implies the chain continues — it makes no claim about cadence.
 */
export function ProofChain({ compact = false }: { compact?: boolean }) {
  const gradId = useId();
  const fadeId = useId();
  const [tick, setTick] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const nq = window.matchMedia("(max-width: 640px)");
    const syncNarrow = () => setNarrow(nq.matches);
    syncNarrow();
    nq.addEventListener?.("change", syncNarrow);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = () => setReduced(mq.matches);
    mq.addEventListener?.("change", listener);
    if (mq.matches) {
      return () => {
        mq.removeEventListener?.("change", listener);
        nq.removeEventListener?.("change", syncNarrow);
      };
    }
    const id = window.setInterval(() => setTick((t) => (t + 1) % 5), 1400);
    return () => {
      window.clearInterval(id);
      mq.removeEventListener?.("change", listener);
      nq.removeEventListener?.("change", syncNarrow);
    };
  }, []);

  // Scaled up: the chain is the hero centerpiece. Narrow viewports use a
  // 1:1 viewBox so label type never shrinks below legibility.
  const small = compact || narrow;
  const w = small ? 360 : 620;
  const h = small ? 200 : 300;
  const cy = small ? 78 : 128;

  const positions = (small ? [0.07, 0.245, 0.45, 0.665, 0.845] : [0.07, 0.245, 0.45, 0.665, 0.845]).map(
    (p) => p * w,
  );
  const nodeSize = small ? 26 : 46;
  /** Half-width of each node shape — the hash-op rect is wider than the rest. */
  const halfW = (i: number) => (i === 2 ? nodeSize * 0.72 : nodeSize / 2);

  const labels = ["device", "Δ", "H(x, t, Δ, h₋₁)", "proofₙ", "proofₙ₊₁"];
  const labelFont = small ? 10 : 15;
  const strokeW = small ? 1.5 : 2;

  // Trailing continuation: dimmed partial node past proofₙ₊₁, unlabeled.
  const lastX = positions[positions.length - 1];
  const ghostX = w - nodeSize * 0.9;

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
        aria-label="Proof-of-Delta hash chain: device to delta to hash function to chained proof, continuing onward."
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00E19B" />
            <stop offset="100%" stopColor="#00C2FF" />
          </linearGradient>
          <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2F3338" stopOpacity="1" />
            <stop offset="100%" stopColor="#2F3338" stopOpacity="0" />
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
              strokeWidth={isActive ? strokeW + 0.5 : 1}
              style={{
                transition: "stroke 300ms ease-out, stroke-width 300ms ease-out",
              }}
            />
          );
        })}

        {/* continuation: trailing line fading out into a dimmed partial node */}
        <line
          x1={lastX + nodeSize / 2}
          y1={cy}
          x2={ghostX}
          y2={cy}
          stroke={`url(#${fadeId})`}
          strokeWidth={1}
        />
        <g transform={`translate(${ghostX} ${cy})`} opacity={0.22}>
          <circle
            r={nodeSize / 2}
            fill="#121417"
            stroke="#2F3338"
            strokeWidth={strokeW}
          />
        </g>

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

        {/* labels — one per node, always rendered, centered on a single
            shared baseline directly beneath its node. */}
        {positions.map((x, i) => {
          const label = labels[i];
          const isLong = label.length > 12;
          const baseY = cy + nodeSize / 2 + (small ? 26 : 40);
          return (
            <text
              key={i}
              x={x}
              y={baseY}
              fill={!reduced && i === tick ? "#E8EAED" : "#8B9198"}
              fontSize={isLong ? labelFont - (small ? 1.5 : 1) : labelFont}
              letterSpacing={isLong ? 0.2 : 0.6}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              textAnchor="middle"
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
      filter: pulse ? "drop-shadow(0 0 8px rgba(0, 225, 155, 0.55))" : "none",
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
