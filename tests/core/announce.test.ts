import assert from 'node:assert/strict';
import { test } from 'node:test';

import { countAnnouncement } from '../../src/core/announce.ts';
import { createSession, tap } from '../../src/core/session.ts';
import type { Session } from '../../src/core/types.ts';
import { spec, T0 } from './helpers.ts';

function tapped(times: number): { session: Session; itemCompleted: boolean; roundCompleted: boolean } {
  let session = createSession({
    id: 's',
    collectionId: 'c',
    contentVersion: 1,
    items: [spec('a', 12), spec('b', 3)],
    now: T0,
  });
  let last = { itemCompleted: false, roundCompleted: false };
  for (let i = 0; i < times; i += 1) {
    const r = tap(session, T0);
    session = r.session;
    last = { itemCompleted: r.itemCompleted, roundCompleted: r.roundCompleted };
  }
  return { session, ...last };
}

test('quiet on ordinary counts', () => {
  for (const n of [1, 5, 9, 11]) {
    const t = tapped(n);
    assert.equal(countAnnouncement(t.session, t), null, `count ${n}`);
  }
});

test('announces every 10th count', () => {
  const t = tapped(10);
  assert.equal(countAnnouncement(t.session, t), '10 / 15');
});

test('announces the next item when an item completes', () => {
  const t = tapped(12);
  assert.equal(countAnnouncement(t.session, t), 'Dikriga xiga: b, 0 / 3');
});

test('announces the end of the round', () => {
  const t = tapped(15);
  assert.match(countAnnouncement(t.session, t) ?? '', /^Wareegga waa dhammaaday/);
});
