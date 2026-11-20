import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compassPoint, KAABA, qiblaBearing, turnToQibla } from '../../src/core/qibla.ts';

/** Independent check: bearing from 3-D unit vectors (north and east tangent vectors). */
function vectorBearing(lat: number, lng: number): number {
  const v = (la: number, lo: number) => {
    const a = (la * Math.PI) / 180;
    const o = (lo * Math.PI) / 180;
    return [Math.cos(a) * Math.cos(o), Math.cos(a) * Math.sin(o), Math.sin(a)] as const;
  };
  const p = v(lat, lng);
  const k = v(KAABA.lat, KAABA.lng);
  const o = (lng * Math.PI) / 180;
  const a = (lat * Math.PI) / 180;
  const east = [-Math.sin(o), Math.cos(o), 0];
  const north = [-Math.sin(a) * Math.cos(o), -Math.sin(a) * Math.sin(o), Math.cos(a)];
  const dot = (x: readonly number[], y: readonly number[]) => x[0]! * y[0]! + x[1]! * y[1]! + x[2]! * y[2]!;
  // Direction of the great circle toward k = component of k perpendicular to p.
  const d = [0, 1, 2].map((i) => k[i]! - dot(k, p) * p[i]!);
  return ((Math.atan2(dot(d, east), dot(d, north)) * 180) / Math.PI + 360) % 360;
}

const CITIES: [string, number, number, [number, number]][] = [
  // name, lat, lng, plausible range (degrees)
  ['Muqdisho', 2.0469, 45.3182, [335, 350]], // north-north-west, ≈ 345°
  ['Nairobi', -1.2921, 36.8219, [0, 15]], // almost due north
  ['London', 51.5074, -0.1278, [118, 120]], // published ≈ 119°
  ['Minneapolis', 44.9778, -93.265, [40, 60]], // north-east across the pole
];

test('bearings for known cities agree with an independent method and expected ranges', () => {
  for (const [name, lat, lng, [lo, hi]] of CITIES) {
    const b = qiblaBearing(lat, lng)!;
    assert.ok(Math.abs(b - vectorBearing(lat, lng)) < 1e-6, `${name}: ${b} vs ${vectorBearing(lat, lng)}`);
    assert.ok(b >= lo && b <= hi, `${name}: ${b.toFixed(2)} not in ${lo}..${hi}`);
  }
});

test('London is about 119 degrees', () => {
  assert.equal(Math.round(qiblaBearing(51.5074, -0.1278)!), 119);
});

test('due south of the Kaaba faces north; at the Kaaba there is no bearing', () => {
  assert.ok(Math.abs(qiblaBearing(10, KAABA.lng)!) < 1e-9);
  assert.equal(qiblaBearing(KAABA.lat, KAABA.lng), null);
  assert.equal(qiblaBearing(Number.NaN, 0), null);
});

test('turn and compass point', () => {
  assert.equal(turnToQibla(10, 350), 20);
  assert.equal(turnToQibla(350, 10), -20);
  assert.equal(turnToQibla(180, 0), -180);
  assert.equal(compassPoint(0), 'Waqooyi');
  assert.equal(compassPoint(119), 'Koonfur-Bari');
  assert.equal(compassPoint(338), 'Waqooyi');
});
