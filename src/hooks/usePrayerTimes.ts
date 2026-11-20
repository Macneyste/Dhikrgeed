import { useEffect, useMemo, useState } from 'react';

import { resolveCity, type City } from '../core/cities.ts';
import { dayKey, formatCountdown } from '../core/format.ts';
import { nextPrayer, PRAYER_NAMES, type PrayerKey, type PrayerTimes } from '../core/reminders.ts';
import { prayerDays } from '../services/prayerTimes';
import { useSettings } from './useSettings';

export interface PrayerInfo {
  city: City;
  today: PrayerTimes;
  tomorrow: PrayerTimes;
  now: Date;
  next: { prayer: PrayerKey; name: string; at: Date; countdown: string } | null;
}

/** Today's prayer times for the chosen city and the next prayer, refreshed every 30 s. */
export function usePrayerTimes(): PrayerInfo {
  const { settings } = useSettings();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const city = useMemo(() => resolveCity(settings.city, settings.customCity), [settings.city, settings.customCity]);
  const day = dayKey(now);
  // Recalculate only when the city or the day changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const days = useMemo(() => prayerDays(city, new Date(), 2), [city, day]);

  const n = nextPrayer(days, now);
  return {
    city,
    today: days[0]!,
    tomorrow: days[1]!,
    now,
    next: n
      ? {
          prayer: n.prayer,
          name: PRAYER_NAMES[n.prayer].so,
          at: n.at,
          countdown: formatCountdown(n.at.getTime() - now.getTime()),
        }
      : null,
  };
}
