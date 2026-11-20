// Export and import of the person's own backup file.
// All validation lives in src/core/backup.ts; this file only does I/O.

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  BACKUP_BOOL_SETTINGS,
  BACKUP_ERRORS,
  BACKUP_MAX_BYTES,
  backupFileName,
  createBackup,
  parseBackup,
  type Backup,
} from '../core/backup.ts';
import { parseCustomCity } from '../core/cities.ts';
import { getDatabase } from '../db/database';
import { listCustomDhikr } from '../db/customDhikrRepo';
import { insertSession, listAllSessions } from '../db/sessionRepo';
import { saveSetting, type AppSettings } from '../db/settingsRepo';
import { withSessionLock } from './sessionService';

/** Writes the backup to the cache folder and opens the share sheet. */
export async function exportBackup(settings: AppSettings, appVersion: string): Promise<void> {
  const db = await getDatabase();
  const [customDhikr, sessions] = await withSessionLock(() => Promise.all([listCustomDhikr(db), listAllSessions(db)]));
  const now = new Date();
  const backup = createBackup({
    now,
    appVersion,
    settings: { ...settings, customCity: parseCustomCity(settings.customCity) },
    customDhikr,
    sessions,
  });
  const file = new File(Paths.cache, backupFileName(now));
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(backup));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Dhoofi kaydka',
    UTI: 'public.json',
  });
}

export type PickResult = { kind: 'cancelled' } | { kind: 'error'; error: string } | { kind: 'ok'; backup: Backup };

/** Lets the person choose a file and validates it. Changes nothing. */
export async function pickBackup(): Promise<PickResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (picked.canceled || !picked.assets?.[0]) return { kind: 'cancelled' };
  const asset = picked.assets[0];
  const file = new File(asset.uri);
  try {
    const size = asset.size ?? file.size ?? 0;
    if (size > BACKUP_MAX_BYTES) return { kind: 'error', error: BACKUP_ERRORS.tooLarge };
    const r = parseBackup(await file.text());
    return r.ok ? { kind: 'ok', backup: r.backup } : { kind: 'error', error: r.error };
  } finally {
    try {
      file.delete();
    } catch {
      // The cached copy is temporary anyway.
    }
  }
}

/**
 * Replaces all rounds, custom dhikr and the backed-up settings in one
 * exclusive transaction. On any error nothing changes.
 */
export async function restoreBackup(backup: Backup): Promise<void> {
  const db = await getDatabase();
  await withSessionLock(() =>
    db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync('DELETE FROM session_items');
      await txn.runAsync('DELETE FROM sessions');
      await txn.runAsync('DELETE FROM custom_dhikr');
      for (const d of backup.customDhikr) {
        await txn.runAsync(
          'INSERT INTO custom_dhikr (id, title, text, meaning, target_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [d.id, d.title, d.text, d.meaning, d.target, d.createdAt, d.updatedAt],
        );
      }
      for (const s of backup.sessions) await insertSession(txn, s);

      const st = backup.settings;
      for (const key of BACKUP_BOOL_SETTINGS) {
        if (st[key] !== undefined) await saveSetting(txn, key, st[key]);
      }
      if (st.customCity !== undefined) {
        await saveSetting(txn, 'customCity', st.customCity ? JSON.stringify(st.customCity) : null);
      }
      if (st.city !== undefined) await saveSetting(txn, 'city', st.city);
      if (st.reminders !== undefined) await saveSetting(txn, 'reminders', st.reminders);
    }),
  );
}
