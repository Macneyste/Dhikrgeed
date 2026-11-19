import type { SQLiteDatabase } from 'expo-sqlite';

import type { ItemSpec } from '../core/types.ts';
import type { CustomDhikrValue } from '../core/validation.ts';

export interface CustomDhikr extends CustomDhikrValue {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  title: string;
  text: string;
  meaning: string | null;
  target_count: number;
  created_at: string;
  updated_at: string;
}

const fromRow = (r: Row): CustomDhikr => ({
  id: r.id,
  title: r.title,
  text: r.text,
  meaning: r.meaning,
  target: r.target_count,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const CUSTOM_PREFIX = 'custom:';

export const customCollectionId = (id: string) => `${CUSTOM_PREFIX}${id}`;

export function customIdFromCollection(collectionId: string): string | null {
  return collectionId.startsWith(CUSTOM_PREFIX) ? collectionId.slice(CUSTOM_PREFIX.length) : null;
}

export async function listCustomDhikr(db: SQLiteDatabase): Promise<CustomDhikr[]> {
  const rows = await db.getAllAsync<Row>('SELECT * FROM custom_dhikr ORDER BY created_at DESC');
  return rows.map(fromRow);
}

export async function getCustomDhikr(db: SQLiteDatabase, id: string): Promise<CustomDhikr | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM custom_dhikr WHERE id = ?', [id]);
  return row ? fromRow(row) : null;
}

export async function insertCustomDhikr(
  db: SQLiteDatabase,
  id: string,
  value: CustomDhikrValue,
  now: Date,
): Promise<CustomDhikr> {
  const stamp = now.toISOString();
  await db.runAsync(
    'INSERT INTO custom_dhikr (id, title, text, meaning, target_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, value.title, value.text, value.meaning, value.target, stamp, stamp],
  );
  return { ...value, id, createdAt: stamp, updatedAt: stamp };
}

export async function deleteCustomDhikr(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM custom_dhikr WHERE id = ?', [id]);
}

/** One-item round for a custom dhikr. */
export function customItemSpecs(d: CustomDhikr): ItemSpec[] {
  return [
    {
      itemId: 'custom-1',
      dhikrId: customCollectionId(d.id),
      target: d.target,
      snapshot: {
        label: d.title,
        arabic: d.text,
        transliteration: '',
        meaning: d.meaning ?? '',
        phase: 'teal',
        custom: true,
      },
    },
  ];
}
