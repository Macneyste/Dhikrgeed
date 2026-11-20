import type { ItemSpec } from '../core/types.ts';
// Bundled content comes from the JSON packs in ./packs (see scripts/build-content.ts).
import { ADHKAR, COLLECTIONS, CONTENT_VERSION, PACKS } from './packs.generated.ts';
import type { Collection, Dhikr } from './types.ts';

export { ADHKAR, COLLECTIONS, CONTENT_VERSION, PACKS };
export type { Collection, Dhikr };

export function getDhikr(id: string): Dhikr | undefined {
  return ADHKAR.find((d) => d.id === id);
}

export function getCollection(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

/** True while any dhikr in the collection is still a draft. */
export function isDraft(collection: Collection): boolean {
  return collection.items.some((item) => getDhikr(item.dhikrId)?.reviewStatus !== 'reviewed');
}

export function collectionTotal(collection: Collection): number {
  return collection.items.reduce((sum, item) => sum + item.target, 0);
}

/** Item specs (with snapshots) for starting a new round of a bundled collection. */
export function collectionItemSpecs(collection: Collection): ItemSpec[] {
  return collection.items.map((item) => {
    const dhikr = getDhikr(item.dhikrId);
    if (!dhikr) throw new Error(`Unknown dhikr ${item.dhikrId}`);
    return {
      itemId: item.itemId,
      dhikrId: dhikr.id,
      target: item.target,
      snapshot: {
        label: dhikr.label,
        arabic: dhikr.arabic,
        transliteration: dhikr.transliteration,
        meaning: dhikr.meaning,
        phase: item.phase,
        custom: false,
      },
    };
  });
}
