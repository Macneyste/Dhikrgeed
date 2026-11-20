// App-wide instance of the safe in-memory log (src/core/log.ts). Nothing is
// written to disk or sent anywhere; it only feeds a bug report the person sends.

import { createLog, type LogEntry } from '../core/log.ts';

const log = createLog();

export function logEvent(level: LogEntry['level'], event: string): void {
  log.add(level, event);
}

export function logLines(): string[] {
  return log.lines();
}
