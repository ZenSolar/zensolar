import { useEffect, useState } from 'react';
import { FileClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * IMPORTED HISTORY — a statement of absence, never a generated hash.
 *
 * Readings written before the Proof-of-Delta hash chain existed carry no hash
 * and never will: a hash computed today would prove only that the row exists
 * today, not that it was unaltered since it was read. The receipt says so
 * plainly, and states what share of the history IS hash-chained so the answer
 * to "how much of this is proven" is a number rather than an impression.
 */

interface Coverage {
  total_rows: number;
  hash_chained_rows: number;
  imported_history_rows: number;
  hash_chained_pct: number;
}

export function ImportedHistoryNote({ userId }: { userId?: string | null }) {
  const [cov, setCov] = useState<Coverage | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_provenance_coverage', {
        _user_id: userId ?? undefined,
      });
      if (cancelled || error) return;
      const row = Array.isArray(data) ? (data[0] as Coverage | undefined) : null;
      if (row && row.imported_history_rows > 0) setCov(row);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (!cov) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <FileClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-foreground/90">
            Imported history — not hash-chained
          </p>
          <p className="text-[10.5px] leading-relaxed text-muted-foreground">
            Some readings were imported before the proof chain existed. They carry no hash and
            none will be added after the fact — a hash written today would prove only that the
            row exists today.
          </p>
          <p className="font-mono text-[10.5px] text-muted-foreground">
            {cov.hash_chained_pct}% of {cov.total_rows.toLocaleString()} readings are hash-chained
            · {cov.imported_history_rows.toLocaleString()} imported
          </p>
        </div>
      </div>
    </div>
  );
}
