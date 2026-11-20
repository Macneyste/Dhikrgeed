import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BACKUP_ERRORS,
  BACKUP_MAX_BYTES,
  backupFileName,
  backupSummary,
  createBackup,
  parseBackup,
  type BackupInput,
} from '../../src/core/backup.ts';
import { DEFAULT_REMINDER_SETTINGS } from '../../src/core/reminders.ts';
import { createSession, tap } from '../../src/core/session.ts';
import type { Session } from '../../src/core/types.ts';
import { spec, T0 } from './helpers.ts';

function tapN(session: Session, n: number): Session {
  let s = session;
  for (let i = 0; i < n; i += 1) s = tap(s, T0).session;
  return s;
}

function sampleInput(): BackupInput {
  const active = tapN(
    createSession({
      id: 'a1',
      collectionId: 'tasbih',
      contentVersion: 1,
      items: [spec('x', 3), spec('y', 2)],
      now: T0,
    }),
    4,
  );
  const done = tapN(
    createSession({ id: 'c1', collectionId: 'custom:d1', contentVersion: 1, items: [spec('custom-1', 2)], now: T0 }),
    2,
  );
  return {
    now: T0,
    appVersion: '0.2.0',
    settings: {
      largeText: true,
      haptics: false,
      volumeKeys: true,
      transliteration: true,
      meaning: false,
      reducedMotion: true,
      ramadan: true,
      hijriAdjust: -1,
      city: 'custom',
      customCity: { lat: 2.04, lng: 45.34, name: 'Guriga' },
      reminders: { ...DEFAULT_REMINDER_SETTINGS, prayers: { ...DEFAULT_REMINDER_SETTINGS.prayers, fajr: true } },
    },
    customDhikr: [
      {
        id: 'd1',
        title: 'Salawaat',
        text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
        meaning: null,
        target: 2,
        createdAt: T0.toISOString(),
        updatedAt: T0.toISOString(),
      },
    ],
    sessions: [active, done],
  };
}

const json = (value: unknown) => JSON.stringify(value);
const sample = () => JSON.parse(json(createBackup(sampleInput()))) as Record<string, any>;

function expectError(value: unknown, pattern: RegExp | string) {
  const r = parseBackup(typeof value === 'string' ? value : json(value));
  assert.equal(r.ok, false, 'expected the backup to be refused');
  if (!r.ok) {
    if (typeof pattern === 'string') assert.equal(r.error, pattern);
    else assert.match(r.error, pattern);
  }
}

test('round-trip restores settings, custom dhikr and sessions exactly', () => {
  const backup = createBackup(sampleInput());
  const r = parseBackup(json(backup));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.backup, backup);
  assert.equal(r.backup.sessions[0]!.items[0]!.count, 3);
  assert.equal(r.backup.sessions[1]!.status, 'completed');
});

test('export contains no device identifiers and only documented keys', () => {
  const b = sample();
  assert.deepEqual(Object.keys(b).sort(), [
    'appVersion',
    'customDhikr',
    'exportedAt',
    'format',
    'sessions',
    'settings',
    'version',
  ]);
  assert.equal('onboarded' in b.settings, false);
  assert.equal('notificationsAsked' in b.settings, false);
  assert.doesNotMatch(json(b), /device|android_id|imei|serial/i);
});

test('summary and file name', () => {
  assert.equal(backupSummary(createBackup(sampleInput())), '2 wareeg, 1 dikri gaar ah');
  assert.equal(backupFileName(new Date(2026, 10, 5, 23, 0)), 'dhikrgeed-backup-2026-11-05.json');
});

test('wrong format, broken JSON and non-objects are refused', () => {
  expectError('not json {', BACKUP_ERRORS.notJson);
  expectError('[]', BACKUP_ERRORS.wrongFormat);
  expectError('null', BACKUP_ERRORS.wrongFormat);
  expectError({ ...sample(), format: 'other-app' }, BACKUP_ERRORS.wrongFormat);
  expectError({ ...sample(), version: '1' }, BACKUP_ERRORS.badVersion);
});

