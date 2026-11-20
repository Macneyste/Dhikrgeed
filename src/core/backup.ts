// Backup file format and validation. Pure: no React Native or SQLite here.
//
// parseBackup treats the file as hostile. It builds fresh objects from known
// keys only (unknown keys are dropped), sanitizes every string, checks ids,
// counts and targets, and rejects the whole file on any invalid record so an
// import either restores everything or changes nothing. Errors are Somali.

import { HIJRI_ADJUSTMENTS, type HijriAdjustment } from './hijri.ts';
import { CITIES, CUSTOM_CITY_ID, parseCustomCity, type CustomCity } from './cities.ts';
import { parseReminderSettings, type ReminderSettings } from './reminders.ts';
import { PHASES, type DhikrSnapshot, type Phase, type Session, type SessionItem } from './types.ts';
import { isValidId, LIMITS, sanitizeText, validateCustomDhikr } from './validation.ts';

export const BACKUP_FORMAT = 'dhikrgeed-backup';
export const BACKUP_VERSION = 1;
/** Largest file accepted. The picker checks bytes; parseBackup checks string length. */
export const BACKUP_MAX_BYTES = 5 * 1024 * 1024;

const MAX_SESSIONS = 20_000;
const MAX_CUSTOM = 1_000;
const MAX_ITEMS = 50;
const MAX_LABEL = 120;
/** Snapshot text can come from bundled packs, which may be longer than custom dhikr. */
const MAX_SNAPSHOT_TEXT = 2_000;
const MAX_ISO = 40;

/** Settings that travel with a backup. Device state (onboarding, permission prompts) does not. */
export interface BackupSettings {
  largeText: boolean;
  haptics: boolean;
  volumeKeys: boolean;
  transliteration: boolean;
  meaning: boolean;
  reducedMotion: boolean;
  ramadan: boolean;
  hijriAdjust: HijriAdjustment;
  city: string;
  customCity: CustomCity | null;
  reminders: ReminderSettings;
}

export const BACKUP_BOOL_SETTINGS = [
  'largeText',
  'haptics',
  'volumeKeys',
  'transliteration',
  'meaning',
  'reducedMotion',
  'ramadan',
] as const;

export interface BackupCustomDhikr {
  id: string;
  title: string;
  text: string;
  meaning: string | null;
  target: number;
  createdAt: string;
  updatedAt: string;
}

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  appVersion: string;
  /** Only the settings present and valid in the file. */
  settings: Partial<BackupSettings>;
  customDhikr: BackupCustomDhikr[];
  sessions: Session[];
}

export interface BackupInput {
  now: Date;
  appVersion: string;
  settings: BackupSettings;
  customDhikr: readonly BackupCustomDhikr[];
  sessions: readonly Session[];
}

export function createBackup(input: BackupInput): Backup {
  const { settings } = input;
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: input.now.toISOString(),
    appVersion: input.appVersion,
    settings: {
      largeText: settings.largeText,
      haptics: settings.haptics,
      volumeKeys: settings.volumeKeys,
      transliteration: settings.transliteration,
      meaning: settings.meaning,
      reducedMotion: settings.reducedMotion,
      ramadan: settings.ramadan,
      hijriAdjust: settings.hijriAdjust,
      city: settings.city,
      customCity: settings.customCity,
      reminders: settings.reminders,
    },
    customDhikr: input.customDhikr.map((d) => ({ ...d })),
    sessions: input.sessions.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, snapshot: { ...i.snapshot } })) })),
  };
}

