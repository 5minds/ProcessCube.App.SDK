export function calculateTimeBetweenTimestamps(times: Date[]): number[] {
  const calculatedTimes: number[] = [];

  for (let i = 0; i < times.length - 1; i += 2) {
    calculatedTimes.push(new Date(times[i + 1]).getTime() - new Date(times[i]).getTime());
  }

  return calculatedTimes;
}

export function getAverage(times: number[]): number {
  return Math.round(times.reduce((timeSum, time) => timeSum + time, 0) / times.length);
}

export function getShortestLeadTime(times: number[]): number {
  let shortestTime = times[0];

  for (let i = 1; i < times.length; i++) {
    if (times[i] < shortestTime) {
      shortestTime = times[i];
    }
  }

  return shortestTime;
}

export function getLongestLeadTime(times: number[]): number {
  let longestTime = times[0];

  for (let i = 1; i < times.length; i++) {
    if (times[i] > longestTime) {
      longestTime = times[i];
    }
  }

  return longestTime;
}
