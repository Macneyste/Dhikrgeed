// Sky period from today's prayer times. Pure.
//   dawn:  fajr → sunrise
//   day:   sunrise → asr
//   dusk:  asr → maghrib
//   night: maghrib → next fajr (and midnight → fajr)
// Without times (no city, or times that cannot be calculated) it is always day.

export type SkyPeriod = 'dawn' | 'day' | 'dusk' | 'night';

export interface SkyTimes {
  fajr: Date;
  sunrise: Date;
  asr: Date;
  maghrib: Date;
}

const valid = (t: SkyTimes) =>
  [t.fajr, t.sunrise, t.asr, t.maghrib].every((d) => d instanceof Date && Number.isFinite(d.getTime())) &&
  t.fajr < t.sunrise &&
  t.sunrise < t.asr &&
  t.asr < t.maghrib;

/** `times` are the prayer times of the local day that contains `now`. */
export function skyFor(now: Date, times: SkyTimes | null | undefined): SkyPeriod {
  if (!times || !valid(times)) return 'day';
  const t = now.getTime();
  if (t < times.fajr.getTime()) return 'night';
  if (t < times.sunrise.getTime()) return 'dawn';
  if (t < times.asr.getTime()) return 'day';
  if (t < times.maghrib.getTime()) return 'dusk';
  return 'night';
}

/** The next moment today when the period changes, or null (after maghrib or without times). */
export function nextSkyChange(now: Date, times: SkyTimes | null | undefined): Date | null {
  if (!times || !valid(times)) return null;
  return [times.fajr, times.sunrise, times.asr, times.maghrib].find((d) => d.getTime() > now.getTime()) ?? null;
}
