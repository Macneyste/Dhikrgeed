// Bundled collections. Ids are permanent.

import type { Collection } from './types.ts';

/** Bump when bundled text or targets change. Running rounds keep their snapshot. */
export const CONTENT_VERSION = 1;

const morningEvening = (prefix: string): Collection['items'] => [
  { itemId: `${prefix}-ikhlas`, dhikrId: 'al-ikhlas', target: 3, phase: 'teal' },
  { itemId: `${prefix}-falaq`, dhikrId: 'al-falaq', target: 3, phase: 'purple' },
  { itemId: `${prefix}-nas`, dhikrId: 'an-nas', target: 3, phase: 'gold' },
  { itemId: `${prefix}-bismillah`, dhikrId: 'bismillah-la-yadurru', target: 3, phase: 'teal' },
  { itemId: `${prefix}-subhanallahi`, dhikrId: 'subhanallahi-wa-bihamdihi', target: 100, phase: 'purple' },
];

export const COLLECTIONS: readonly Collection[] = [
  {
    id: 'tasbih',
    title: 'Tasbiixda',
    subtitle: '33 · 33 · 34',
    items: [
      { itemId: 'tasbih-subhanallah', dhikrId: 'subhanallah', target: 33, phase: 'teal' },
      { itemId: 'tasbih-alhamdulillah', dhikrId: 'alhamdulillah', target: 33, phase: 'purple' },
      { itemId: 'tasbih-allahu-akbar', dhikrId: 'allahu-akbar', target: 34, phase: 'gold' },
    ],
  },
  {
    id: 'after-prayer',
    title: 'Salaadda kadib',
    subtitle: 'Adkaarta salaadda kadib',
    items: [
      { itemId: 'ap-astaghfirullah', dhikrId: 'astaghfirullah', target: 3, phase: 'teal' },
      { itemId: 'ap-antas-salam', dhikrId: 'antas-salam', target: 1, phase: 'purple' },
      { itemId: 'ap-subhanallah', dhikrId: 'subhanallah', target: 33, phase: 'gold' },
      { itemId: 'ap-alhamdulillah', dhikrId: 'alhamdulillah', target: 33, phase: 'teal' },
      { itemId: 'ap-allahu-akbar', dhikrId: 'allahu-akbar', target: 33, phase: 'purple' },
      { itemId: 'ap-tahlil', dhikrId: 'tahlil-full', target: 1, phase: 'gold' },
    ],
  },
  {
    id: 'morning',
    title: 'Subaxda',
    subtitle: 'Adkaarta subaxa',
    items: morningEvening('morning'),
  },
  {
    id: 'evening',
    title: 'Galabta',
    subtitle: 'Adkaarta galabta',
    items: morningEvening('evening'),
  },
];
