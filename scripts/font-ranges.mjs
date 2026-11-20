// Unicode ranges kept in the Amiri subset (see subset-fonts.mjs).
// tests/core/fontRanges.test.ts checks that bundled adhkar only use these.

export const RANGES = [
  [0x0020, 0x007e], // Basic Latin (digits, punctuation)
  [0x00a0, 0x00ff], // Latin-1 punctuation and letters
  [0x0600, 0x06ff], // Arabic (letters, harakat, Arabic-Indic digits, Qur'anic marks)
  [0xfdf0, 0xfdfd], // word ligatures: ﷲ ﷺ ﷻ and others
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
  [0x200c, 0x200f], // ZWNJ, ZWJ, LRM, RLM
  [0x2010, 0x2027], // dashes, quotes, ellipsis
  [0x25cc, 0x25cc], // dotted circle for lone marks
  [0xfd3e, 0xfd3f], // ornate parentheses
];
