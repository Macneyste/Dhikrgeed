import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow } from '../theme/theme';
import { InkProvider } from '../hooks/useSky';
import { AppText } from './AppText';

export function Card({
  children,
  onPress,
  style,
  dashed,
  accessibilityLabel,
  accessibilityHint,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  dashed?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const cardStyle = [styles.card, dashed && styles.dashed, style];
  // Cards are light at every time of day, so their text uses the day ink.
  if (!onPress)
    return (
      <View style={cardStyle}>
        <InkProvider>{children}</InkProvider>
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }]}
    >
      <InkProvider>{children}</InkProvider>
    </Pressable>
  );
}

export function Chip({
  label,
  color = colors.ink,
  background = 'rgba(255,255,255,0.8)',
}: {
  label: string;
  color?: string;
  background?: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <AppText size={11} weight="extrabold" color={color} style={styles.chipText}>
        {label}
      </AppText>
    </View>
  );
}

export function InfoNote({ text }: { text: string }) {
  return (
    <View style={styles.note} accessibilityRole="text">
      <AppText size={13} weight="medium" color={colors.amberText}>
        {text}
      </AppText>
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary }: { value: number; color?: string }) {
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <View
        style={[
          styles.fill,
          { width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    ...shadow,
    shadowOpacity: 0.06,
  },
  dashed: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    backgroundColor: colors.surfaceWarm,
    elevation: 0,
    shadowOpacity: 0,
  },
  chip: { alignSelf: 'center', borderRadius: radius.chip, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { letterSpacing: 1.3 },
  note: { backgroundColor: colors.amberSoft, borderRadius: 14, padding: 14 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
