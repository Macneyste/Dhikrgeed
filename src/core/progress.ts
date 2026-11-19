// Progress and tree stages. The tree is always derived from counts, never stored.

export interface CountTarget {
  count: number;
  target: number;
}

/** Σ min(count, target) / Σ target, clamped to 0..1. */
export function progress(items: readonly CountTarget[]): number {
  let done = 0;
  let total = 0;
  for (const item of items) {
    total += item.target;
    done += Math.max(0, Math.min(item.count, item.target));
  }
  if (total <= 0) return 0;
  return Math.min(1, done / total);
}

export interface TreeStage {
  index: number;
  label: string;
}

export const TREE_STAGES: readonly TreeStage[] = [
  { index: 0, label: 'Abuur' },
  { index: 1, label: 'Biqil' },
  { index: 2, label: 'Jirid iyo caleemo yar' },
  { index: 3, label: 'Laamo iyo caleemo' },
  { index: 4, label: 'Geed weyn iyo ubax' },
  { index: 5, label: 'Miro soo baxaya' },
  { index: 6, label: 'Geed dhammeystiran' },
];

export function treeStage(p: number): TreeStage {
  const pct = Math.round(Math.max(0, Math.min(1, p)) * 10000) / 100;
  let index: number;
  if (pct <= 0) index = 0;
  else if (pct >= 100) index = 6;
  else if (pct <= 15) index = 1;
  else if (pct <= 35) index = 2;
  else if (pct <= 60) index = 3;
  else if (pct <= 80) index = 4;
  else index = 5;
  return TREE_STAGES[index]!;
}

export interface TreeLayers {
  stage: TreeStage;
  seed: boolean;
  sprout: boolean;
  stem: boolean;
  branches: boolean;
  canopy: boolean;
  flowers: boolean;
  fruits: boolean;
  extraFruits: boolean;
}

/** Which tree layers are visible at progress p (0..1). */
export function treeLayers(p: number): TreeLayers {
  const stage = treeStage(p);
  const i = stage.index;
  return {
    stage,
    seed: i === 0,
    sprout: i === 1,
    stem: i === 2,
    branches: i >= 3,
    canopy: i >= 4,
    flowers: i >= 4,
    fruits: i >= 5,
    extraFruits: i >= 6,
  };
}
