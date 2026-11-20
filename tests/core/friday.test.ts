import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseReminderSettings, planFridayReminder, type PrayerTimes } from '../../src/core/reminders.ts';
import { routeFromNotificationData } from '../../src/core/routes.ts';

// Monday 16 Nov 2026 … Monday 23 Nov 2026; Thursday = 19th, Friday = 20th.
const week: PrayerTimes[] = Array.from({ length: 8 }, (_, i) => {
  const t = (h: number, m = 0) => new Date(2026, 10, 16 + i, h, m);
  return { fajr: t(4, 50), dhuhr: t(12), asr: t(15, 10), maghrib: t(18), isha: t(19, 15) };
});

test('off by default and when off nothing is planned', () => {
  assert.equal(parseReminderSettings(null).friday, 'off');
  assert.deepEqual(planFridayReminder(week, 'off', new Date(2026, 10, 16)), []);
});

test('Thursday evening fires 15 minutes after Maghrib', () => {
  const [r] = planFridayReminder(week, 'thursday-evening', new Date(2026, 10, 16, 9));
  assert.equal(r?.fireAt.getTime(), new Date(2026, 10, 19, 18, 15).getTime());
  assert.equal(r?.title, 'Jimce wanaagsan');
  assert.equal(r?.body, 'Suuratul Kahf iyo salawaat.');
});

test('Friday morning fires at 08:00 on Friday', () => {
  const [r] = planFridayReminder(week, 'friday-morning', new Date(2026, 10, 16, 9));
  assert.equal(r?.fireAt.getTime(), new Date(2026, 10, 20, 8, 0).getTime());
});

test('a time already passed is skipped, never sent late', () => {
  assert.deepEqual(planFridayReminder(week, 'friday-morning', new Date(2026, 10, 20, 9)), []);
});

test('stored values are validated', () => {
  assert.equal(parseReminderSettings('{"friday":"friday-morning"}').friday, 'friday-morning');
  assert.equal(parseReminderSettings('{"friday":"every-hour"}').friday, 'off');
});

test('the Friday notification opens Home through the allowlist', () => {
  assert.equal(routeFromNotificationData({ route: 'home' }), '/');
});
