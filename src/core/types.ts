// Shared domain types. Pure TypeScript: no React Native imports here.

export type Phase = 'teal' | 'purple' | 'gold';

export const PHASES: readonly Phase[] = ['teal', 'purple', 'gold'];

export type ReviewStatus = 'draft' | 'reviewed';

/** Text of one dhikr as shown on the counter. Stored as a snapshot per round. */
export interface DhikrSnapshot {
  /** Short label used in lists and phase cards. */
  label: string;
  arabic: string;
  transliteration: string;
  /** Somali meaning; may be empty. */
  meaning: string;
  phase: Phase;
  /** True for text the person typed themselves. */
  custom: boolean;
}

/** What a round needs to know about one item before it starts. */
export interface ItemSpec {
  itemId: string;
  dhikrId: string;
  target: number;
  snapshot: DhikrSnapshot;
}

export interface SessionItem extends ItemSpec {
  position: number;
  count: number;
}

export type SessionStatus = 'active' | 'completed';

export interface Session {
  id: string;
  collectionId: string;
  contentVersion: number;
  status: SessionStatus;
  /** Incremented on every saved change; used for optimistic concurrency. */
  revision: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: SessionItem[];
}
