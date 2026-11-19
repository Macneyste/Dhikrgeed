// In-memory stand-in for src/services/sessionService.ts used by component tests.
// Uses the real core counting rules; only SQLite persistence is replaced.

import { collectionItemSpecs, getCollection } from '../../src/content/index';
import { createSession, reset, tap, undo } from '../../src/core/session';
import type { ItemSpec, Session } from '../../src/core/types';
import type { MutationResult } from '../../src/services/sessionService';

const store = new Map<string, Session>();
let n = 0;

/** A one-item collection with target 2, for completion tests. */
const TINY: ItemSpec[] = [
  {
    itemId: 'tiny-1',
    dhikrId: 'tiny',
    target: 2,
    snapshot: {
      label: 'Tiny',
      arabic: 'سُبْحَانَ اللَّهِ',
      transliteration: 'Tiny',
      meaning: '',
      phase: 'teal',
      custom: false,
    },
  },
];

const save = (s: Session): Session => {
  const next = { ...s, revision: s.revision + 1 };
  store.set(s.id, next);
  return next;
};

export function resetFakeStore(): void {
  store.clear();
}

export async function openSession(collectionId: string): Promise<Session> {
  const active = [...store.values()].find((s) => s.collectionId === collectionId && s.status === 'active');
  if (active) return active;
  const c = getCollection(collectionId);
  n += 1;
  const s = createSession({
    id: `s${n}`,
    collectionId,
    contentVersion: 1,
    items: c ? collectionItemSpecs(c) : TINY,
    now: new Date(),
  });
  store.set(s.id, s);
  return s;
}

export async function tapSession(id: string): Promise<MutationResult> {
  const r = tap(store.get(id)!, new Date());
  return {
    session: r.accepted ? save(r.session) : r.session,
    changed: r.accepted,
    itemCompleted: r.itemCompleted,
    roundCompleted: r.roundCompleted,
  };
}

export async function undoSession(id: string): Promise<MutationResult> {
  const r = undo(store.get(id)!, new Date());
  return { session: save(r.session), changed: r.changed, itemCompleted: false, roundCompleted: false };
}

export async function resetSession(id: string): Promise<MutationResult> {
  return {
    session: save(reset(store.get(id)!, new Date())),
    changed: true,
    itemCompleted: false,
    roundCompleted: false,
  };
}
