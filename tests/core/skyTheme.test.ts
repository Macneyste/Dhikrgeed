import assert from 'node:assert/strict';
import { test } from 'node:test';

import { darken, skyThemes } from '../../src/theme/theme.ts';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

test('text on every sky stop has at least 4.5:1 contrast', () => {
  for (const [period, t] of Object.entries(skyThemes)) {
    for (const stop of t.stops) {
      assert.ok(contrast(t.ink, stop) >= 4.5, `${period} ink on ${stop}: ${contrast(t.ink, stop).toFixed(2)}`);
      assert.ok(contrast(t.soft, stop) >= 4.5, `${period} soft on ${stop}: ${contrast(t.soft, stop).toFixed(2)}`);
    }
  }
});

test('text on the grass has at least 4.5:1 contrast', () => {
  for (const [period, t] of Object.entries(skyThemes)) {
    for (const g of t.grass.slice(1)) {
      assert.ok(contrast(t.onGrass, g) >= 4.5, `${period} on grass ${g}: ${contrast(t.onGrass, g).toFixed(2)}`);
    }
  }
});

test('night grass is darkened by 40%', () => {
  assert.equal(darken('#FFFFFF', 0.4), '#999999');
  assert.equal(skyThemes.night.grass[0], darken(skyThemes.day.grass[0], 0.4));
});
