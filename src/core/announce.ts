// What a screen reader should say after a saved count. Counting is quiet
// most of the time: every 10th count, each item change and the round's end.

import { currentIndex, totalCount, totalTarget } from './session.ts';
import type { Session } from './types.ts';

export interface CountEvent {
  itemCompleted: boolean;
  roundCompleted: boolean;
}

export function countAnnouncement(session: Session, event: CountEvent): string | null {
  if (event.roundCompleted) return 'Wareegga waa dhammaaday. Taqabbal Allaahu minnaa wa minkum.';
  if (event.itemCompleted) {
    const next = session.items[currentIndex(session)];
    return next ? `Dikriga xiga: ${next.snapshot.label}, 0 / ${next.target}` : null;
  }
  const done = totalCount(session);
  return done > 0 && done % 10 === 0 ? `${done} / ${totalTarget(session)}` : null;
}
