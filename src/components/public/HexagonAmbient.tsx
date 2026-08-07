/* Quiet Current — hexagon ambient teaser.
   A sparse, low-opacity tessellation that hints at the in-app network
   without competing with the ProofChain hero or the ambient drift layers. */

export function HexagonAmbient() {
  return (
    <div
      className="qc-hexagons pointer-events-none"
      style={{
        opacity: 0.46,
        maskImage:
          "radial-gradient(ellipse 100% 72% at 50% 32%, black 0%, black 58%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 100% 72% at 50% 32%, black 0%, black 58%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="hex-quiet"
            width="104"
            height="90"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M26 1 L51 15.5 L51 44.5 L26 59 L1 44.5 L1 15.5 Z M78 31 L103 45.5 L103 74.5 L78 89 L53 74.5 L53 45.5 Z"
              fill="none"
              stroke="url(#hex-grad)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </pattern>
          <linearGradient id="hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E19B" />
            <stop offset="100%" stopColor="#00C2FF" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-quiet)" />
      </svg>
    </div>
  );
}
