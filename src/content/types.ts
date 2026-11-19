import type { Phase, ReviewStatus } from '../core/types.ts';

export interface Dhikr {
  /** Permanent id. Never reuse or rename. */
  id: string;
  /** Short label for lists and phase cards. */
  label: string;
  arabic: string;
  /** Somali-orthography transliteration. */
  transliteration: string;
  /** Somali meaning. */
  meaning: string;
  /** Where the text and count come from (filled in by the reviewer). */
  source: string;
  reviewStatus: ReviewStatus;
}

export interface CollectionItem {
  /** Unique inside the collection. */
  itemId: string;
  dhikrId: string;
  target: number;
  phase: Phase;
}

export interface Collection {
  /** Permanent id. Never reuse or rename. */
  id: string;
  title: string;
  /** Short line shown on cards. */
  subtitle: string;
  items: CollectionItem[];
}
