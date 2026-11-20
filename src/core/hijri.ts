// Hijri (Umm al-Qura) dates from a table, not Intl: Hermes' Islamic
// calendars are incomplete. Local moon sighting can differ by a day or two,
// so callers pass the person's adjustment (-2..+2 days). Pure.

import { UMM_AL_QURA_FIRST_YEAR, UMM_AL_QURA_MONTH_STARTS as STARTS } from './ummalquraData.ts';

export interface HijriDate {
  year: number;
  /** 1 = Muharram … 12 = Dhul-Hijja */
  month: number;
  day: number;
}

export const HIJRI_ADJUSTMENTS = [-2, -1, 0, 1, 2] as const;
export type HijriAdjustment = (typeof HIJRI_ADJUSTMENTS)[number];

/** 1970-01-01 in the table's numbering (Julian Day Number − 2 400 000). */
const DAY_NUMBER_OF_UNIX_EPOCH = 40588;
const DAY_MS = 86_400_000;

/** MJD of the local calendar day of `date`. */
function localDayNumber(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS) + DAY_NUMBER_OF_UNIX_EPOCH;
}

/** Local midnight of an MJD. */
function fromDayNumber(mjd: number): Date {
  const utc = new Date((mjd - DAY_NUMBER_OF_UNIX_EPOCH) * DAY_MS);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

/** Hijri date of the local day of `date`, or null outside 1356–1500 AH. */
export function toHijri(date: Date, adjustDays: number = 0): HijriDate | null {
  const mjd = localDayNumber(date) + adjustDays;
  if (mjd < STARTS[0]! || mjd >= STARTS[STARTS.length - 1]!) return null;
  // Binary search for the last month start <= mjd.
  let lo = 0;
  let hi = STARTS.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (STARTS[mid]! <= mjd) lo = mid;
    else hi = mid - 1;
  }
  return {
    year: UMM_AL_QURA_FIRST_YEAR + Math.floor(lo / 12),
    month: (lo % 12) + 1,
    day: mjd - STARTS[lo]! + 1,
  };
}

/** Local date of a Hijri day, or null when it does not exist in the table. */
export function fromHijri(h: HijriDate, adjustDays: number = 0): Date | null {
  const index = (h.year - UMM_AL_QURA_FIRST_YEAR) * 12 + (h.month - 1);
  if (!Number.isInteger(index) || index < 0 || index >= STARTS.length - 1 || h.month < 1 || h.month > 12) return null;
  const length = STARTS[index + 1]! - STARTS[index]!;
  if (!Number.isInteger(h.day) || h.day < 1 || h.day > length) return null;
  return fromDayNumber(STARTS[index]! + h.day - 1 - adjustDays);
}

export const isRamadan = (h: HijriDate | null) => h?.month === 9;

/** "Khamiis, 29 Jumaada al-Uulaa 1448", or just the weekday outside the table. */
export function formatHijri(
  date: Date,
  adjustDays: number,
  months: readonly string[],
  weekdays: readonly string[],
): string {
  const weekday = weekdays[date.getDay()] ?? '';
  const h = toHijri(date, adjustDays);
  return h ? `${weekday}, ${h.day} ${months[h.month - 1]} ${h.year}` : weekday;
}
