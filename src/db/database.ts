import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';

const DB_NAME = 'dhikrgeed.db';

let opening: Promise<SQLiteDatabase> | null = null;

async function open(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  await runMigrations(db);
  return db;
}

/** Opens the database once and runs migrations. Later calls reuse it. */
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!opening) {
    opening = open().catch((error: unknown) => {
      opening = null; // allow a retry from the error screen
      throw error;
    });
  }
  return opening;
}

export type { SQLiteDatabase };
