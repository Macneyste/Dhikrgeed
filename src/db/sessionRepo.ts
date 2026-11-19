import type { SQLiteDatabase } from 'expo-sqlite';

import { PHASES, type DhikrSnapshot, type Session, type SessionStatus } from '../core/types.ts';

interface SessionRow {
  id: string;
  collection_id: string;
  content_version: number;
  status: SessionStatus;
  revision: number;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface ItemRow {
  session_id: string;
  item_id: string;
  position: number;
  dhikr_id: string;
  target_count: number;
  current_count: number;
  content_snapshot: string;
}

/** Thrown when a write finds a newer revision than the one it loaded. */
export class RevisionConflictError extends Error {
  constructor() {
    super('Session revision conflict');
    this.name = 'RevisionConflictError';
  }
}

function parseSnapshot(json: string): DhikrSnapshot {
  const raw = JSON.parse(json) as Partial<DhikrSnapshot>;
  return {
    label: String(raw.label ?? ''),
    arabic: String(raw.arabic ?? ''),
    transliteration: String(raw.transliteration ?? ''),
    meaning: String(raw.meaning ?? ''),
    phase: PHASES.includes(raw.phase as DhikrSnapshot['phase']) ? (raw.phase as DhikrSnapshot['phase']) : 'teal',
    custom: raw.custom === true,
  };
}

function build(row: SessionRow, items: ItemRow[]): Session {
  return {
    id: row.id,
    collectionId: row.collection_id,
    contentVersion: row.content_version,
    status: row.status,
    revision: row.revision,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    items: items
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        itemId: i.item_id,
        dhikrId: i.dhikr_id,
        position: i.position,
        target: i.target_count,
        count: i.current_count,
        snapshot: parseSnapshot(i.content_snapshot),
      })),
  };
}

async function hydrate(db: SQLiteDatabase, rows: SessionRow[]): Promise<Session[]> {
  if (rows.length === 0) return [];
  const placeholders = rows.map(() => '?').join(', ');
  const items = await db.getAllAsync<ItemRow>(
    'SELECT * FROM session_items WHERE session_id IN (' + placeholders + ')',
    rows.map((r) => r.id),
  );
  return rows.map((row) => build(row, items.filter((i) => i.session_id === row.id)));
}

export async function getSession(db: SQLiteDatabase, id: string): Promise<Session | null> {
  const row = await db.getFirstAsync<SessionRow>('SELECT * FROM sessions WHERE id = ?', [id]);
  if (!row) return null;
  return (await hydrate(db, [row]))[0] ?? null;
}

export async function getActiveSession(db: SQLiteDatabase, collectionId: string): Promise<Session | null> {
  const row = await db.getFirstAsync<SessionRow>(
    "SELECT * FROM sessions WHERE collection_id = ? AND status = 'active'",
    [collectionId],
  );
  if (!row) return null;
  return (await hydrate(db, [row]))[0] ?? null;
}

export async function listActiveSessions(db: SQLiteDatabase): Promise<Session[]> {
  const rows = await db.getAllAsync<SessionRow>(
    "SELECT * FROM sessions WHERE status = 'active' ORDER BY updated_at DESC",
  );
  return hydrate(db, rows);
}

/** Completed rounds, newest first, optionally since an ISO time. */
export async function listCompletedSessions(
  db: SQLiteDatabase,
  sinceIso: string | null = null,
  limit = 500,
): Promise<Session[]> {
  const rows = await db.getAllAsync<SessionRow>(
    "SELECT * FROM sessions WHERE status = 'completed' AND (? IS NULL OR completed_at >= ?) ORDER BY completed_at DESC LIMIT ?",
    [sinceIso, sinceIso, limit],
  );
  return hydrate(db, rows);
}

export async function insertSession(db: SQLiteDatabase, session: Session): Promise<void> {
  await db.runAsync(
    'INSERT INTO sessions (id, collection_id, content_version, status, revision, started_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      session.id,
      session.collectionId,
      session.contentVersion,
      session.status,
      session.revision,
      session.startedAt,
      session.updatedAt,
      session.completedAt,
    ],
  );
  for (const item of session.items) {
    await db.runAsync(
      'INSERT INTO session_items (session_id, item_id, position, dhikr_id, target_count, current_count, content_snapshot) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [session.id, item.itemId, item.position, item.dhikrId, item.target, item.count, JSON.stringify(item.snapshot)],
    );
  }
}

/**
 * Writes counts and status if the stored revision still equals
 * `session.revision`. Returns the session with its new revision.
 */
export async function saveSession(db: SQLiteDatabase, session: Session): Promise<Session> {
  const result = await db.runAsync(
    'UPDATE sessions SET status = ?, revision = revision + 1, updated_at = ?, completed_at = ? WHERE id = ? AND revision = ?',
    [session.status, session.updatedAt, session.completedAt, session.id, session.revision],
  );
  if (result.changes === 0) throw new RevisionConflictError();
  for (const item of session.items) {
    await db.runAsync('UPDATE session_items SET current_count = ? WHERE session_id = ? AND item_id = ?', [
      item.count,
      session.id,
      item.itemId,
    ]);
  }
  return { ...session, revision: session.revision + 1 };
}

export async function deleteSessionsForCollection(db: SQLiteDatabase, collectionId: string): Promise<void> {
  await db.runAsync("DELETE FROM sessions WHERE collection_id = ? AND status = 'active'", [collectionId]);
}
