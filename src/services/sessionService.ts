// All session writes go through one serial queue and one exclusive SQLite
// transaction each: load → apply core rule → write with revision check.

import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { createSerialQueue } from '../core/serialQueue.ts';
import { createSession, reset, tap, undo } from '../core/session.ts';
import type { ItemSpec, Session } from '../core/types.ts';
import { collectionItemSpecs, CONTENT_VERSION, getCollection } from '../content/index.ts';
import { getDatabase } from '../db/database';
import { customIdFromCollection, customItemSpecs, getCustomDhikr } from '../db/customDhikrRepo';
import { getActiveSession, getSession, insertSession, RevisionConflictError, saveSession } from '../db/sessionRepo';

const queue = createSerialQueue();

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

export interface MutationResult {
  session: Session;
  changed: boolean;
  itemCompleted: boolean;
  roundCompleted: boolean;
}

type Op = (session: Session, now: Date) => MutationResult;

async function mutate(sessionId: string, op: Op): Promise<MutationResult> {
  return queue.run(async () => {
    const db = await getDatabase();
    for (let attempt = 0; ; attempt += 1) {
      try {
        let out: MutationResult | null = null;
        await db.withExclusiveTransactionAsync(async (txn) => {
          const current = await getSession(txn, sessionId);
          if (!current) throw new NotFoundError('Session');
          const next = op(current, new Date());
          if (!next.changed) {
            out = { ...next, session: current };
            return;
          }
          out = { ...next, session: await saveSession(txn, next.session) };
        });
        return out!;
      } catch (error) {
        // Another write won the race: reload and retry once.
        if (error instanceof RevisionConflictError && attempt === 0) continue;
        throw error;
      }
    }
  });
}

async function itemSpecsFor(db: SQLiteDatabase, collectionId: string): Promise<ItemSpec[]> {
  const customId = customIdFromCollection(collectionId);
  if (customId) {
    const custom = await getCustomDhikr(db, customId);
    if (!custom) throw new NotFoundError('Custom dhikr');
    return customItemSpecs(custom);
  }
  const collection = getCollection(collectionId);
  if (!collection) throw new NotFoundError('Collection');
  return collectionItemSpecs(collection);
}

/** Returns the active round for a collection, creating one if none exists. */
export function openSession(collectionId: string): Promise<Session> {
  return queue.run(async () => {
    const db = await getDatabase();
    let session: Session | null = null;
    await db.withExclusiveTransactionAsync(async (txn) => {
      session = await getActiveSession(txn, collectionId);
      if (session) return;
      const created = createSession({
        id: randomUUID(),
        collectionId,
        contentVersion: CONTENT_VERSION,
        items: await itemSpecsFor(txn, collectionId),
        now: new Date(),
      });
      await insertSession(txn, created);
      session = created;
    });
    return session!;
  });
}

/** Reads the active round without creating one. */
export async function peekActiveSession(collectionId: string): Promise<Session | null> {
  const db = await getDatabase();
  return getActiveSession(db, collectionId);
}

export function tapSession(sessionId: string): Promise<MutationResult> {
  return mutate(sessionId, (s, now) => {
    const r = tap(s, now);
    return {
      session: r.session,
      changed: r.accepted,
      itemCompleted: r.itemCompleted,
      roundCompleted: r.roundCompleted,
    };
  });
}

export function undoSession(sessionId: string): Promise<MutationResult> {
  return mutate(sessionId, (s, now) => {
    const r = undo(s, now);
    return { session: r.session, changed: r.changed, itemCompleted: false, roundCompleted: false };
  });
}

export function resetSession(sessionId: string): Promise<MutationResult> {
  return mutate(sessionId, (s, now) => ({
    session: reset(s, now),
    changed: true,
    itemCompleted: false,
    roundCompleted: false,
  }));
}
