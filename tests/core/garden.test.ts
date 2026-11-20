import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gardenMonths } from '../../src/core/garden.ts';
import { createSession, tap } from '../../src/core/session.ts';
import type { Session } from '../../src/core/types.ts';
import { spec } from './helpers.ts';

function round(id: string, when: Date, complete = true): Session {
  let s = createSession({ id, collectionId: 'tasbih', contentVersion: 1, items: [spec('a', 2, 'purple')], now: when });
  for (let i = 0; i < (complete ? 2 : 1); i += 1) s = tap(s, when).session;
  return s;
}

test('one tree per completed round, newest first, grouped by month', () => {
  const months = gardenMonths([
    round('oct', new Date(2026, 9, 30, 20)),
    round('nov1', new Date(2026, 10, 2, 7)),
    round('nov2', new Date(2026, 10, 19, 21)),
    round('active', new Date(2026, 10, 20), false),
  ]);
  assert.deepEqual(
    months.map((m) => [m.label, m.trees.map((t) => t.sessionId)]),
    [
      ['Nofembar 2026', ['nov2', 'nov1']],
      ['Oktoobar 2026', ['oct']],
    ],
  );
  assert.equal(months[0]!.trees[0]!.count, 2);
  assert.equal(months[0]!.trees[0]!.phase, 'purple');
});

test('gaps between days change nothing and there is no streak data', () => {
  const months = gardenMonths([round('a', new Date(2026, 0, 1)), round('b', new Date(2026, 5, 1))]);
  assert.equal(
    months.reduce((n, m) => n + m.trees.length, 0),
    2,
  );
  assert.deepEqual(Object.keys(months[0]!).sort(), ['key', 'label', 'trees']);
});

test('empty garden', () => {
  assert.deepEqual(gardenMonths([]), []);
});
