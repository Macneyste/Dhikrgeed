// A tiny in-memory log for bug reports. Pure. Only short, fixed event codes
// are accepted (letters, digits and . _ : -), so custom dhikr text, backup
// contents or anything a person typed can never end up in a report.

export const LOG_LIMIT = 50;

const SAFE = /^[A-Za-z0-9._:-]{1,64}$/;

export interface LogEntry {
  at: string;
  level: 'info' | 'warn' | 'error';
  event: string;
}

export function createLog(limit = LOG_LIMIT) {
  const entries: LogEntry[] = [];
  return {
    /** Records `event` if it is a safe code; anything else is stored as "redacted". */
    add(level: LogEntry['level'], event: string, now: Date = new Date()): void {
      entries.push({ at: now.toISOString(), level, event: SAFE.test(event) ? event : 'redacted' });
      if (entries.length > limit) entries.splice(0, entries.length - limit);
    },
    lines(): string[] {
      return entries.map((e) => `${e.at} ${e.level.toUpperCase()} ${e.event}`);
    },
  };
}

export interface ReportInfo {
  appVersion: string;
  androidVersion: string;
  deviceModel: string;
  logLines: readonly string[];
}

const clean = (s: string) => s.replace(/[^A-Za-z0-9 ._()-]/g, '').slice(0, 60) || '?';

/** Body of the bug report email. The person reads and edits it before sending. */
export function bugReportBody(info: ReportInfo): string {
  return [
    'Fadlan halkan ku qor waxa dhacay iyo sidii aad u samaysay:',
    '',
    '',
    '---',
    `Dhikrgeed: ${clean(info.appVersion)}`,
    `Android: ${clean(info.androidVersion)}`,
    `Telefoon: ${clean(info.deviceModel)}`,
    '',
    `Log (${info.logLines.length} xariiq ugu dambeeyay):`,
    ...info.logLines.slice(-LOG_LIMIT),
  ].join('\n');
}
