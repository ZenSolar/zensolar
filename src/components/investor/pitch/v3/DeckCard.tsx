import { ReactNode } from 'react';

export function DeckCard({
  children,
  emphasized,
  accentClass,
  className = '',
}: {
  children: ReactNode;
  emphasized?: boolean;
  accentClass?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card/40 p-6 ${
        emphasized ? 'border-secondary/40 bg-secondary/5' : 'border-border/60'
      } ${accentClass ?? ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardKicker({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-[14px] font-mono tracking-[0.24em] uppercase ${className}`}>
      {children}
    </p>
  );
}
