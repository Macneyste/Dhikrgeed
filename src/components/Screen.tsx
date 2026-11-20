import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/theme';
import { AppText } from './AppText';

/** Scrollable page on the warm sky background with a title row. */
export function Screen({
  title,
  eyebrow,
  left,
  right,
  children,
}: {
  title: string;
  eyebrow?: string;
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* These pages stay light at night, so keep dark status bar icons. */}
      <StatusBar style="dark" />
      <View style={styles.head}>
        {left}
        <View style={styles.titles}>
          {eyebrow ? (
            <AppText size={13} weight="semibold" color={colors.soft}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText size={26} weight="extrabold" accessibilityRole="header">
            {title}
          </AppText>
        </View>
        {right}
      </View>
      {children}
    </ScrollView>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <AppText size={18} weight="extrabold" accessibilityRole="header" style={styles.section}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.sky1 },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  titles: { flex: 1 },
  section: { marginTop: 8 },
});
