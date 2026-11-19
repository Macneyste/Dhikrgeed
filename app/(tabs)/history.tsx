import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Tree } from '@/components/Tree';
import { dayGroupLabel, dayKey, formatTime, SOMALI_WEEKDAYS_SHORT, weekDays } from '@/core/format';
import { totalCount } from '@/core/session';
import type { Session } from '@/core/types';
import { getDatabase } from '@/db/database';
import { listCompletedSessions } from '@/db/sessionRepo';
import { useSettings } from '@/hooks/useSettings';
import { collectionTitle } from '@/services/collections';
import { colors } from '@/theme/theme';

export default function HistoryScreen() {
  const { settings } = useSettings();
  const [sessions, setSessions] = useState<Session[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getDatabase()
        .then((db) => listCompletedSessions(db))
        .then((s) => alive && setSessions(s))
        .catch(() => alive && setSessions([]));
      return () => {
        alive = false;
      };
    }, []),
  );

  if (sessions === null) return <Screen title="Taariikhda">{null}</Screen>;

  if (sessions.length === 0) {
    return (
      <Screen title="Taariikhda">
        <View style={styles.empty}>
          <View style={styles.circle}>
            <Tree progress={0} width={110} reducedMotion={settings.reducedMotion} />
          </View>
          <AppText size={20} weight="extrabold" align="center">
            Weli geed ma aadan beerin
          </AppText>
          <AppText size={15} color={colors.soft} align="center">
            Wareeg kasta oo aad dhammayso wuxuu halkan ku noqonayaa geed miro leh.
          </AppText>
          <Button
            label="Bilow tasbiixda"
            onPress={() => router.push({ pathname: '/session/[collectionId]', params: { collectionId: 'tasbih' } })}
            style={styles.emptyButton}
          />
        </View>
      </Screen>
    );
  }

  const now = new Date();
  const week = weekDays(now);
  const byDay = new Map<string, Session[]>();
  for (const s of sessions) {
    const key = dayKey(new Date(s.completedAt!));
    byDay.set(key, [...(byDay.get(key) ?? []), s]);
  }
  const weekKeys = new Set(week.map(dayKey));
  const weekRounds = sessions.filter((s) => weekKeys.has(dayKey(new Date(s.completedAt!)))).length;
  const weekDaysDone = week.filter((d) => byDay.has(dayKey(d))).length;

  return (
    <Screen title="Taariikhda">
      <Card>
        <View style={styles.week}>
          {week.map((d) => {
            const done = byDay.has(dayKey(d));
            const isToday = dayKey(d) === dayKey(now);
            return (
              <View
                key={dayKey(d)}
                style={styles.day}
                accessible
                accessibilityLabel={`${SOMALI_WEEKDAYS_SHORT[d.getDay()]}: ${done ? 'wareeg la dhammeeyay' : 'wareeg ma jiro'}`}
              >
                <Tree progress={done ? 1 : 0.1} width={34} reducedMotion />
                <AppText
                  size={11.5}
                  weight={isToday ? 'extrabold' : 'semibold'}
                  color={isToday ? colors.primary : colors.soft}
                >
                  {SOMALI_WEEKDAYS_SHORT[d.getDay()]}
                </AppText>
              </View>
            );
          })}
        </View>
        <View style={styles.stats}>
          <Stat label="Wareegyo" value={weekRounds} />
          <Stat label="Maalmood" value={weekDaysDone} />
          <Stat label="Geed miro leh" value={sessions.length} />
        </View>
      </Card>

      {[...byDay.entries()].map(([key, list]) => (
        <View key={key} style={styles.group}>
          <AppText size={12} weight="extrabold" color={colors.soft} style={styles.groupLabel}>
            {dayGroupLabel(new Date(list[0]!.completedAt!), now)}
          </AppText>
          <Card style={styles.list}>
            {list.map((s, i) => (
              <View
                key={s.id}
                style={[styles.row, i > 0 && styles.divider]}
                accessible
                accessibilityLabel={`${collectionTitle(s.collectionId, s)}, ${totalCount(s)} tiro, ${formatTime(new Date(s.completedAt!))}, la dhammeeyay`}
              >
                <View style={styles.rowText}>
                  <AppText size={15} weight="bold" numberOfLines={1}>
                    {collectionTitle(s.collectionId, s)}
                  </AppText>
                  <AppText size={13} color={colors.soft}>
                    {totalCount(s)} tiro · {formatTime(new Date(s.completedAt!))}
                  </AppText>
                </View>
                <AppText size={18} weight="extrabold" color={colors.primary}>
                  ✓
                </AppText>
              </View>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <AppText size={22} weight="extrabold">
        {value}
      </AppText>
      <AppText size={12} color={colors.soft} align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 12, paddingTop: 24 },
  circle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.sky2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  emptyButton: { alignSelf: 'stretch', marginTop: 8 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 2, flex: 1 },
  stats: { flexDirection: 'row', marginTop: 14, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 12 },
  stat: { flex: 1, alignItems: 'center' },
  group: { gap: 6 },
  groupLabel: { letterSpacing: 1.3, marginTop: 4 },
  list: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: 10 },
  divider: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  rowText: { flex: 1 },
});
