import { useEffect, useId, useState } from "react";

/**
 * ProofChain — structural visualization of the Proof-of-Delta hash chain.
 *
 * HARD RULE: structural labels only. No currency, balances, totals, counters.
 *
 * Motion contract: a single directional pulse travels left→right along the
 * connecting line every ~4s in the signature emerald→cyan gradient. As the
 * pulse crosses each node, that node scales 1 → 1.04 → 1 over 600ms with
 * physics easing. Nothing else moves.
 */
export function ProofChain({ compact = false }: { compact?: boolean }) {
  const gradId = useId();
  const pulseGradId = `${gradId}-pulse`;
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = () => setReduced(mq.matches);
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);

  const w = compact ? 320 : 560;
  const h = compact ? 140 : 240;
  const cy = compact ? 58 : 96;

  const anchors = [0.09, 0.30, 0.53, 0.76, 0.93];
  const positions = anchors.map((p) => p * w);
  const nodeSize = compact ? 22 : 30;
  const labels = ["device", "Δ", "SHA-256(device ‖ ts ‖ Δ ‖ prev)", "proofₙ", "proofₙ₊₁"];
  const labelFont = compact ? 10 : 12;
  const strokeW = 1.5;

  const CYCLE = 4; // seconds
  const NODE_BUMP = 0.6; // seconds

  // Delay each node so its bump peaks as the pulse arrives.
  // Pulse travels from anchor[0] → anchor[last] linearly across CYCLE.
  const span = anchors[anchors.length - 1] - anchors[0];
  const nodeDelays = anchors.map((a) => ((a - anchors[0]) / span) * CYCLE);

  return (
    <div
      className="rounded-2xl border overflow-hidden qc-proofchain"
      style={{ background: "#121417", borderColor: "#1B1E22" }}
    >
      <style>{`
        @keyframes qc-node-bump {
          0%   { transform: scale(1); }
          ${((NODE_BUMP / 2) / CYCLE) * 100}% { transform: scale(1.04); }
          ${(NODE_BUMP / CYCLE) * 100}% { transform: scale(1); }
          100% { transform: scale(1); }
        }
        @keyframes qc-pulse-travel {
          0%   { offset-distance: 0%;   opacity: 0; }
          6%   { opacity: 1; }
          94%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        .qc-node {
          transform-box: fill-box;
          transform-origin: center;
          animation: qc-node-bump ${CYCLE}s cubic-bezier(0.22, 1, 0.36, 1) infinite;
          will-change: transform;
        }
        .qc-pulse {
          offset-path: path('M __PULSE_PATH__');
          offset-rotate: 0deg;
          animation: qc-pulse-travel ${CYCLE}s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: offset-distance, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .qc-node, .qc-pulse { animation: none !important; }
          .qc-pulse { opacity: 0 !important; }
        }
      `.replace(
        "__PULSE_PATH__",
        `${positions[0]} ${cy} L ${positions[positions.length - 1]} ${cy}`,
      )}</style>

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
          <radialGradient id={pulseGradId}>
            <stop offset="0%" stopColor="#7FF5D2" stopOpacity="1" />
            <stop offset="40%" stopColor="#00E19B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00C2FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* static connecting line */}
        <line
          x1={positions[0] + nodeSize / 2}
          y1={cy}
          x2={positions[positions.length - 1] - nodeSize / 2}
          y2={cy}
          stroke="#2A2E33"
          strokeWidth={1}
        />

        {/* nodes — all five always fully rendered, each bumping as pulse passes */}
        {positions.map((x, i) => (
          <g
            key={i}
            className={reduced ? undefined : "qc-node"}
            style={
              reduced
                ? undefined
                : { animationDelay: `${nodeDelays[i] - NODE_BUMP / 2}s` }
            }
            transform={`translate(${x} ${cy})`}
          >
            <NodeShape
              kind={nodeKind(i)}
              size={nodeSize}
              strokeUrl={`url(#${gradId})`}
              strokeW={strokeW}
            />
          </g>
        ))}

        {/* labels */}
        {positions.map((x, i) => {
          const label = labels[i];
          const isLong = label.length > 14;
          const anchor: "start" | "middle" | "end" =
            i === 0 ? "start" : i === positions.length - 1 ? "end" : "middle";
          const dx = i === 0 ? -nodeSize / 2 : i === positions.length - 1 ? nodeSize / 2 : 0;
          return (
            <text
              key={i}
              x={x + dx}
              y={cy + nodeSize + (compact ? 20 : 28)}
              fill="#8B9198"
              fontSize={isLong ? labelFont - 1 : labelFont}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              textAnchor={anchor}
            >
              {label}
            </text>
          );
        })}

        {/* the single traveling pulse — the one moving thing on this page */}
        {!reduced && (
          <g className="qc-pulse">
            <circle
              r={compact ? 9 : 12}
              fill={`url(#${pulseGradId})`}
              opacity={0.55}
            />
            <circle r={compact ? 3 : 4} fill="#B9FBE4" />
          </g>
        )}
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
  strokeUrl,
  strokeW,
}: {
  kind: "hex" | "diamond" | "rect" | "circle";
  size: number;
  strokeUrl: string;
  strokeW: number;
}) {
  const s = size;
  const common = {
    fill: "#121417",
    stroke: strokeUrl,
    strokeWidth: strokeW,
  } as const;
  if (kind === "hex") return <polygon points={hexPoints(s / 2)} {...common} />;
  if (kind === "diamond")
    return <polygon points={`0,${-s / 2} ${s / 2},0 0,${s / 2} ${-s / 2},0`} {...common} />;
  if (kind === "rect")
    return <rect x={-s / 1.4} y={-s / 2} width={s * 1.4} height={s} rx={4} {...common} />;
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
