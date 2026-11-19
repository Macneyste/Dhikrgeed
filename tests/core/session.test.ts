import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  canUndo,
  createSession,
  createTapGate,
  currentIndex,
  reset,
  tap,
  totalCount,
  totalTarget,
  undo,
} from '../../src/core/session.ts';
import type { Session } from '../../src/core/types.ts';
import { spec, T0 } from './helpers.ts';

const tasbih = () =>
  createSession({
    id: 's1',
    collectionId: 'tasbih',
    contentVersion: 1,
    items: [spec('a', 33, 'teal'), spec('b', 33, 'purple'), spec('c', 34, 'gold')],
    now: T0,
  });

function tapN(session: Session, n: number): Session {
  let s = session;
  for (let i = 0; i < n; i += 1) s = tap(s, T0).session;
  return s;
}

test('one tap counts exactly one on the current item', () => {
  const r = tap(tasbih(), T0);
  assert.equal(r.accepted, true);
  assert.deepEqual(r.session.items.map((i) => i.count), [1, 0, 0]);
});

test('reaching a target moves to the next item', () => {
  const s = tapN(tasbih(), 32);
  const r = tap(s, T0);
  assert.equal(r.itemCompleted, true);
  assert.equal(r.roundCompleted, false);
  assert.equal(currentIndex(r.session), 1);
});

test('33/33/34 totals 100 and completes the round', () => {
  const s = tapN(tasbih(), 100);
  assert.equal(totalTarget(s), 100);
  assert.equal(totalCount(s), 100);
  assert.equal(s.status, 'completed');
  assert.ok(s.completedAt);
});

test('extra taps never exceed targets', () => {
  const s = tapN(tasbih(), 150);
  assert.deepEqual(s.items.map((i) => i.count), [33, 33, 34]);
  const r = tap(s, T0);
  assert.equal(r.accepted, false);
  assert.equal(r.session, s);
});

test('undo removes the last count', () => {
  const s = tapN(tasbih(), 5);
  const r = undo(s, T0);
  assert.equal(r.changed, true);
  assert.equal(r.session.items[0]!.count, 4);
});

test('undo crosses back into the previous completed item', () => {
  const s = tapN(tasbih(), 33);
  assert.equal(currentIndex(s), 1);
  const r = undo(s, T0);
  assert.deepEqual(r.session.items.map((i) => i.count), [32, 0, 0]);
  assert.equal(currentIndex(r.session), 0);
});

test('undo after completion makes the round active again', () => {
  const s = tapN(tasbih(), 100);
  const r = undo(s, T0);
  assert.equal(r.session.status, 'active');
  assert.equal(r.session.completedAt, null);
  assert.equal(totalCount(r.session), 99);
});

test('undo on an empty round does nothing', () => {
  const s = tasbih();
  assert.equal(canUndo(s), false);
  assert.equal(undo(s, T0).changed, false);
});

test('reset sets every count to zero and reactivates', () => {
  const s = reset(tapN(tasbih(), 100), T0);
  assert.equal(totalCount(s), 0);
  assert.equal(s.status, 'active');
  assert.equal(s.id, 's1');
});

test('the round keeps a snapshot independent of the source specs', () => {
  const items = [spec('a', 3)];
  const s = createSession({ id: 's', collectionId: 'c', contentVersion: 1, items, now: T0 });
  items[0]!.snapshot.arabic = 'changed';
  items[0]!.target = 99;
  assert.equal(s.items[0]!.snapshot.arabic, 'ع');
  assert.equal(s.items[0]!.target, 3);
});

test('createSession rejects empty rounds and invalid targets', () => {
  assert.throws(() => createSession({ id: 's', collectionId: 'c', contentVersion: 1, items: [], now: T0 }));
  assert.throws(() =>
    createSession({ id: 's', collectionId: 'c', contentVersion: 1, items: [spec('a', 0)], now: T0 }),
  );
});

test('tap gate locks taps during the transition window', () => {
  const gate = createTapGate(450);
  assert.equal(gate.accept(1000), true);
  gate.lock(1000);
  assert.equal(gate.accept(1200), false);
  assert.equal(gate.isLocked(1449), true);
  assert.equal(gate.accept(1450), true);
});
