// Prayer times calculated on the device with adhan (MIT). No network.

import { CalculationMethod, Coordinates, Madhab, PrayerTimes as AdhanTimes } from 'adhan';

import type { City } from '../core/cities.ts';
import { addDays, startOfDay } from '../core/format.ts';
import type { PrayerTimes } from '../core/reminders.ts';

export function prayerTimesFor(city: City, date: Date): PrayerTimes {
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;
  const t = new AdhanTimes(new Coordinates(city.lat, city.lng), date, params);
  return { fajr: t.fajr, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
}

/** Today and the next `count - 1` days. */
export function prayerDays(city: City, now: Date, count = 3): PrayerTimes[] {
  const today = startOfDay(now);
  return Array.from({ length: count }, (_, i) => prayerTimesFor(city, addDays(today, i)));
}
