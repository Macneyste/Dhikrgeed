// Validation for text the person types. Errors are Somali (shown in the UI).

export const LIMITS = {
  title: 60,
  text: 500,
  meaning: 500,
  minTarget: 1,
  maxTarget: 9999,
} as const;

// C0/C1 control characters except tab (\t) and newline (\n).
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
// Bidi embedding/override/isolate characters that can disguise text direction.
const BIDI = /[‪-‮⁦-⁩]/g;

/** Removes control and bidi-override characters, normalises line breaks and trims. */
export function sanitizeText(value: string, multiline: boolean): string {
  let out = value.normalize('NFC').replace(/\r\n?/g, '\n').replace(CONTROL, '').replace(BIDI, '');
  out = out.replace(/\t/g, ' ');
  if (multiline) {
    out = out
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  } else {
    out = out.replace(/\n+/g, ' ').replace(/ {2,}/g, ' ');
  }
  return out.trim();
}

export interface CustomDhikrInput {
  title: string;
  text: string;
  meaning?: string | null;
  target: number;
}

export interface CustomDhikrValue {
  title: string;
  text: string;
  meaning: string | null;
  target: number;
}

export type CustomDhikrField = 'title' | 'text' | 'meaning' | 'target';

export type ValidationResult =
  | { ok: true; value: CustomDhikrValue }
  | { ok: false; errors: Partial<Record<CustomDhikrField, string>> };

const length = (s: string) => Array.from(s).length;

export function validateCustomDhikr(input: CustomDhikrInput): ValidationResult {
  const errors: Partial<Record<CustomDhikrField, string>> = {};
  const title = sanitizeText(input.title ?? '', false);
  const text = sanitizeText(input.text ?? '', true);
  const meaningRaw = sanitizeText(input.meaning ?? '', true);

  if (title.length === 0) errors.title = 'Magaca waa loo baahan yahay.';
  else if (length(title) > LIMITS.title) errors.title = `Magacu waa inuusan ka badnaan ${LIMITS.title} xaraf.`;

  if (text.length === 0) errors.text = 'Qoraalka dikriga waa loo baahan yahay.';
  else if (length(text) > LIMITS.text) errors.text = `Qoraalku waa inuusan ka badnaan ${LIMITS.text} xaraf.`;

  if (length(meaningRaw) > LIMITS.meaning) {
    errors.meaning = `Macnuhu waa inuusan ka badnaan ${LIMITS.meaning} xaraf.`;
  }

  const target = input.target;
  if (!Number.isInteger(target) || target < LIMITS.minTarget || target > LIMITS.maxTarget) {
    errors.target = `Tiradu waa inay noqotaa lambar u dhexeeya ${LIMITS.minTarget} iyo ${LIMITS.maxTarget}.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { title, text, meaning: meaningRaw.length > 0 ? meaningRaw : null, target } };
}

export const ID_PATTERN = /^[a-z0-9:-]{1,64}$/;

export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}
