// Prayer reminder planning. Pure: prayer times come in, notification plans come out.

import { formatTime } from './format.ts';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_KEYS: readonly PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_NAMES: Record<PrayerKey, { so: string; ar: string }> = {
  fajr: { so: 'Subax', ar: 'الفجر' },
  dhuhr: { so: 'Duhur', ar: 'الظهر' },
  asr: { so: 'Casar', ar: 'العصر' },
  maghrib: { so: 'Maqrib', ar: 'المغرب' },
  isha: { so: 'Cishe', ar: 'العشاء' },
};

export type ReminderOffset = 0 | 5 | 10 | 15;
export const REMINDER_OFFSETS: readonly ReminderOffset[] = [0, 5, 10, 15];

export interface ReminderSettings {
  prayers: Record<PrayerKey, boolean>;
  /** Minutes before the prayer time. 0 = at the time. */
  offsetMinutes: ReminderOffset;
  /** Remind about after-prayer adhkar 15 minutes after each enabled prayer. */
  afterPrayer: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
  offsetMinutes: 0,
  afterPrayer: false,
};

export const AFTER_PRAYER_DELAY_MIN = 15;

export type PrayerTimes = Record<PrayerKey, Date>;

export interface PlannedReminder {
  id: string;
  kind: 'prayer' | 'after-prayer';
  prayer: PrayerKey;
  fireAt: Date;
  title: string;
  body: string;
  data: { route: 'after-prayer' };
}

export function enabledCount(settings: ReminderSettings): number {
  return PRAYER_KEYS.filter((k) => settings.prayers[k]).length;
}

/** Parses stored JSON defensively; unknown or broken values fall back to defaults. */
export function parseReminderSettings(json: string | null | undefined): ReminderSettings {
  const base: ReminderSettings = {
    prayers: { ...DEFAULT_REMINDER_SETTINGS.prayers },
    offsetMinutes: 0,
    afterPrayer: false,
  };
  if (!json) return base;
  try {
    const raw = JSON.parse(json) as Partial<ReminderSettings> | null;
    if (!raw || typeof raw !== 'object') return base;
    for (const k of PRAYER_KEYS) base.prayers[k] = raw.prayers?.[k] === true;
    if (REMINDER_OFFSETS.includes(raw.offsetMinutes as ReminderOffset)) {
      base.offsetMinutes = raw.offsetMinutes as ReminderOffset;
    }
    base.afterPrayer = raw.afterPrayer === true;
  } catch {
    // Keep defaults.
  }
  return base;
}

export interface PlanInput {
  days: readonly PrayerTimes[];
  settings: ReminderSettings;
  cityName: string;
  now: Date;
}

/** Builds every future notification for the given days, sorted by time. */
export function planReminders(input: PlanInput): PlannedReminder[] {
  const { settings, cityName, now } = input;
  const plans: PlannedReminder[] = [];
  for (const times of input.days) {
    for (const prayer of PRAYER_KEYS) {
      if (!settings.prayers[prayer]) continue;
      const at = times[prayer];
      const name = PRAYER_NAMES[prayer].so;
      const stamp = at.toISOString();
      const fireAt = new Date(at.getTime() - settings.offsetMinutes * 60000);
      plans.push({
        id: `prayer:${prayer}:${stamp}`,
        kind: 'prayer',
        prayer,
        fireAt,
        title:
          settings.offsetMinutes === 0
            ? `Waa waqtigii salaadda ${name}`
            : `Salaadda ${name} waa ${settings.offsetMinutes} daqiiqo kadib`,
        body: `${formatTime(at)} · ${cityName}. Salaadda kadib, adkaartaada ayaa diyaar kuu ah.`,
        data: { route: 'after-prayer' },
      });
      if (settings.afterPrayer) {
        plans.push({
          id: `after:${prayer}:${stamp}`,
          kind: 'after-prayer',
          prayer,
          fireAt: new Date(at.getTime() + AFTER_PRAYER_DELAY_MIN * 60000),
          title: `Adkaarta salaadda ${name}`,
          body: 'Geedkaagu wuxuu sugayaa dhibicdiisa koowaad.',
          data: { route: 'after-prayer' },
        });
      }
    }
  }
  return plans
    .filter((p) => p.fireAt.getTime() > now.getTime())
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

/** The next prayer after `now` across the given days, or null. */
export function nextPrayer(
  days: readonly PrayerTimes[],
  now: Date,
): { prayer: PrayerKey; at: Date } | null {
  let best: { prayer: PrayerKey; at: Date } | null = null;
  for (const times of days) {
    for (const prayer of PRAYER_KEYS) {
      const at = times[prayer];
      if (at.getTime() > now.getTime() && (!best || at.getTime() < best.at.getTime())) {
        best = { prayer, at };
      }
    }
  }
  return best;
}
