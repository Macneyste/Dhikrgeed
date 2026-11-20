// Ramadan helpers. Pure. Nothing here is forced on anyone: the mode is off
// unless the person turns it on, and Home only suggests it during Ramadan.

import type { HijriDate } from './hijri.ts';
import type { PrayerTimes } from './reminders.ts';

export interface FastTimes {
  /** Suxuur ends at Fajr. */
  suhoor: Date;
  /** Afur is at Maghrib. */
  iftar: Date;
}

export interface NextFastEvent {
  kind: 'suhoor' | 'iftar';
  at: Date;
}

/** The next Suxuur or Afur after `now`, using today's and tomorrow's times. */
export function nextFastEvent(now: Date, today: PrayerTimes, tomorrow: PrayerTimes): NextFastEvent {
  const t = now.getTime();
  if (t < today.fajr.getTime()) return { kind: 'suhoor', at: today.fajr };
  if (t < today.maghrib.getTime()) return { kind: 'iftar', at: today.maghrib };
  return { kind: 'suhoor', at: tomorrow.fajr };
}

/**
 * Which night of Ramadan it is (the night before day n is night n), or null
 * outside Ramadan. After Maghrib the next night has begun.
 */
export function ramadanNight(hijri: HijriDate | null, now: Date, today: PrayerTimes): number | null {
  if (!hijri || hijri.month !== 9) return null;
  const night = now.getTime() >= today.maghrib.getTime() ? hijri.day + 1 : hijri.day;
  return night <= 30 ? night : null;
}

export const isLastTenNights = (night: number | null) => night !== null && night >= 21;

// ---------------------------------------------------------------------------
// Taraawiix rakaat counter: one count per rakaca, reset each night.

export interface TaraawiixState {
  /** Local date (YYYY-MM-DD) of the evening the count belongs to. */
  night: string;
  count: number;
  target: number;
}

export const TARAAWIIX_TARGETS = [8, 11, 13, 20, 23] as const;
export const TARAAWIIX_MAX_TARGET = 40;

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;

/** The evening a moment belongs to: before Fajr still counts as last night. */
export function taraawiixNight(now: Date, today: PrayerTimes): string {
  const d = now.getTime() < today.fajr.getTime() ? new Date(now.getTime() - 86_400_000) : now;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseTaraawiix(json: string | null | undefined, night: string): TaraawiixState {
  const fresh: TaraawiixState = { night, count: 0, target: 20 };
  if (!json) return fresh;
  try {
    const raw = JSON.parse(json) as Partial<TaraawiixState> | null;
    const target =
      Number.isInteger(raw?.target) && raw!.target! >= 1 && raw!.target! <= TARAAWIIX_MAX_TARGET ? raw!.target! : 20;
    if (typeof raw?.night !== 'string' || !NIGHT.test(raw.night) || raw.night !== night) return { ...fresh, target };
    const count = Number.isInteger(raw.count) && raw.count! >= 0 ? Math.min(raw.count!, target) : 0;
    return { night, count, target };
  } catch {
    return fresh;
  }
}

export function taraawiixTap(s: TaraawiixState): TaraawiixState {
  return s.count >= s.target ? s : { ...s, count: s.count + 1 };
}

export function taraawiixUndo(s: TaraawiixState): TaraawiixState {
  return s.count === 0 ? s : { ...s, count: s.count - 1 };
}

export function taraawiixSetTarget(s: TaraawiixState, target: number): TaraawiixState {
  const t = Math.max(1, Math.min(TARAAWIIX_MAX_TARGET, Math.round(target)));
  return { ...s, target: t, count: Math.min(s.count, t) };
}
