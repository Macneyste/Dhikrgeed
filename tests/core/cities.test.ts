import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CITIES, parseCustomCity, resolveCity } from '../../src/core/cities.ts';

test('city list has unique ids and valid coordinates', () => {
  assert.equal(new Set(CITIES.map((c) => c.id)).size, CITIES.length);
  assert.equal(resolveCity('hargeysa', null).name, 'Hargeysa');
});

test('custom city is validated and falls back to Muqdisho', () => {
  assert.equal(resolveCity('custom', '{"name":"Jowhar","lat":2.78,"lng":45.5}').name, 'Jowhar');
  assert.equal(parseCustomCity('{"name":"x","lat":95,"lng":0}'), null);
  assert.equal(parseCustomCity('not json'), null);
  assert.equal(resolveCity('custom', null).id, 'muqdisho');
  assert.equal(resolveCity('unknown', null).id, 'muqdisho');
});
