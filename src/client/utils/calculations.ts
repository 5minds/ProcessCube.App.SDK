export function getAverageRuntime(times: number[]): number | undefined {
  if (times.length === 0) return;

  return Math.round(times.reduce((timeSum, time) => timeSum + time, 0) / times.length);
}

export function getShortestRuntime(times: number[]): number {
  let shortestTime = times[0];

  for (let i = 1; i < times.length; i++) {
    if (times[i] < shortestTime) {
      shortestTime = times[i];
    }
  }

  return shortestTime;
}

export function getLongestRuntime(times: number[]): number {
  let longestTime = times[0];

  for (let i = 1; i < times.length; i++) {
    if (times[i] > longestTime) {
      longestTime = times[i];
    }
  }

  return longestTime;
}

export function parseValidPercent(value?: string): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value.replace('%', ''));
  return num / 100;
}
