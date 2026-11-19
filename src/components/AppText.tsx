import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useSettings } from '../hooks/useSettings';
import { colors, fonts, scaleFont } from '../theme/theme';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export interface AppTextProps extends TextProps {
  size?: number;
  weight?: Weight;
  color?: string;
  align?: TextStyle['textAlign'];
}

/** Latin UI text in Plus Jakarta Sans, honouring the "Qoraal weyn" setting. */
export function AppText({ size = 15, weight = 'regular', color = colors.ink, align, style, ...rest }: AppTextProps) {
  const { settings } = useSettings();
  const fontSize = scaleFont(size, settings.largeText);
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      style={[{ fontFamily: fonts[weight], fontSize, color, textAlign: align, lineHeight: Math.round(fontSize * 1.4) }, style]}
      {...rest}
    />
  );
}

const charRange = (from: number, to: number) => String.fromCharCode(from) + '-' + String.fromCharCode(to);
// Arabic, Arabic Supplement and Arabic Presentation Forms A/B.
const ARABIC_CHARS = new RegExp(
  '[' + charRange(0x0600, 0x06ff) + charRange(0x0750, 0x077f) + charRange(0xfb50, 0xfdff) + charRange(0xfe70, 0xfefc) + ']',
);

export const hasArabic = (s: string) => ARABIC_CHARS.test(s);

export interface ArabicTextProps extends TextProps {
  size: number;
  color?: string;
}

/** Arabic dhikr text in Amiri, right-to-left. Plain Text only, never HTML. */
export function ArabicText({ size, color = colors.ink, style, ...rest }: ArabicTextProps) {
  const { settings } = useSettings();
  const fontSize = scaleFont(size, settings.largeText);
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      style={[styles.arabic, { fontSize, color, lineHeight: Math.round(fontSize * 1.75) }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  arabic: { fontFamily: fonts.arabic, textAlign: 'center', writingDirection: 'rtl' },
});
