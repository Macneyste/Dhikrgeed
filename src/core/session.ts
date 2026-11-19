// Counting rules for one round. All functions are pure and return new objects.

import type { ItemSpec, Session, SessionItem } from './types.ts';

export interface CreateSessionInput {
  id: string;
  collectionId: string;
  contentVersion: number;
  items: readonly ItemSpec[];
  now: Date;
}

export function createSession(input: CreateSessionInput): Session {
  if (input.items.length === 0) {
    throw new Error('A session needs at least one item');
  }
  const stamp = input.now.toISOString();
  const items: SessionItem[] = input.items.map((spec, position) => {
    if (!Number.isInteger(spec.target) || spec.target < 1) {
      throw new Error(`Invalid target for item ${spec.itemId}`);
    }
    // Deep-copy the snapshot so later content changes never reach this round.
    return { ...spec, snapshot: { ...spec.snapshot }, position, count: 0 };
  });
  return {
    id: input.id,
    collectionId: input.collectionId,
    contentVersion: input.contentVersion,
    status: 'active',
    revision: 0,
    startedAt: stamp,
    updatedAt: stamp,
    completedAt: null,
    items,
  };
}

/** Index of the item that the next tap counts on, or -1 when the round is complete. */
export function currentIndex(session: Session): number {
  return session.items.findIndex((item) => item.count < item.target);
}

export function isComplete(session: Session): boolean {
  return currentIndex(session) === -1;
}

export function totalCount(session: Session): number {
  return session.items.reduce((sum, item) => sum + Math.min(item.count, item.target), 0);
}

export function totalTarget(session: Session): number {
  return session.items.reduce((sum, item) => sum + item.target, 0);
}

export interface TapResult {
  session: Session;
  accepted: boolean;
  /** The tap finished the item it counted on. */
  itemCompleted: boolean;
  /** The tap finished the whole round. */
  roundCompleted: boolean;
}

function touch(session: Session, items: SessionItem[], now: Date): Session {
  const done = items.every((item) => item.count >= item.target);
  const stamp = now.toISOString();
  return {
    ...session,
    items,
    status: done ? 'completed' : 'active',
    completedAt: done ? (session.completedAt ?? stamp) : null,
    updatedAt: stamp,
  };
}

/** One accepted tap = exactly one count on the current item. Never exceeds a target. */
export function tap(session: Session, now: Date): TapResult {
  const index = currentIndex(session);
  if (session.status === 'completed' || index === -1) {
    return { session, accepted: false, itemCompleted: false, roundCompleted: false };
  }
  const items = session.items.map((item, i) => (i === index ? { ...item, count: item.count + 1 } : item));
  const next = touch(session, items, now);
  const item = items[index]!;
  return {
    session: next,
    accepted: true,
    itemCompleted: item.count >= item.target,
    roundCompleted: next.status === 'completed',
  };
}

/** Index of the item holding the most recent count, or -1 when nothing is counted. */
function lastCountedIndex(session: Session): number {
  for (let i = session.items.length - 1; i >= 0; i -= 1) {
    if (session.items[i]!.count > 0) return i;
  }
  return -1;
}

export function canUndo(session: Session): boolean {
  return lastCountedIndex(session) !== -1;
}

/**
 * Removes the last count, even if it completed an item or the whole round.
 * A completed round becomes active again.
 */
export function undo(session: Session, now: Date): { session: Session; changed: boolean } {
  const index = lastCountedIndex(session);
  if (index === -1) return { session, changed: false };
  const items = session.items.map((item, i) =>
    i === index ? { ...item, count: Math.min(item.count, item.target) - 1 } : item,
  );
  return { session: touch(session, items, now), changed: true };
}

/** Sets every count of this round back to zero. Other rounds are untouched. */
export function reset(session: Session, now: Date): Session {
  const items = session.items.map((item) => ({ ...item, count: 0 }));
  return touch(session, items, now);
}

/**
 * Accepts taps only outside a short lock window. The counter locks it when an
 * item completes so a leftover tap never counts on the next dhikr.
 */
export interface TapGate {
  accept(nowMs: number): boolean;
  lock(nowMs: number): void;
  isLocked(nowMs: number): boolean;
}

export const TRANSITION_LOCK_MS = 450;

export function createTapGate(lockMs: number = TRANSITION_LOCK_MS): TapGate {
  let lockedUntil = 0;
  return {
    accept(nowMs) {
      return nowMs >= lockedUntil;
    },
    lock(nowMs) {
      lockedUntil = nowMs + lockMs;
    },
    isLocked(nowMs) {
      return nowMs < lockedUntil;
    },
  };
}
