import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { CollectionCard, Grid } from '@/components/CollectionCard';
import { Icon } from '@/components/Icons';
import { Screen } from '@/components/Screen';
import { COLLECTIONS, getDhikr } from '@/content/index';
import { customCollectionId } from '@/db/customDhikrRepo';
import { statusFor, useOverview } from '@/hooks/useOverview';
import { useSettings } from '@/hooks/useSettings';
import { colors, fonts, scaleFont } from '@/theme/theme';

const ORDER = ['morning', 'evening', 'after-prayer', 'tasbih'];

const fold = (s: string) =>
  s
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N} ]/gu, '');

export default function LibraryScreen() {
  const { overview } = useOverview();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const q = fold(query.trim());

  const bundled = ORDER.map((id) => COLLECTIONS.find((c) => c.id === id)!)
    .filter(Boolean)
    // Never show an empty collection.
    .filter((c) => c.items.length > 0)
    .filter((c) => {
      if (!q) return true;
      const words = [
        c.title,
        ...c.items.flatMap((i) => [getDhikr(i.dhikrId)?.label ?? '', getDhikr(i.dhikrId)?.transliteration ?? '']),
      ];
      return words.some((w) => fold(w).includes(q));
    });

  const custom = overview.custom.filter((d) => !q || fold(d.title).includes(q) || fold(d.text).includes(q));

  return (
    <Screen title="Maktabadda">
      <View style={styles.search}>
        <Icon name="search" color={colors.muted} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Raadi dikri ama qayb"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Raadi dikri ama qayb"
          style={[styles.input, { fontSize: scaleFont(15, settings.largeText) }]}
          returnKeyType="search"
          autoCorrect={false}
          maxLength={60}
        />
      </View>
      <Grid>
        {bundled.map((c) => {
          const status = statusFor(c.id, overview);
          return (
            <CollectionCard
              key={c.id}
              title={c.title}
              subtitle={`${c.items.length} dikri`}
              status={status.text}
              statusKind={status.kind}
              onPress={() => router.push({ pathname: '/collection/[id]', params: { id: c.id } })}
            />
          );
        })}
        {custom.map((d) => {
          const id = customCollectionId(d.id);
          const status = statusFor(id, overview);
          return (
            <CollectionCard
              key={d.id}
              title={d.title}
              subtitle={`Dikri gaar ah · × ${d.target}`}
              status={status.text}
              statusKind={status.kind}
              onPress={() => router.push({ pathname: '/collection/[id]', params: { id } })}
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

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  input: { flex: 1, fontFamily: fonts.medium, color: colors.ink, paddingVertical: 10 },
});
