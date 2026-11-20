// Checks bundled adhkar and collections (from src/content/packs/*.json).
//   node scripts/validate-content.ts            structural checks
//   node scripts/validate-content.ts --release  also fails while any entry is a draft

import { pathToFileURL } from 'node:url';

import { ADHKAR, COLLECTIONS } from '../src/content/packs.generated.ts';
import { PHASES } from '../src/core/types.ts';
import { ID_PATTERN } from '../src/core/validation.ts';

export function checkContent(options: { release: boolean }): string[] {
  const problems: string[] = [];
  const dhikrIds = new Set<string>();

  for (const d of ADHKAR) {
    if (!ID_PATTERN.test(d.id)) problems.push(`dhikr ${d.id}: invalid id`);
    if (dhikrIds.has(d.id)) problems.push(`dhikr ${d.id}: duplicate id`);
    dhikrIds.add(d.id);
    if (!d.arabic.trim()) problems.push(`dhikr ${d.id}: missing Arabic text`);
    if (!d.transliteration.trim()) problems.push(`dhikr ${d.id}: missing transliteration`);
    if (!d.label.trim()) problems.push(`dhikr ${d.id}: missing label`);
    if (d.reviewStatus !== 'draft' && d.reviewStatus !== 'reviewed') {
      problems.push(`dhikr ${d.id}: unknown review status`);
    }
    if (options.release) {
      if (d.reviewStatus !== 'reviewed') problems.push(`dhikr ${d.id}: not reviewed`);
      if (!d.source.trim() || d.source === 'Sugaya dib-u-eegis') problems.push(`dhikr ${d.id}: missing source`);
    }
  }

  const collectionIds = new Set<string>();
  for (const c of COLLECTIONS) {
    if (!ID_PATTERN.test(c.id) || c.id.startsWith('custom')) problems.push(`collection ${c.id}: invalid id`);
    if (collectionIds.has(c.id)) problems.push(`collection ${c.id}: duplicate id`);
    collectionIds.add(c.id);
    if (c.items.length === 0) problems.push(`collection ${c.id}: empty`);
    const itemIds = new Set<string>();
    for (const item of c.items) {
      if (itemIds.has(item.itemId)) problems.push(`collection ${c.id}: duplicate item ${item.itemId}`);
      itemIds.add(item.itemId);
      if (!dhikrIds.has(item.dhikrId)) problems.push(`collection ${c.id}: unknown dhikr ${item.dhikrId}`);
      if (!Number.isInteger(item.target) || item.target < 1 || item.target > 9999) {
        problems.push(`collection ${c.id}: invalid target for ${item.itemId}`);
      }
      if (!PHASES.includes(item.phase)) problems.push(`collection ${c.id}: invalid phase for ${item.itemId}`);
    }
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const release = process.argv.includes('--release');
  const problems = checkContent({ release });
  if (problems.length > 0) {
    console.error(`Content check failed (${problems.length}):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`Content OK: ${ADHKAR.length} adhkar, ${COLLECTIONS.length} collections${release ? ' (release)' : ''}.`);
}
