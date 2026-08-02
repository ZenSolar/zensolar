import { buildSourcesSinks, type ReconciledFlow, type FlowSegment } from '@/lib/energyFlowReconcile';

/**
 * §7 — SOURCES OVER SINKS.
 *
 * Replaces the old aggregate "site balance unresolved" claim with a
 * proportional view built from the SAME `reconciledFlow` object the scene and
 * the corner tiles read. No parallel computation lives here.
 *
 * Measured segments render solid. Derived segments (home always; grid on the
 * frames the CT was overridden) render hatched. When measured sinks outrun
 * everything accounted for, the excess renders grey and labelled "unmeasured"
 * — the genuine unknown, surfaced rather than absorbed.
 */

const TONE_FILL: Record<FlowSegment['tone'], string> = {
  solar: 'hsl(45 95% 58%)',
  battery: 'hsl(142 70% 45%)',
  grid: 'hsl(199 90% 58%)',
  home: 'hsl(180 60% 50%)',
  ev: 'hsl(160 80% 45%)',
  unknown: 'hsl(220 8% 45%)',
};

function Bar({ label, segments, totalKw }: { label: string; segments: FlowSegment[]; totalKw: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </span>
      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted/25">
        {segments.map((s) => {
          const pct = totalKw > 0 ? (s.kw / totalKw) * 100 : 0;
          const fill = TONE_FILL[s.tone];
          return (
            <div
              key={s.key}
              title={`${s.label} · ${s.kw.toFixed(1)} kW · ${s.provenance}`}
              style={{
                width: `${pct}%`,
                background:
                  s.provenance === 'measured'
                    ? fill
                    : `repeating-linear-gradient(135deg, ${fill} 0 3px, transparent 3px 6px)`,
                opacity: s.provenance === 'unmeasured' ? 0.55 : 1,
              }}
            />
          );
        })}
      </div>
      <span className="w-14 shrink-0 text-right text-[10px] font-medium tabular-nums text-muted-foreground">
        {totalKw.toFixed(1)} kW
      </span>
    </div>
  );
}

export function SourcesSinksStrip({ flow, className }: { flow: ReconciledFlow; className?: string }) {
  const { sources, sinks, sourcesKw, sinksKw, unmeasuredKw } = buildSourcesSinks(flow);
  if (sources.length === 0 && sinks.length === 0) return null;

  const scale = Math.max(sourcesKw, sinksKw, 0.1);

  return (
    <div className={`space-y-1.5 ${className ?? ''}`} data-testid="sources-sinks-strip">
      <Bar label="Sources" segments={sources} totalKw={scale} />
      <Bar label="Sinks" segments={sinks} totalKw={scale} />
      {unmeasuredKw > 0.05 && (
        <p className="text-[10px] leading-snug text-muted-foreground/80">
          {unmeasuredKw.toFixed(1)} kW of measured load has no measured source. Shown as
          unmeasured rather than folded into another channel.
        </p>
      )}
    </div>
  );
}
