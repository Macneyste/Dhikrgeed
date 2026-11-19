import type { SQLiteDatabase } from 'expo-sqlite';

export interface Migration {
  version: number;
  sql: string;
}

/** Append-only. Never edit a migration that has shipped; add a new one. */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    sql: `
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  content_version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','completed')),
  revision INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE UNIQUE INDEX one_active_per_collection ON sessions(collection_id) WHERE status = 'active';
CREATE INDEX sessions_completed_at ON sessions(completed_at) WHERE status = 'completed';
CREATE TABLE session_items (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  dhikr_id TEXT NOT NULL,
  target_count INTEGER NOT NULL CHECK (target_count > 0),
  current_count INTEGER NOT NULL CHECK (current_count BETWEEN 0 AND target_count),
  content_snapshot TEXT NOT NULL,
  PRIMARY KEY (session_id, item_id)
);
CREATE TABLE custom_dhikr (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  meaning TEXT,
  target_count INTEGER NOT NULL CHECK (target_count BETWEEN 1 AND 9999),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`,
  },
];

export class MigrationError extends Error {
  version: number;
  constructor(version: number, cause: unknown) {
    super(`Migration ${version} failed`);
    this.name = 'MigrationError';
    this.version = version;
    this.cause = cause;
  }
}

/**
 * Applies pending migrations, each in its own transaction. A failure throws
 * MigrationError and leaves the database as it was; it is never deleted.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);',
  );
  const row = await db.getFirstAsync<{ v: number | null }>('SELECT MAX(version) AS v FROM schema_migrations');
  const current = row?.v ?? 0;
  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    try {
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync(migration.sql);
        await txn.runAsync('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
          migration.version,
          new Date().toISOString(),
        ]);
      });
    } catch (error) {
      throw new MigrationError(migration.version, error);
    }
  }
}
