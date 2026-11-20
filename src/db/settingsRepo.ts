import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_REMINDER_SETTINGS, parseReminderSettings, type ReminderSettings } from '../core/reminders.ts';

export interface AppSettings {
  onboarded: boolean;
  largeText: boolean;
  haptics: boolean;
  transliteration: boolean;
  meaning: boolean;
  reducedMotion: boolean;
  /** Count with Volume Down and undo with Volume Up on the counter screen. */
  volumeKeys: boolean;
  /** City id from the city list, or "custom". */
  city: string;
  /** JSON {lat, lng, name} when city === "custom". */
  customCity: string | null;
  reminders: ReminderSettings;
  notificationsAsked: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  onboarded: false,
  largeText: false,
  haptics: true,
  transliteration: true,
  meaning: true,
  reducedMotion: false,
  volumeKeys: false,
  city: 'muqdisho',
  customCity: null,
  reminders: DEFAULT_REMINDER_SETTINGS,
  notificationsAsked: false,
};

const BOOL_KEYS = [
  'onboarded',
  'largeText',
  'haptics',
  'transliteration',
  'meaning',
  'reducedMotion',
  'volumeKeys',
  'notificationsAsked',
] as const;

export async function loadSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out: AppSettings = { ...DEFAULT_SETTINGS, reminders: parseReminderSettings(map.get('reminders')) };
  for (const key of BOOL_KEYS) {
    const v = map.get(key);
    if (v === 'true' || v === 'false') out[key] = v === 'true';
  }
  const city = map.get('city');
  if (city && /^[a-z0-9-]{1,32}$/.test(city)) out.city = city;
  out.customCity = map.get('customCity') ?? null;
  return out;
}

export async function saveSetting<K extends keyof AppSettings>(
  db: SQLiteDatabase,
  key: K,
  value: AppSettings[K],
): Promise<void> {
  const stored = typeof value === 'string' ? value : JSON.stringify(value);
  if (value === null) {
    await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
    return;
  }
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, stored],
  );
}
