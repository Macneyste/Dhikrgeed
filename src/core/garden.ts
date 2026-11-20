// The garden: one small tree per completed round, newest first, grouped by
// month. Missing days remove nothing; there is no streak and no score.

import { SOMALI_MONTHS } from './format.ts';
import { totalCount } from './session.ts';
import type { Phase, Session } from './types.ts';

export interface GardenTree {
  sessionId: string;
  collectionId: string;
  completedAt: Date;
  count: number;
  phase: Phase;
}

export interface GardenMonth {
  /** "2026-11" */
  key: string;
  /** "Nofembar 2026" */
  label: string;
  trees: GardenTree[];
}

export function monthLabel(date: Date): string {
  return `${SOMALI_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function gardenMonths(sessions: readonly Session[]): GardenMonth[] {
  const trees: GardenTree[] = [];
  for (const s of sessions) {
    if (s.status !== 'completed' || !s.completedAt) continue;
    const completedAt = new Date(s.completedAt);
    if (!Number.isFinite(completedAt.getTime())) continue;
    trees.push({
      sessionId: s.id,
      collectionId: s.collectionId,
      completedAt,
      count: totalCount(s),
      phase: s.items[0]?.snapshot.phase ?? 'teal',
    });
  }
  trees.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

  const months: GardenMonth[] = [];
  for (const t of trees) {
    const key = `${t.completedAt.getFullYear()}-${String(t.completedAt.getMonth() + 1).padStart(2, '0')}`;
    let month = months[months.length - 1];
    if (!month || month.key !== key) {
      month = { key, label: monthLabel(t.completedAt), trees: [] };
      months.push(month);
    }
    month.trees.push(t);
  }
  return months;
}
