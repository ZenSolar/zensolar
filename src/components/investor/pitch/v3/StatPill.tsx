export function StatPillRow({
  items,
  className = '',
}: {
  items: { k: string; v: string; accent?: string }[];
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-${items.length} gap-4 ${className}`}>
      {items.map((s) => (
        <div
          key={s.v}
          className="rounded-xl border border-border/60 bg-card/50 px-4 py-4 text-center"
        >
          <div
            className={`text-[36px] font-semibold leading-none ${
              s.accent ?? 'text-white'
            }`}
          >
            {s.k}
          </div>
          <div className="text-[13px] uppercase tracking-[0.18em] text-white/45 mt-2">
            {s.v}
          </div>
        </div>
      ))}
    </div>
  );
}
