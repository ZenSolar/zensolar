function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tz = d.toLocaleTimeString([], { timeZoneName: 'short' }).split(' ').pop() || '';
  return `${time} ${tz}`;
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