test('a backup from a future version is refused with a clear Somali message', () => {
  expectError({ ...sample(), version: 2 }, BACKUP_ERRORS.futureVersion);
  assert.match(BACKUP_ERRORS.futureVersion, /cusboonaysii app-ka/);
});

test('files over 5 MB are refused before parsing', () => {
  expectError(' '.repeat(BACKUP_MAX_BYTES + 1), BACKUP_ERRORS.tooLarge);
});

test('counts above the target, negative or fractional counts are refused', () => {
  for (const count of [4, -1, 1.5, '2', null]) {
    const b = sample();
    b.sessions[0].items[0].count = count;
    expectError(b, /sessions\[0\]\.items\[0\]\.count/);
  }
  const b = sample();
  b.sessions[0].items[0].target = 1_000_000;
  expectError(b, /target/);
});

test('status must match the counts', () => {
  const b = sample();
  b.sessions[1].status = 'active';
  b.sessions[1].completedAt = null;
  expectError(b, /status/);
  const c = sample();
  c.sessions[0].status = 'completed';
  expectError(c, /status/);
});

test('ids outside the allowed pattern are refused', () => {
  for (const bad of ['../etc', 'A1', '', 'x'.repeat(65), 'a b', "a'; DROP TABLE sessions;--"]) {
    const b = sample();
    b.sessions[0].id = bad;
    expectError(b, /sessions\[0\]\.id/);
    const c = sample();
    c.customDhikr[0].id = bad;
    expectError(c, /customDhikr\[0\]\.id/);
  }
});

test('duplicate ids and two active rounds for one collection are refused', () => {
  const b = sample();
  b.sessions[1] = { ...b.sessions[0] };
  expectError(b, /sessions\.id/);
  const c = sample();
  c.sessions[1] = { ...c.sessions[0], id: 'a2' };
  expectError(c, /sessions\.active/);
});

test('malicious strings are sanitized or refused', () => {
  const b = sample();
  b.customDhikr[0].title = '\u202Eevil\u0000 name';
  b.sessions[0].items[0].snapshot.label = 'x\u2066y\u0007';
  const r = parseBackup(json(b));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.backup.customDhikr[0]!.title, 'evil name');
  assert.equal(r.backup.sessions[0]!.items[0]!.snapshot.label, 'xy');

  const long = sample();
  long.customDhikr[0].text = 'ا'.repeat(501);
  expectError(long, /customDhikr\[0\]/);

  const notString = sample();
  notString.sessions[0].items[0].snapshot.arabic = { toString: 'x' };
  expectError(notString, /snapshot\.arabic/);
});

test('unknown keys are dropped, including __proto__', () => {
  const text = json(sample()).replace('"format"', '"__proto__":{"polluted":true},"extra":1,"format"');
  const r = parseBackup(text);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal('extra' in r.backup, false);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
  assert.equal(Object.getPrototypeOf(r.backup), Object.prototype);
});

test('invalid settings are ignored or refused, never stored blindly', () => {
  const b = sample();
  b.settings.largeText = 'yes';
  b.settings.city = 'atlantis';
  b.settings.reminders = { prayers: { fajr: 'on' }, offsetMinutes: 99 };
  b.settings.onboarded = false;
  b.settings.hijriAdjust = 7;
  const r = parseBackup(json(b));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal('largeText' in r.backup.settings, false);
  assert.equal('city' in r.backup.settings, false);
  assert.equal('onboarded' in r.backup.settings, false);
  assert.equal('hijriAdjust' in r.backup.settings, false);
  assert.equal(r.backup.settings.reminders?.prayers.fajr, false);
  assert.equal(r.backup.settings.reminders?.offsetMinutes, 0);

  const c = sample();
  c.settings.customCity = { lat: 999, lng: 0, name: 'x' };
  expectError(c, /customCity/);
});

test('too many records are refused', () => {
  const b = sample();
  b.customDhikr = Array.from({ length: 1_001 }, (_, i) => ({ ...b.customDhikr[0], id: `d${i}` }));
  expectError(b, BACKUP_ERRORS.tooMany);
});
