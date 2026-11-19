import type { Session } from '../core/types.ts';
import { getCollection } from '../content/index.ts';

/** Display title for a collection id, using the session snapshot for custom dhikr. */
export function collectionTitle(collectionId: string, session?: Session | null): string {
  const bundled = getCollection(collectionId);
  if (bundled) return bundled.title;
  return session?.items[0]?.snapshot.label ?? 'Dikri gaar ah';
}
