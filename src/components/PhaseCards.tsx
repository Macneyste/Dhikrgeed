import { StyleSheet, View } from 'react-native';

import type { SessionItem } from '../core/types.ts';
import { colors, phaseColors, shadow } from '../theme/theme';
import { AppText } from './AppText';

export function PhaseCards({ items, currentIndex }: { items: readonly SessionItem[]; currentIndex: number }) {
  const rowHeight = items.length <= 3 ? 52 : 44;
  const rows: SessionItem[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));

  return (
    <View style={styles.wrap} pointerEvents="none">
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((item) => {
            const done = item.count >= item.target;
            const active = item.position === currentIndex;
            const c = phaseColors[item.snapshot.phase];
            const state = done ? 'la dhammeeyay' : active ? 'socda' : 'sugaya';
            return (
              <View
                key={item.itemId}
                accessible
                accessibilityLabel={`${item.snapshot.label}, ${item.count} / ${item.target}, ${state}`}
                style={[
                  styles.card,
                  { minHeight: rowHeight },
                  active ? [styles.active, shadow] : done ? styles.done : styles.pending,
                ]}
              >
                <AppText size={11} weight="bold" color={active ? c.text : colors.soft} numberOfLines={1}>
                  {item.snapshot.label}
                </AppText>
                <AppText size={13} weight="extrabold" color={active || done ? c.text : colors.soft}>
                  {item.count} / {item.target}
                  {done ? ' ✓' : ''}
                </AppText>
              </View>
            );
          })}
          {row.length < 3 &&
            Array.from({ length: 3 - row.length }, (_, i) => <View key={`gap-${i}`} style={styles.gap} />)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: { backgroundColor: '#FFFFFF' },
  done: { backgroundColor: 'rgba(255,255,255,0.82)' },
  pending: { backgroundColor: 'rgba(255,255,255,0.5)' },
  gap: { flex: 1 },
});
