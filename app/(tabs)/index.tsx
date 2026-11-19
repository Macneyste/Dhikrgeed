import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/Button';
import { Card, ProgressBar } from '@/components/Card';
import { CollectionCard, Grid } from '@/components/CollectionCard';
import { MiniScene } from '@/components/Scene';
import { SectionTitle, Screen } from '@/components/Screen';
import { Tree } from '@/components/Tree';
import { formatTime } from '@/core/format';
import { progress } from '@/core/progress';
import { currentIndex, totalCount, totalTarget } from '@/core/session';
import type { Session } from '@/core/types';
import { continueSession, statusFor, useOverview } from '@/hooks/useOverview';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSettings } from '@/hooks/useSettings';
import { collectionTitle } from '@/services/collections';
import { colors } from '@/theme/theme';

const TODAY = [
  { id: 'morning', title: 'Subaxda' },
  { id: 'evening', title: 'Galabta' },
  { id: 'after-prayer', title: 'Salaadda kadib' },
];

export default function HomeScreen() {
  const { overview } = useOverview();
  const { settings } = useSettings();
  const resume = continueSession(overview);
  const prayer = usePrayerTimes();

  return (
    <Screen
      eyebrow="Assalaamu calaykum"
      title="Beertaada maanta"
      right={
        <IconButton
          icon="settings"
          label="Dejinta"
          onPress={() => router.push('/settings')}
          background={colors.surface}
        />
      }
    >
      {prayer.next && (
        <Card
          onPress={() => router.push('/prayers')}
          style={styles.prayer}
          accessibilityLabel={`Salaadda xigta: ${prayer.next.name}, ${formatTime(prayer.next.at)}, ${prayer.next.countdown}`}
        >
          <AppText size={11} weight="extrabold" color={colors.amberText} style={styles.eyebrow}>
            SALAADDA XIGTA
          </AppText>
          <AppText size={17} weight="extrabold">
            {prayer.next.name} · {formatTime(prayer.next.at)} · {prayer.next.countdown}
          </AppText>
        </Card>
      )}

      {resume && <ContinueCard session={resume} reducedMotion={settings.reducedMotion} />}

      <SectionTitle>Adkaarta maanta</SectionTitle>
      <Grid>
        {TODAY.map((c) => {
          const status = statusFor(c.id, overview);
          return (
            <CollectionCard
              key={c.id}
              title={c.title}
              status={status.text}
              statusKind={status.kind}
              onPress={() => router.push({ pathname: '/collection/[id]', params: { id: c.id } })}
            />
          );
        })}
        <CollectionCard
          title="Dikri gaar ah"
          subtitle="Samee dikri kuu gaar ah"
          dashed
          onPress={() => router.push('/custom-dhikr')}
        />
      </Grid>
    </Screen>
  );
}

function ContinueCard({ session: s, reducedMotion }: { session: Session; reducedMotion: boolean }) {
  const idx = currentIndex(s);
  const item = s.items[idx === -1 ? s.items.length - 1 : idx]!;
  const done = totalCount(s);
  const total = totalTarget(s);
  const title = collectionTitle(s.collectionId, s);
  return (
    <Card
      onPress={() => router.push({ pathname: '/session/[collectionId]', params: { collectionId: s.collectionId } })}
      accessibilityLabel={`Sii wad ${title}, ${item.snapshot.label}, ${item.count} / ${item.target}`}
      style={styles.continue}
    >
      <MiniScene size={92}>
        <View style={styles.miniTree}>
          <Tree progress={progress(s.items)} width={70} reducedMotion={reducedMotion} />
        </View>
      </MiniScene>
      <View style={styles.continueText}>
        <AppText size={11} weight="extrabold" color={colors.primary} style={styles.eyebrow}>
          SII WAD
        </AppText>
        <AppText size={17} weight="extrabold" numberOfLines={1}>
          {title}
        </AppText>
        <AppText size={13} color={colors.soft} numberOfLines={1}>
          {item.snapshot.label} · {item.count} / {item.target}
        </AppText>
        <ProgressBar value={progress(s.items)} />
        <AppText size={12} weight="bold" color={colors.soft}>
          {done} / {total}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  prayer: { backgroundColor: colors.amberSoft, borderColor: colors.amberSoft, gap: 2 },
  continue: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  continueText: { flex: 1, gap: 4 },
  eyebrow: { letterSpacing: 1.3 },
  miniTree: { marginBottom: 2 },
});