/** File name for an export on the given local day. */
export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `dhikrgeed-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** "12 wareeg, 2 dikri gaar ah" */
export function backupSummary(backup: Pick<Backup, 'sessions' | 'customDhikr'>): string {
  return `${backup.sessions.length} wareeg, ${backup.customDhikr.length} dikri gaar ah`;
}

// ---------------------------------------------------------------------------
// Parsing

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

export const BACKUP_ERRORS = {
  tooLarge: 'Faylku aad buu u weyn yahay. Kaydka ugu weyn waa 5 MB.',
  notJson: 'Faylkani ma aha kayd Dhikrgeed. Qoraalkiisu waa khaldan yahay.',
  wrongFormat: 'Faylkani ma aha kayd Dhikrgeed.',
  futureVersion:
    'Kaydkan waxaa sameeyay nooc ka cusub oo Dhikrgeed ah. Marka hore cusboonaysii app-ka, kadibna isku day mar kale.',
  badVersion: 'Nooca kaydka lama yaqaan.',
  tooMany: 'Kaydku wuxuu leeyahay xog aad u badan.',
  invalid: (what: string) => `Kaydku waa khaldan yahay (${what}). Waxba lama beddelin.`,
} as const;

class Invalid extends Error {}

const fail = (what: string): never => {
  throw new Invalid(what);
};

type Obj = Record<string, unknown>;

function obj(value: unknown, what: string): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(what);
  return value as Obj;
}

function arr(value: unknown, what: string, max: number): unknown[] {
  if (!Array.isArray(value)) fail(what);
  const list = value as unknown[];
  if (list.length > max) throw new Invalid('tooMany');
  return list;
}

function id(value: unknown, what: string): string {
  if (!isValidId(value)) fail(what);
  return value as string;
}

function int(value: unknown, what: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) fail(what);
  return value as number;
}

function iso(value: unknown, what: string): string {
  if (typeof value !== 'string' || value.length > MAX_ISO || !/^\d{4}-\d{2}-\d{2}T/.test(value)) fail(what);
  const t = Date.parse(value as string);
  if (!Number.isFinite(t)) fail(what);
  return new Date(t).toISOString();
}

function text(value: unknown, what: string, max: number, multiline: boolean): string {
  if (typeof value !== 'string') fail(what);
  const clean = sanitizeText(value as string, multiline);
  if (Array.from(clean).length > max) fail(what);
  return clean;
}

function parseSettings(value: unknown): Partial<BackupSettings> {
  if (value === undefined) return {};
  const raw = obj(value, 'settings');
  const out: Partial<BackupSettings> = {};
  for (const key of BACKUP_BOOL_SETTINGS) {
    if (typeof raw[key] === 'boolean') out[key] = raw[key] as boolean;
  }
  if (HIJRI_ADJUSTMENTS.includes(raw.hijriAdjust as HijriAdjustment))
    out.hijriAdjust = raw.hijriAdjust as HijriAdjustment;
  if (typeof raw.city === 'string' && (raw.city === CUSTOM_CITY_ID || CITIES.some((c) => c.id === raw.city))) {
    out.city = raw.city;
  }
  if (raw.customCity !== undefined) {
    const city = raw.customCity === null ? null : parseCustomCity(JSON.stringify(raw.customCity));
    if (raw.customCity !== null && city === null) fail('settings.customCity');
    out.customCity = city;
  }
  // A custom city id needs its coordinates.
  if (out.city === CUSTOM_CITY_ID && !out.customCity) delete out.city;
  if (raw.reminders !== undefined) out.reminders = parseReminderSettings(JSON.stringify(raw.reminders));
  return out;
}

function parseCustom(value: unknown, i: number): BackupCustomDhikr {
  const where = `customDhikr[${i}]`;
  const raw = obj(value, where);
  const checked = validateCustomDhikr({
    title: typeof raw.title === 'string' ? raw.title : '',
    text: typeof raw.text === 'string' ? raw.text : '',
    meaning: typeof raw.meaning === 'string' ? raw.meaning : null,
    target: raw.target as number,
  });
  if (!checked.ok) fail(where);
  const v = (checked as Extract<typeof checked, { ok: true }>).value;
  return {
    id: id(raw.id, `${where}.id`),
    title: v.title,
    text: v.text,
    meaning: v.meaning,
    target: v.target,
    createdAt: iso(raw.createdAt, `${where}.createdAt`),
    updatedAt: iso(raw.updatedAt, `${where}.updatedAt`),
  };
}

function parseSnapshot(value: unknown, where: string): DhikrSnapshot {
  const raw = obj(value, where);
  if (!PHASES.includes(raw.phase as Phase)) fail(`${where}.phase`);
  return {
    label: text(raw.label, `${where}.label`, MAX_LABEL, false),
    arabic: text(raw.arabic, `${where}.arabic`, MAX_SNAPSHOT_TEXT, true),
    transliteration: text(raw.transliteration ?? '', `${where}.transliteration`, MAX_SNAPSHOT_TEXT, true),
    meaning: text(raw.meaning ?? '', `${where}.meaning`, MAX_SNAPSHOT_TEXT, true),
    phase: raw.phase as Phase,
    custom: raw.custom === true,
  };
}

function parseItem(value: unknown, where: string): SessionItem {
  const raw = obj(value, where);
  const target = int(raw.target, `${where}.target`, LIMITS.minTarget, LIMITS.maxTarget);
  return {
    itemId: id(raw.itemId, `${where}.itemId`),
    dhikrId: id(raw.dhikrId, `${where}.dhikrId`),
    position: int(raw.position, `${where}.position`, 0, MAX_ITEMS - 1),
    target,
    count: int(raw.count, `${where}.count`, 0, target),
    snapshot: parseSnapshot(raw.snapshot, `${where}.snapshot`),
  };
}

function parseSession(value: unknown, i: number): Session {
  const where = `sessions[${i}]`;
  const raw = obj(value, where);
  const status = raw.status;
  if (status !== 'active' && status !== 'completed') fail(`${where}.status`);
  const items = arr(raw.items, `${where}.items`, MAX_ITEMS).map((it, j) => parseItem(it, `${where}.items[${j}]`));
  if (items.length === 0) fail(`${where}.items`);
  items.sort((a, b) => a.position - b.position);
  items.forEach((it, j) => {
    if (it.position !== j) fail(`${where}.items.position`);
  });
  if (new Set(items.map((it) => it.itemId)).size !== items.length) fail(`${where}.items.itemId`);

  const allDone = items.every((it) => it.count === it.target);
  if ((status === 'completed') !== allDone) fail(`${where}.status`);
  const completedAt = raw.completedAt === null || raw.completedAt === undefined ? null : iso(raw.completedAt, where);
  if ((status === 'completed') !== (completedAt !== null)) fail(`${where}.completedAt`);

  return {
    id: id(raw.id, `${where}.id`),
    collectionId: id(raw.collectionId, `${where}.collectionId`),
    contentVersion: int(raw.contentVersion, `${where}.contentVersion`, 1, 1_000_000),
    status: status as Session['status'],
    revision: int(raw.revision ?? 0, `${where}.revision`, 0, Number.MAX_SAFE_INTEGER),
    startedAt: iso(raw.startedAt, `${where}.startedAt`),
    updatedAt: iso(raw.updatedAt, `${where}.updatedAt`),
    completedAt,
    items,
  };
}

/** Validates a backup file's text. Never throws. */
export function parseBackup(json: string): ParseResult {
  if (typeof json !== 'string' || json.length > BACKUP_MAX_BYTES) return { ok: false, error: BACKUP_ERRORS.tooLarge };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: BACKUP_ERRORS.notJson };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: BACKUP_ERRORS.wrongFormat };
  }
  const raw = data as Obj;
  if (raw.format !== BACKUP_FORMAT) return { ok: false, error: BACKUP_ERRORS.wrongFormat };
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1) {
    return { ok: false, error: BACKUP_ERRORS.badVersion };
  }
  if (raw.version > BACKUP_VERSION) return { ok: false, error: BACKUP_ERRORS.futureVersion };

  try {
    const customDhikr = arr(raw.customDhikr ?? [], 'customDhikr', MAX_CUSTOM).map(parseCustom);
    const sessions = arr(raw.sessions ?? [], 'sessions', MAX_SESSIONS).map(parseSession);

    if (new Set(customDhikr.map((d) => d.id)).size !== customDhikr.length) fail('customDhikr.id');
    if (new Set(sessions.map((s) => s.id)).size !== sessions.length) fail('sessions.id');
    const active = sessions.filter((s) => s.status === 'active').map((s) => s.collectionId);
    if (new Set(active).size !== active.length) fail('sessions.active');

    return {
      ok: true,
      backup: {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: typeof raw.exportedAt === 'string' ? iso(raw.exportedAt, 'exportedAt') : '',
        appVersion: typeof raw.appVersion === 'string' ? text(raw.appVersion, 'appVersion', 32, false) : '',
        settings: parseSettings(raw.settings),
        customDhikr,
        sessions,
      },
    };
  } catch (error) {
    if (error instanceof Invalid) {
      return {
        ok: false,
        error: error.message === 'tooMany' ? BACKUP_ERRORS.tooMany : BACKUP_ERRORS.invalid(error.message),
      };
    }
    return { ok: false, error: BACKUP_ERRORS.invalid('?') };
  }
}
