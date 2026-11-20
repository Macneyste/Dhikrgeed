import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button, IconButton } from '@/components/Button';
import { Card, InfoNote } from '@/components/Card';
import { Sheet } from '@/components/Overlays';
import { MiniScene } from '@/components/Scene';
import { Screen } from '@/components/Screen';
import { Tree } from '@/components/Tree';
import { progress } from '@/core/progress';
import { safeRouteId } from '@/core/routes';
import type { ItemSpec, Session } from '@/core/types';
import { collectionItemSpecs, getCollection, isDraft } from '@/content/index';
import { getDatabase } from '@/db/database';
import { customIdFromCollection, customItemSpecs, deleteCustomDhikr, getCustomDhikr } from '@/db/customDhikrRepo';
import { getActiveSession, listCompletedSessions } from '@/db/sessionRepo';
import { useSettings } from '@/hooks/useSettings';
import { useSkyInk } from '@/hooks/useSky';
import { colors } from '@/theme/theme';

interface Detail {
  title: string;
  specs: ItemSpec[];
  draft: boolean;
  custom: boolean;
  active: Session | null;
  doneToday: boolean;
}

async function loadDetail(id: string): Promise<Detail | null> {
  const db = await getDatabase();
  const customId = customIdFromCollection(id);
  let title: string;
  let specs: ItemSpec[];
  let draft = false;
  if (customId) {
    const d = await getCustomDhikr(db, customId);
    if (!d) return null;
    title = d.title;
    specs = customItemSpecs(d);
  } else {
    const c = getCollection(id);
    if (!c) return null;
    title = c.title;
    specs = collectionItemSpecs(c);
    draft = isDraft(c);
  }
  const active = await getActiveSession(db, id);
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const today = await listCompletedSessions(db, midnight.toISOString());
  return { title, specs, draft, custom: !!customId, active, doneToday: today.some((s) => s.collectionId === id) };
}

export default function CollectionScreen() {
  const id = safeRouteId(useLocalSearchParams<{ id: string }>().id);
  const { settings } = useSettings();
  const ink = useSkyInk();
  const [detail, setDetail] = useState<Detail | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (id) {
        loadDetail(id)
          .then((d) => alive && setDetail(d))
          .catch(() => alive && setDetail(null));
      }
      return () => {
        alive = false;
      };
    }, [id]),
  );

  const back = <IconButton icon="back" label="Dib u noqo" onPress={() => router.back()} background={colors.surface} />;

  if (!id || detail === null) {
    return (
      <Screen title="Lama helin" left={back}>
        <AppText color={ink.soft}>Dikrigan lama helin.</AppText>
      </Screen>
    );
  }
  if (detail === undefined)
    return (
      <Screen title="" left={back}>
        {null}
      </Screen>
    );

  const counts = detail.active?.items ?? detail.specs.map((s) => ({ count: 0, target: s.target }));
  const p = progress(counts);
  const started = !!detail.active && detail.active.items.some((i) => i.count > 0);
  const status = started ? 'Socda' : detail.doneToday ? '✓ La dhammeeyay' : 'Lama bilaabin';
  const items = detail.active?.items ?? detail.specs.map((s) => ({ ...s, count: 0 }));

  return (
    <Screen title={detail.title} left={back}>
      <View style={styles.hero}>
        <MiniScene size={150}>
          <View style={styles.heroTree}>
            <Tree progress={p} width={112} reducedMotion={settings.reducedMotion} />
          </View>
        </MiniScene>
        <AppText size={14} weight="semibold" color={ink.soft}>
          {detail.specs.length} dikri · {status}
        </AppText>
      </View>

      <Card style={styles.list}>
        {items.map((item, i) => (
          <View
            key={item.itemId}
            style={[styles.row, i > 0 && styles.divider]}
            accessible
            accessibilityLabel={`${i + 1}. ${item.snapshot.label}, ${item.target} jeer`}
          >
            <View style={styles.num}>
              <AppText size={13} weight="extrabold" color={colors.primary}>
                {i + 1}
              </AppText>
            </View>
            <AppText size={15} weight="semibold" style={styles.label} numberOfLines={2}>
              {item.snapshot.label}
            </AppText>
            <AppText size={14} weight="bold" color={colors.soft}>
              {started ? `${item.count} / ${item.target}` : `× ${item.target}`}
            </AppText>
          </View>
        ))}
      </Card>

      {detail.draft && <InfoNote text="Qoraalka iyo tirooyinka waxaa hubinaya qof aqoon u leh ka hor sii-daynta." />}
      {detail.custom && (
        <InfoNote text="Dikrigan waxaa lagu calaamadeynayaa “Dikri gaar ah”. Ma maro dib-u-eegista adkaarta app-ka." />
      )}

      <Button
        label={started ? 'Sii wad' : 'Bilow'}
        onPress={() => router.push({ pathname: '/session/[collectionId]', params: { collectionId: id } })}
        height={56}
      />
      {detail.custom && <Button label="Tirtir dikrigan" variant="ghost" onPress={() => setConfirmDelete(true)} />}

      <Sheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Tirtir dikrigan?"
        message="Wareegyadii la dhammeeyay taariikhda way ku sii jirayaan."
      >
        <Button label="Maya" variant="secondary" onPress={() => setConfirmDelete(false)} />
        <Button
          label="Haa, tirtir"
          variant="danger"
          onPress={async () => {
            setConfirmDelete(false);
            const customId = customIdFromCollection(id);
            if (!customId) return;
            try {
              const db = await getDatabase();
              await db.withExclusiveTransactionAsync(async (txn) => {
                await txn.runAsync("DELETE FROM sessions WHERE collection_id = ? AND status = 'active'", [id]);
                await deleteCustomDhikr(txn, customId);
              });
              router.back();
            } catch {
              // Leave the screen as it is; nothing was deleted.
            }
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10 },
  heroTree: { marginBottom: 4 },
  list: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  num: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
