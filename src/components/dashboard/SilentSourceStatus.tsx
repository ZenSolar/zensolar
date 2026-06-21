/**
 * SilentSourceStatus — generic L1 calm status line.
 *
 * Renders a single muted line for a passively-accruing source (solar,
 * battery export, EV mileage, FSD). No card, no toast, no takeover.
 * Generalization of <SilentChargingStatus />.
 */
import * as React from 'react';

interface Props {
  /** e.g. "● Solar producing • accruing" — caller passes locked copy. */
  label: string;
  /** Optional running counter, right-aligned with tabular-nums. */
  counter?: string;
  /** Hide when source not active. */
  active: boolean;
}

export function SilentSourceStatus({ label, counter, active }: Props) {
  if (!active) return null;
  // Caller passes label starting with "●" — split to render the dot as a
  // glowing pip for visual parity with SilentChargingStatus.
  const text = label.replace(/^●\s*/, '');
  return (
    <div
      role="status"
      aria-live="off"
      className="flex items-center gap-2 px-1 py-1 text-[11px] text-muted-foreground/80"
    >
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary/70" />
      <span>
        {text}
        {counter ? (
          <span className="ml-1.5 tabular-nums text-muted-foreground/60">
            {counter}
          </span>
        ) : null}
      </span>
    </div>
  );
}
