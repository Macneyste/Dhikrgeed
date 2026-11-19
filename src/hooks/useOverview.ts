import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { startOfDay } from '../core/format.ts';
import type { Session } from '../core/types.ts';
import { getDatabase } from '../db/database';
import { listCustomDhikr, type CustomDhikr } from '../db/customDhikrRepo';
import { listActiveSessions, listCompletedSessions } from '../db/sessionRepo';

export interface Overview {
  active: Session[];
  completedToday: Session[];
  custom: CustomDhikr[];
}

const EMPTY: Overview = { active: [], completedToday: [], custom: [] };

/** Active rounds, today's completed rounds and custom dhikr; reloads on focus. */
export function useOverview(): { overview: Overview; loaded: boolean } {
  const [overview, setOverview] = useState<Overview>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const db = await getDatabase();
        const [active, completedToday, custom] = await Promise.all([
          listActiveSessions(db),
          listCompletedSessions(db, startOfDay(new Date()).toISOString()),
          listCustomDhikr(db),
        ]);
        return { active, completedToday, custom };
      })()
        .then((o) => {
          if (!alive) return;
          setOverview(o);
          setLoaded(true);
        })
        .catch(() => {
          if (alive) setLoaded(true);
        });
      return () => {
        alive = false;
      };
    }, []),
  );

  return { overview, loaded };
}

export type StatusKind = 'none' | 'active' | 'done';

export interface CollectionStatus {
  kind: StatusKind;
  text: string;
  session: Session | null;
}

const sum = (s: Session, f: (i: Session['items'][number]) => number) => s.items.reduce((a, i) => a + f(i), 0);

export function statusFor(collectionId: string, o: Overview): CollectionStatus {
  const active = o.active.find((s) => s.collectionId === collectionId) ?? null;
  if (active) {
    const done = sum(active, (i) => Math.min(i.count, i.target));
    if (done > 0) {
      return { kind: 'active', text: `Socda · ${done} / ${sum(active, (i) => i.target)}`, session: active };
    }
  }
  if (o.completedToday.some((s) => s.collectionId === collectionId)) {
    return { kind: 'done', text: '✓ La dhammeeyay', session: active };
  }
  return { kind: 'none', text: 'Lama bilaabin', session: active };
}

/** Most recently touched active round that has at least one count. */
export function continueSession(o: Overview): Session | null {
  return o.active.find((s) => s.items.some((i) => i.count > 0)) ?? null;
}
