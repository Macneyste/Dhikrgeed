import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectionItemSpecs, collectionTotal, getCollection, isDraft } from '../../src/content/index.ts';
import { checkContent } from '../../scripts/validate-content.ts';

test('bundled collections have the documented totals', () => {
  assert.equal(collectionTotal(getCollection('tasbih')!), 100);
  assert.equal(collectionTotal(getCollection('after-prayer')!), 104);
  assert.equal(collectionTotal(getCollection('morning')!), 112);
  assert.equal(collectionTotal(getCollection('evening')!), 112);
});

test('content passes structural checks but is not release-ready while draft', () => {
  assert.deepEqual(checkContent({ release: false }), []);
  assert.ok(checkContent({ release: true }).length > 0);
  assert.equal(isDraft(getCollection('tasbih')!), true);
});

test('item specs carry a full snapshot', () => {
  const specs = collectionItemSpecs(getCollection('tasbih')!);
  assert.equal(specs.length, 3);
  assert.equal(specs[0]!.snapshot.transliteration, 'SubxaanAllaah');
  assert.equal(specs[2]!.target, 34);
});
