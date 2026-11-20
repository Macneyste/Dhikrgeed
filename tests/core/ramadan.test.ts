import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isLastTenNights,
  nextFastEvent,
  parseTaraawiix,
  ramadanNight,
  taraawiixNight,
  taraawiixSetTarget,
  taraawiixTap,
  taraawiixUndo,
} from '../../src/core/ramadan.ts';
import type { PrayerTimes } from '../../src/core/reminders.ts';

const day = (d: number): PrayerTimes => {
  const t = (h: number, m = 0) => new Date(2026, 1, d, h, m);
  return { fajr: t(5, 10), dhuhr: t(12, 20), asr: t(15, 40), maghrib: t(18, 30), isha: t(19, 45) };
};
const at = (d: number, h: number, m = 0) => new Date(2026, 1, d, h, m);

test('next Suxuur or Afur', () => {
  assert.deepEqual(nextFastEvent(at(20, 3), day(20), day(21)), { kind: 'suhoor', at: day(20).fajr });
  assert.deepEqual(nextFastEvent(at(20, 12), day(20), day(21)), { kind: 'iftar', at: day(20).maghrib });
  assert.deepEqual(nextFastEvent(at(20, 19), day(20), day(21)), { kind: 'suhoor', at: day(21).fajr });
});

test('Ramadan night starts at Maghrib; outside Ramadan there is none', () => {
  const h = { year: 1447, month: 9, day: 20 };
  assert.equal(ramadanNight(h, at(20, 12), day(20)), 20);
  assert.equal(ramadanNight(h, at(20, 18, 30), day(20)), 21);
  assert.ok(isLastTenNights(ramadanNight(h, at(20, 19), day(20))));
  assert.ok(!isLastTenNights(ramadanNight(h, at(20, 12), day(20))));
  assert.equal(ramadanNight({ year: 1447, month: 10, day: 1 }, at(20, 12), day(20)), null);
  assert.equal(ramadanNight(null, at(20, 12), day(20)), null);
});

test('taraawiix counts to the target, undoes, and never goes below zero', () => {
  let s = parseTaraawiix(null, '2026-02-20');
  assert.deepEqual(s, { night: '2026-02-20', count: 0, target: 20 });
  s = taraawiixSetTarget(s, 8);
  for (let i = 0; i < 10; i += 1) s = taraawiixTap(s);
  assert.equal(s.count, 8);
  s = taraawiixUndo(taraawiixUndo(s));
  assert.equal(s.count, 6);
  assert.equal(taraawiixUndo({ ...s, count: 0 }).count, 0);
  assert.equal(taraawiixSetTarget(s, 4).count, 4);
  assert.equal(taraawiixSetTarget(s, 999).target, 40);
});

test('a new night starts at zero but keeps the target; after midnight before Fajr is still last night', () => {
  const saved = JSON.stringify({ night: '2026-02-19', count: 12, target: 8 });
  assert.deepEqual(parseTaraawiix(saved, '2026-02-20'), { night: '2026-02-20', count: 0, target: 8 });
  assert.equal(taraawiixNight(at(20, 1), day(20)), '2026-02-19');
  assert.equal(taraawiixNight(at(20, 21), day(20)), '2026-02-20');
});

test('broken stored values fall back safely', () => {
  assert.deepEqual(parseTaraawiix('{x', '2026-02-20'), { night: '2026-02-20', count: 0, target: 20 });
  assert.deepEqual(parseTaraawiix('{"night":"2026-02-20","count":-3,"target":1000}', '2026-02-20'), {
    night: '2026-02-20',
    count: 0,
    target: 20,
  });
});
