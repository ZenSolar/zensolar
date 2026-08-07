/* Quiet Current — hexagon ambient teaser.
   A sparse, low-opacity tessellation that hints at the in-app network
   without competing with the ProofChain hero or the ambient drift layers. */

export function HexagonAmbient() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        opacity: 0.4,
        maskImage:
          "radial-gradient(circle at 50% 35%, black 0%, black 60%, transparent 95%)",
        WebkitMaskImage:
          "radial-gradient(circle at 50% 35%, black 0%, black 60%, transparent 95%)",
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
            width="92"
            height="160"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1.15)"
          >
            {/* Row A */}
            <path
              d="M46 8 L84 30 L84 74 L46 96 L8 74 L8 30 Z"
              fill="none"
              stroke="url(#hex-grad)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Row B, offset */}
            <path
              d="M46 88 L84 110 L84 154 L46 176 L8 154 L8 110 Z"
              fill="none"
              stroke="url(#hex-grad)"
              strokeWidth="1.6"
              strokeLinejoin="round"
              transform="translate(46, -80)"
            />
          </pattern>
          <linearGradient id="hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E19B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00C2FF" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-quiet)" />
      </svg>
    </div>
  );
}
