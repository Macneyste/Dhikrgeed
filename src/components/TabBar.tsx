import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icons';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Bogga hore', icon: 'home' },
  library: { label: 'Maktabadda', icon: 'book' },
  prayers: { label: 'Salaadda', icon: 'bell' },
  history: { label: 'Taariikh', icon: 'history' },
};

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.bar, { paddingBottom: insets.bottom, height: 74 + insets.bottom }]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        const color = focused ? colors.primary : colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={styles.tab}
          >
            <Icon name={tab.icon} color={color} size={24} />
            <AppText size={11.5} weight={focused ? 'extrabold' : 'semibold'} color={color} numberOfLines={1}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 48 },
});
