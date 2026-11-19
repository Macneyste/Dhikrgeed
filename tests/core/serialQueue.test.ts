import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSerialQueue } from '../../src/core/serialQueue.ts';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('jobs run one at a time in order', async () => {
  const q = createSerialQueue();
  const log: string[] = [];
  const job = (name: string, ms: number) => async () => {
    log.push(`start ${name}`);
    await wait(ms);
    log.push(`end ${name}`);
    return name;
  };
  const results = await Promise.all([q.run(job('a', 20)), q.run(job('b', 1)), q.run(job('c', 5))]);
  assert.deepEqual(results, ['a', 'b', 'c']);
  assert.deepEqual(log, ['start a', 'end a', 'start b', 'end b', 'start c', 'end c']);
  assert.equal(q.size, 0);
});

test('a failing job does not block later jobs', async () => {
  const q = createSerialQueue();
  const failed = q.run(async () => {
    throw new Error('boom');
  });
  const ok = q.run(async () => 42);
  await assert.rejects(failed, /boom/);
  assert.equal(await ok, 42);
});
