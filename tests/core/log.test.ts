import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bugReportBody, createLog } from '../../src/core/log.ts';

test('keeps only the last 50 entries', () => {
  const log = createLog();
  for (let i = 0; i < 60; i += 1) log.add('info', `event-${i}`, new Date(0));
  const lines = log.lines();
  assert.equal(lines.length, 50);
  assert.match(lines[0]!, /event-10$/);
  assert.match(lines[49]!, /event-59$/);
});

test('never stores free text such as custom dhikr or backup contents', () => {
  const log = createLog();
  log.add('warn', 'سُبْحَانَ اللَّهِ', new Date(0));
  log.add('warn', 'my private note', new Date(0));
  log.add('error', '{"format":"dhikrgeed-backup"}', new Date(0));
  log.add('info', 'db.open:MigrationError', new Date(0));
  assert.deepEqual(log.lines(), [
    '1970-01-01T00:00:00.000Z WARN redacted',
    '1970-01-01T00:00:00.000Z WARN redacted',
    '1970-01-01T00:00:00.000Z ERROR redacted',
    '1970-01-01T00:00:00.000Z INFO db.open:MigrationError',
  ]);
});

test('report body has version, Android, device and log lines only', () => {
  const body = bugReportBody({
    appVersion: '0.2.0',
    androidVersion: '34',
    deviceModel: 'Tecno <script> KG5',
    logLines: ['t INFO a', 't WARN b'],
  });
  assert.match(body, /Dhikrgeed: 0\.2\.0/);
  assert.match(body, /Android: 34/);
  assert.match(body, /Telefoon: Tecno script KG5/);
  assert.match(body, /Log \(2 xariiq/);
  assert.ok(body.endsWith('t INFO a\nt WARN b'));
});
