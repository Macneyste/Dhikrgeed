import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ADHKAR } from '../../src/content/index.ts';
import { RANGES } from '../../scripts/font-ranges.mjs';

const ranges = RANGES as [number, number][];
const covered = (cp: number) => ranges.some(([from, to]) => cp >= from && cp <= to);

test('every character in bundled Arabic text is in the Amiri subset', () => {
  const missing = new Set<string>();
  for (const d of ADHKAR) {
    for (const ch of d.arabic) {
      const cp = ch.codePointAt(0)!;
      if (ch !== '\n' && !covered(cp)) missing.add(`U+${cp.toString(16).toUpperCase().padStart(4, '0')} in ${d.id}`);
    }
  }
  assert.deepEqual([...missing], []);
});
