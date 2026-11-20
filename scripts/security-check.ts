// Static security checks run in CI (npm run security).
// Fails when app code can reach the network, run dynamic code, render HTML,
// build SQL from template strings, when hidden bidi characters appear in the
// source, when secret files are tracked, or when app.json permissions drift.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const CODE_DIRS = ['src', 'app', 'modules'];
const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

const FORBIDDEN: Array<[RegExp, string]> = [
  [/\bfetch\s*\(/, 'network call (fetch)'],
  [/\bXMLHttpRequest\b/, 'network call (XMLHttpRequest)'],
  [/\bWebSocket\b/, 'network call (WebSocket)'],
  [/\beval\s*\(/, 'eval'],
  [/\bnew\s+Function\s*\(/, 'new Function'],
  [/dangerouslySetInnerHTML/, 'raw HTML rendering'],
  [/WebView/, 'web view'],
  [
    /`[^`]*\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|PRAGMA|REPLACE)\b[^`]*\$\{[^`]*`/i,
    'SQL built with a template string; use bound parameters (?)',
  ],
];

const SECRET_FILE = [
  /(^|\/)\.env(\.(?!example$)[^/]*)?$/,
  /\.(jks|keystore|p8|p12|pem|key|mobileprovision)$/i,
  /(^|\/)keystore\.properties$/,
  /(^|\/)google-services\.json$/,
  /(^|\/)GoogleService-Info\.plist$/,
  /(^|\/)credentials\.json$/,
  /(^|\/)service-account[^/]*\.json$/,
];

const isHiddenBidi = (n: number) => (n >= 0x202a && n <= 0x202e) || (n >= 0x2066 && n <= 0x2069);
// Zero-width space/joiners and byte-order marks hidden inside files.
const isInvisible = (n: number) => (n >= 0x200b && n <= 0x200d) || n === 0xfeff;

const REQUIRED_PERMISSIONS = ['android.permission.POST_NOTIFICATIONS', 'android.permission.VIBRATE'];
const REQUIRED_BLOCKED = [
  'RECORD_AUDIO',
  'CAMERA',
  'ACCESS_FINE_LOCATION',
  'ACCESS_COARSE_LOCATION',
  'ACCESS_BACKGROUND_LOCATION',
  'READ_CONTACTS',
  'READ_EXTERNAL_STORAGE',
  'WRITE_EXTERNAL_STORAGE',
  'READ_MEDIA_IMAGES',
  'SYSTEM_ALERT_WINDOW',
  'SCHEDULE_EXACT_ALARM',
  'ACTIVITY_RECOGNITION',
  'HIGH_SAMPLING_RATE_SENSORS',
].map((p) => `android.permission.${p}`);

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function trackedFiles(): string[] {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return out.split('\0').filter(Boolean);
  } catch {
    return walk(ROOT).map((f) => relative(ROOT, f).replace(/\\/g, '/'));
  }
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

export function runSecurityCheck(): string[] {
  const problems: string[] = [];

  for (const dir of CODE_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      if (!CODE_EXT.test(file)) continue;
      const text = readFileSync(file, 'utf8');
      const rel = relative(ROOT, file).replace(/\\/g, '/');
      for (const [pattern, label] of FORBIDDEN) {
        const m = pattern.exec(text);
        if (m) problems.push(`${rel}:${lineOf(text, m.index)} ${label}`);
      }
    }
  }

  for (const rel of trackedFiles()) {
    if (SECRET_FILE.some((p) => p.test(rel))) problems.push(`${rel}: secret or signing file is tracked`);
    if (!/\.(ts|tsx|js|jsx|json|md|yml|yaml|cjs|mjs)$/.test(rel)) continue;
    let text: string;
    try {
      text = readFileSync(join(ROOT, rel), 'utf8');
    } catch {
      continue;
    }
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      if (isHiddenBidi(code)) {
        problems.push(`${rel}:${lineOf(text, i)} hidden bidi control character`);
        break;
      }
      if (isInvisible(code)) {
        problems.push(`${rel}:${lineOf(text, i)} invisible character`);
        break;
      }
      if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
        problems.push(`${rel}:${lineOf(text, i)} raw control character`);
        break;
      }
    }
  }

  const app = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')) as {
    expo: { android?: { permissions?: string[]; blockedPermissions?: string[]; allowBackup?: boolean } };
  };
  const android = app.expo.android ?? {};
  const perms = [...(android.permissions ?? [])].sort();
  if (JSON.stringify(perms) !== JSON.stringify([...REQUIRED_PERMISSIONS].sort())) {
    problems.push(`app.json: android.permissions must be exactly ${REQUIRED_PERMISSIONS.join(', ')}`);
  }
  for (const p of REQUIRED_BLOCKED) {
    if (!(android.blockedPermissions ?? []).includes(p)) problems.push(`app.json: ${p} must be blocked`);
  }
  if (android.allowBackup !== false) problems.push('app.json: android.allowBackup must be false');

  return problems;
}

const problems = runSecurityCheck();
if (problems.length > 0) {
  console.error(`Security check failed (${problems.length}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('Security check OK.');
