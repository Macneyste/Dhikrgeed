import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatHijri, fromHijri, isRamadan, toHijri } from '../../src/core/hijri.ts';
import { HIJRI_MONTHS_SO, WEEKDAYS_SO } from '../../src/i18n/hijri.ts';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);

// Published Umm al-Qura dates.
const KNOWN: [Date, number, number, number][] = [
  [d(1937, 3, 14), 1356, 1, 1], // first entry of the table
  [d(1987, 3, 1), 1407, 7, 1],
  [d(2025, 3, 1), 1446, 9, 1], // 1 Ramadan 1446
  [d(2025, 3, 30), 1446, 10, 1], // Eid al-Fitr 1446
  [d(2025, 6, 26), 1447, 1, 1], // 1 Muharram 1447
  [d(2026, 2, 18), 1447, 9, 1], // 1 Ramadan 1447
];

test('known Gregorian dates convert to the published Umm al-Qura date', () => {
  for (const [date, year, month, day] of KNOWN) {
    assert.deepEqual(toHijri(date), { year, month, day }, date.toDateString());
  }
});

test('Hijri to Gregorian round-trips', () => {
  for (const [date, year, month, day] of KNOWN) {
    assert.equal(fromHijri({ year, month, day })?.toDateString(), date.toDateString());
  }
  for (let t = d(2020, 1, 1).getTime(); t < d(2030, 1, 1).getTime(); t += 86_400_000 * 3) {
    const h = toHijri(new Date(t))!;
    assert.equal(fromHijri(h)?.toDateString(), new Date(t).toDateString());
  }
});

test('the day adjustment moves the Hijri date by whole days', () => {
  assert.deepEqual(toHijri(d(2026, 2, 18), -1), { year: 1447, month: 8, day: 29 });
  assert.deepEqual(toHijri(d(2026, 2, 18), 1), { year: 1447, month: 9, day: 2 });
  assert.equal(fromHijri({ year: 1447, month: 9, day: 1 }, 1)?.toDateString(), d(2026, 2, 17).toDateString());
});

test('the time of day does not change the date', () => {
  assert.deepEqual(toHijri(new Date(2026, 1, 18, 0, 0)), toHijri(new Date(2026, 1, 18, 23, 59)));
});

test('outside the table or invalid input gives null', () => {
  assert.equal(toHijri(d(1900, 1, 1)), null);
  assert.equal(toHijri(d(2100, 1, 1)), null);
  assert.equal(fromHijri({ year: 1447, month: 13, day: 1 }), null);
  assert.equal(fromHijri({ year: 1447, month: 9, day: 31 }), null);
});

test('Somali format and Ramadan detection', () => {
  assert.equal(formatHijri(d(2026, 2, 18), 0, HIJRI_MONTHS_SO, WEEKDAYS_SO), 'Arbaco, 1 Ramadaan 1447');
  assert.ok(isRamadan(toHijri(d(2026, 3, 1))));
  assert.ok(!isRamadan(toHijri(d(2026, 4, 1))));
});
