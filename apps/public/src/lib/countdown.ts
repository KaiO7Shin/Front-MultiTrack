export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

const ZERO: CountdownParts = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  expired: true,
};

export function getCountdownParts(nowMs: number, targetMs: number): CountdownParts {
  const diff = targetMs - nowMs;
  if (!Number.isFinite(diff) || diff <= 0) return ZERO;

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
}

export function padCountdown(value: number) {
  return String(value).padStart(2, "0");
}
