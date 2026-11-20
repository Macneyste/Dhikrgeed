import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextSkyChange, skyFor, type SkyTimes } from '../../src/core/sky.ts';

const at = (h: number, m = 0) => new Date(2026, 10, 20, h, m);
const TIMES: SkyTimes = { fajr: at(4, 50), sunrise: at(6, 5), asr: at(15, 10), maghrib: at(18, 0) };

test('each period starts exactly at its prayer time', () => {
  assert.equal(skyFor(at(4, 49), TIMES), 'night');
  assert.equal(skyFor(TIMES.fajr, TIMES), 'dawn');
  assert.equal(skyFor(at(6, 4), TIMES), 'dawn');
  assert.equal(skyFor(TIMES.sunrise, TIMES), 'day');
  assert.equal(skyFor(at(15, 9), TIMES), 'day');
  assert.equal(skyFor(TIMES.asr, TIMES), 'dusk');
  assert.equal(skyFor(at(17, 59), TIMES), 'dusk');
  assert.equal(skyFor(TIMES.maghrib, TIMES), 'night');
});

test('midnight and late evening are night', () => {
  assert.equal(skyFor(at(0, 0), TIMES), 'night');
  assert.equal(skyFor(at(23, 59), TIMES), 'night');
});

test('missing or broken times fall back to day', () => {
  assert.equal(skyFor(at(23), null), 'day');
  assert.equal(skyFor(at(23), undefined), 'day');
  assert.equal(skyFor(at(23), { ...TIMES, maghrib: new Date(NaN) }), 'day');
  // Out of order (e.g. polar edge cases) is treated as missing.
  assert.equal(skyFor(at(23), { ...TIMES, asr: at(19) }), 'day');
});

test('next change is the next boundary today, or null after maghrib', () => {
  assert.deepEqual(nextSkyChange(at(1), TIMES), TIMES.fajr);
  assert.deepEqual(nextSkyChange(TIMES.fajr, TIMES), TIMES.sunrise);
  assert.deepEqual(nextSkyChange(at(12), TIMES), TIMES.asr);
  assert.equal(nextSkyChange(at(19), TIMES), null);
  assert.equal(nextSkyChange(at(12), null), null);
});
