// Subsets Amiri Bold to the characters Dhikrgeed shows: the Arabic block
// (letters, harakat, Qur'anic marks, Arabic-Indic digits), presentation forms
// people type (ﷲ ﷺ ﷻ and Forms-B), Latin, digits and punctuation.
// Arabic Supplement / Extended-A are left out (+68 KB); Android draws any such
// character in a custom dhikr with the system font instead. Run after updating @expo-google-fonts/amiri:
//
//   npm run fonts:subset
//
// The output is committed; the app loads it instead of the full font.

import { readFileSync, writeFileSync } from 'node:fs';
import subsetFont from 'subset-font';

import { RANGES } from './font-ranges.mjs';

const SRC = 'node_modules/@expo-google-fonts/amiri/700Bold/Amiri_700Bold.ttf';
const OUT = 'assets/fonts/Amiri-Bold-subset.ttf';

let text = '';
for (const [from, to] of RANGES) for (let c = from; c <= to; c += 1) text += String.fromCodePoint(c);

const input = readFileSync(SRC);
const output = await subsetFont(input, text, { targetFormat: 'sfnt' });
writeFileSync(OUT, output);
console.log(`${OUT}: ${(input.length / 1024).toFixed(0)} KB → ${(output.length / 1024).toFixed(0)} KB`);
