function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function RefreshIndicators({
  lastUpdatedAt,
}: {
  lastUpdatedAt?: string | null;
}) {
  const time = formatTime(lastUpdatedAt ?? undefined);

  return (
    <span className="text-xs text-muted-foreground">
      Last updated{time ? ` ${time}` : ''}
    </span>
  );
}
