import assert from 'node:assert/strict';
import { test } from 'node:test';

import { progress, treeLayers, treeStage } from '../../src/core/progress.ts';

test('progress is Σ min(count, target) / Σ target', () => {
  assert.equal(
    progress([
      { count: 33, target: 33 },
      { count: 17, target: 67 },
    ]),
    0.5,
  );
  assert.equal(
    progress([
      { count: 50, target: 10 },
      { count: 0, target: 10 },
    ]),
    0.5,
  );
  assert.equal(progress([]), 0);
});

test('tree stages follow the progress thresholds', () => {
  const cases: Array<[number, number]> = [
    [0, 0],
    [0.01, 1],
    [0.15, 1],
    [0.16, 2],
    [0.35, 2],
    [0.36, 3],
    [0.6, 3],
    [0.61, 4],
    [0.8, 4],
    [0.81, 5],
    [0.99, 5],
    [1, 6],
  ];
  for (const [p, index] of cases) assert.equal(treeStage(p).index, index, `p=${p}`);
});

test('tree layers: seed at 0, fruit near the end, extra fruit at 100%', () => {
  assert.equal(treeLayers(0).seed, true);
  assert.equal(treeLayers(0).branches, false);
  const late = treeLayers(0.9);
  assert.equal(late.flowers && late.fruits, true);
  assert.equal(late.extraFruits, false);
  assert.equal(treeLayers(1).extraFruits, true);
  assert.equal(treeLayers(1).stage.label, 'Geed dhammeystiran');
});
