export function getAverageRuntime(times: number[]): number | undefined {
  if (times.length === 0) return;

  return Math.round(times.reduce((timeSum, time) => timeSum + time, 0) / times.length);
}

export function getShortestRuntime(times: number[]): number {
  return Math.min(...times);
}

export function getLongestRuntime(times: number[]): number {
  return Math.max(...times);
}

export function parseValidPercent(value?: string): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value.replace('%', ''));
  return num / 100;
}
