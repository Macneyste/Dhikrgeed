import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { Button, IconButton } from '@/components/Button';
import { Sheet } from '@/components/Overlays';
import { Tree } from '@/components/Tree';
import { formatTime } from '@/core/format';
import { gardenMonths, type GardenTree } from '@/core/garden';
import type { Phase } from '@/core/types';
import { getDatabase } from '@/db/database';
import { listCompletedSessions } from '@/db/sessionRepo';
import { useSettings } from '@/hooks/useSettings';
import { collectionTitle } from '@/services/collections';
import { colors, phaseColors } from '@/theme/theme';

const PER_ROW = 5;
const GAP = 10;

/** Small, cheap tree: trunk, crown and a phase-coloured fruit accent. */
const GardenTreeIcon = memo(function GardenTreeIcon({ phase, size }: { phase: Phase; size: number }) {
  const accent = phaseColors[phase].base;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 44" accessible={false}>
      <Ellipse cx={20} cy={41} rx={12} ry={2.5} fill="#C9A48C" opacity={0.6} />
      <Path d="M20 41 V24" stroke="#7A4E32" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={20} cy={17} r={12} fill="#7DAA4E" />
      <Circle cx={13} cy={20} r={7} fill="#6C9A42" />
      <Circle cx={27} cy={19} r={7} fill="#8DB560" />
      <Circle cx={15} cy={13} r={2.6} fill={accent} />
      <Circle cx={25} cy={15} r={2.6} fill={accent} />
      <Circle cx={20} cy={22} r={2.6} fill={accent} />
    </Svg>
  );
});

function chunk<T>(list: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

function dateLabel(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} · ${formatTime(d)}`;
}

export default function GardenScreen() {
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [titles, setTitles] = useState<Map<string, string>>(new Map());
  const [months, setMonths] = useState<ReturnType<typeof gardenMonths> | null>(null);
  const [selected, setSelected] = useState<GardenTree | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getDatabase()
        .then((db) => listCompletedSessions(db))
        .then((sessions) => {
          if (!alive) return;
          setTitles(new Map(sessions.map((s) => [s.id, collectionTitle(s.collectionId, s)])));
          setMonths(gardenMonths(sessions));
        })
        .catch(() => alive && setMonths([]));
      return () => {
        alive = false;
      };
    }, []),
  );

  const size = Math.floor((width - 32 - GAP * (PER_ROW - 1)) / PER_ROW);
  const sections = useMemo(
    () => (months ?? []).map((m) => ({ key: m.key, title: m.label, data: chunk(m.trees, PER_ROW) })),
    [months],
  );

  const header = (
    <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
      <IconButton icon="back" label="Dib u noqo" onPress={() => router.back()} background={colors.surface} />
      <AppText size={26} weight="extrabold" accessibilityRole="header">
        Beertayda
      </AppText>
    </View>
  );

  if (months !== null && months.length === 0) {
    return (
      <View style={styles.page}>
        {header}
        <View style={styles.empty}>
          <Tree progress={0} width={110} reducedMotion={settings.reducedMotion} />
          <AppText size={20} weight="extrabold" align="center">
            Beertaadu way bilaabanaysaa.
          </AppText>
          <AppText size={15} color={colors.soft} align="center">
            Wareeg kasta oo aad dhammayso wuxuu halkan ku noqonayaa geed yar.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <SectionList
        sections={sections}
        keyExtractor={(row) => row[0]!.sessionId}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        stickySectionHeadersEnabled={false}
        initialNumToRender={8}
        windowSize={7}
        renderSectionHeader={({ section }) => (
          <AppText size={12} weight="extrabold" color={colors.soft} style={styles.month} accessibilityRole="header">
            {section.title.toUpperCase()}
          </AppText>
        )}
        renderItem={({ item: row }) => (
          <View style={styles.row}>
            {row.map((t) => (
              <Pressable
                key={t.sessionId}
                onPress={() => setSelected(t)}
                accessibilityRole="button"
                accessibilityLabel={`${titles.get(t.sessionId) ?? ''}, ${dateLabel(t.completedAt)}, ${t.count}`}
                style={{ width: size, height: size }}
              >
                <GardenTreeIcon phase={t.phase} size={size} />
              </Pressable>
            ))}
          </View>
        )}
      />

      <Sheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? (titles.get(selected.sessionId) ?? '') : ''}
        message={selected ? `${dateLabel(selected.completedAt)} · ${selected.count} tiro` : undefined}
      >
        <Button label="Xir" variant="secondary" onPress={() => setSelected(null)} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.sky1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  month: { letterSpacing: 1.3, marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: GAP, paddingHorizontal: 16, marginBottom: GAP },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
});
