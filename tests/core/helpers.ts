import type { ItemSpec, Phase } from '../../src/core/types.ts';

export function spec(itemId: string, target: number, phase: Phase = 'teal'): ItemSpec {
  return {
    itemId,
    dhikrId: itemId,
    target,
    snapshot: { label: itemId, arabic: 'ع', transliteration: itemId, meaning: '', phase, custom: false },
  };
}

export const T0 = new Date('2026-11-19T08:00:00.000Z');
