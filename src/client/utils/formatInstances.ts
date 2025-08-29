export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) {
    return '';
  }

  if (ms == 0) {
    return '0ms';
  }

  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  const milliseconds = ms % 1000;
  const formattedMs = +(milliseconds % 1 === 0 ? milliseconds : milliseconds.toFixed(2));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  if (milliseconds > 0) parts.push(`${formattedMs}ms`);

  return parts.join(' ');
}
