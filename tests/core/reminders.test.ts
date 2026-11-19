import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatCountdown, weekDays } from '../../src/core/format.ts';
import {
  DEFAULT_REMINDER_SETTINGS,
  nextPrayer,
  parseReminderSettings,
  planReminders,
  type PrayerTimes,
  type ReminderSettings,
} from '../../src/core/reminders.ts';

const day = (d: number): PrayerTimes => ({
  fajr: new Date(2026, 10, d, 4, 40),
  dhuhr: new Date(2026, 10, d, 11, 50),
  asr: new Date(2026, 10, d, 15, 12),
  maghrib: new Date(2026, 10, d, 17, 55),
  isha: new Date(2026, 10, d, 19, 5),
});

const settings = (patch: Partial<ReminderSettings>): ReminderSettings => ({
  ...DEFAULT_REMINDER_SETTINGS,
  prayers: { fajr: false, dhuhr: false, asr: true, maghrib: false, isha: false },
  ...patch,
});

test('plans only enabled prayers in the future', () => {
  const plans = planReminders({
    days: [day(19), day(20)],
    settings: settings({}),
    cityName: 'Muqdisho',
    now: new Date(2026, 10, 19, 16, 0),
  });
  assert.equal(plans.length, 1);
  assert.equal(plans[0]!.title, 'Waa waqtigii salaadda Casar');
  assert.equal(plans[0]!.body, '3:12 · Muqdisho. Salaadda kadib, adkaartaada ayaa diyaar kuu ah.');
  assert.deepEqual(plans[0]!.data, { route: 'after-prayer' });
});

test('offset moves the reminder before the prayer', () => {
  const plans = planReminders({
    days: [day(19)],
    settings: settings({ offsetMinutes: 10 }),
    cityName: 'Hargeysa',
    now: new Date(2026, 10, 19, 8, 0),
  });
  assert.equal(plans[0]!.fireAt.getHours() * 60 + plans[0]!.fireAt.getMinutes(), 15 * 60 + 2);
});

test('after-prayer reminder fires 15 minutes after the prayer', () => {
  const plans = planReminders({
    days: [day(19)],
    settings: settings({ afterPrayer: true }),
    cityName: 'Muqdisho',
    now: new Date(2026, 10, 19, 8, 0),
  });
  const after = plans.find((p) => p.kind === 'after-prayer')!;
  assert.equal(after.title, 'Adkaarta salaadda Casar');
  assert.equal(after.fireAt.getMinutes(), 27);
});

test('broken stored reminder settings fall back to defaults', () => {
  assert.deepEqual(parseReminderSettings('{not json'), DEFAULT_REMINDER_SETTINGS);
  const parsed = parseReminderSettings('{"prayers":{"asr":true,"x":true},"offsetMinutes":7}');
  assert.equal(parsed.prayers.asr, true);
  assert.equal(parsed.offsetMinutes, 0);
});

test('next prayer and countdown', () => {
  const next = nextPrayer([day(19), day(20)], new Date(2026, 10, 19, 13, 52));
  assert.equal(next!.prayer, 'asr');
  assert.equal(formatCountdown(next!.at.getTime() - new Date(2026, 10, 19, 13, 52).getTime()), '1 saac 20 daqiiqo');
  assert.equal(nextPrayer([day(19)], new Date(2026, 10, 19, 23, 0)), null);
});

test('week starts on Saturday', () => {
  const days = weekDays(new Date(2026, 10, 19, 12)); // Thursday
  assert.equal(days.length, 7);
  assert.equal(days[0]!.getDay(), 6);
  assert.equal(days[6]!.getDay(), 5);
});
