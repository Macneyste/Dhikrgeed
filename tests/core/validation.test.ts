import assert from 'node:assert/strict';
import { test } from 'node:test';

import { routeFromNotificationData, safeRouteId } from '../../src/core/routes.ts';
import { isValidId, sanitizeText, validateCustomDhikr } from '../../src/core/validation.ts';

test('valid custom dhikr is trimmed and accepted', () => {
  const r = validateCustomDhikr({ title: '  Salawaat ', text: 'اللهم صل على محمد', meaning: '', target: 100 });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.title, 'Salawaat');
    assert.equal(r.value.meaning, null);
  }
});

test('missing fields and bad targets give Somali errors', () => {
  const r = validateCustomDhikr({ title: ' ', text: '', target: 0 });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.match(r.errors.title!, /Magaca/);
    assert.match(r.errors.text!, /Qoraalka/);
    assert.match(r.errors.target!, /9999/);
  }
  assert.equal(validateCustomDhikr({ title: 'a', text: 'b', target: 10000 }).ok, false);
  assert.equal(validateCustomDhikr({ title: 'a', text: 'b', target: 1.5 }).ok, false);
});

test('length limits are enforced', () => {
  const r = validateCustomDhikr({ title: 'x'.repeat(61), text: 'y'.repeat(501), meaning: 'z'.repeat(501), target: 1 });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ['meaning', 'text', 'title']);
});

test('control and bidi-override characters are removed', () => {
  assert.equal(sanitizeText('a‮b\u0007c⁦d', false), 'abcd');
  assert.equal(sanitizeText('line1\r\n\n\n\nline2', true), 'line1\n\nline2');
  assert.equal(sanitizeText('one\ntwo', false), 'one two');
});

test('id pattern allows only short lowercase ids', () => {
  assert.equal(isValidId('custom:3f2a-b'), true);
  assert.equal(isValidId('../etc'), false);
  assert.equal(isValidId('A'), false);
  assert.equal(isValidId('x'.repeat(65)), false);
  assert.equal(safeRouteId(['tasbih']), 'tasbih');
  assert.equal(safeRouteId('bad id'), null);
});

test('notification routes are allowlisted', () => {
  assert.equal(routeFromNotificationData({ route: 'after-prayer' }), '/session/after-prayer');
  assert.equal(routeFromNotificationData({ route: 'https://evil.example' }), null);
  assert.equal(routeFromNotificationData({ route: 'toString' }), null);
  assert.equal(routeFromNotificationData(null), null);
});
