/**
 * SectionHeader — v3 deck-wide header motif.
 * Kicker + title + the 1px secondary-glow horizontal divider that runs under
 * every slide header. The "tell" of the v3 deck.
 */
export function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10">
      {kicker && (
        <p className="text-[18px] font-mono tracking-[0.28em] uppercase text-secondary/80 mb-4">
          {kicker}
        </p>
      )}
      <h2 className="text-[64px] font-semibold leading-[1.05] tracking-tight text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-[24px] text-white/55 leading-relaxed max-w-[1200px]">
          {subtitle}
        </p>
      )}
      <div
        className="mt-6 h-px w-full"
        style={{
          background:
            'linear-gradient(to right, hsl(var(--secondary) / 0.55), hsl(var(--secondary) / 0.15) 40%, transparent)',
          boxShadow: '0 0 12px hsl(var(--secondary) / 0.35)',
        }}
      />
    </div>
  );
}
