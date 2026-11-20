import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/Button';
import { Scene } from '@/components/Scene';
import {
  parseTaraawiix,
  TARAAWIIX_TARGETS,
  taraawiixNight,
  taraawiixSetTarget,
  taraawiixTap,
  taraawiixUndo,
  type TaraawiixState,
} from '@/core/ramadan';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSettings } from '@/hooks/useSettings';
import { useSkyInk } from '@/hooks/useSky';
import { playHaptic } from '@/services/haptics';
import { colors } from '@/theme/theme';

/** Rakaat counter for Taraawiix. One tap = one rakaca; a new night starts at zero. */
export default function TaraawiixScreen() {
  useKeepAwake('taraawiix');
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const ink = useSkyInk();
  const { now, today } = usePrayerTimes();
  const night = taraawiixNight(now, today);
  const state = useMemo(() => parseTaraawiix(settings.taraawiix, night), [settings.taraawiix, night]);
  const done = state.count >= state.target;

  const save = (next: TaraawiixState, haptic: 'count' | 'round' | 'undo' | null) => {
    update('taraawiix', JSON.stringify(next))
      .then(() => haptic && playHaptic(haptic, settings.haptics))
      .catch(() => {});
  };

  const tap = () => {
    if (done) return;
    const next = taraawiixTap(state);
    save(next, next.count >= next.target ? 'round' : 'count');
  };

  return (
    <Scene>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={tap}
        disabled={done}
        accessibilityRole="button"
        accessibilityLabel={`Rakaca ${state.count} / ${state.target}`}
        accessibilityHint={done ? undefined : 'Laba-taabo si aad u tiriso rakaca'}
      />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton icon="back" label="Dib u noqo" onPress={() => router.back()} size={44} />
        <View style={styles.flex} />
        <IconButton
          icon="undo"
          label="Ka noqo rakacadii ugu dambaysay"
          onPress={() => save(taraawiixUndo(state), 'undo')}
          size={44}
          disabled={state.count === 0}
        />
      </View>

      <View style={styles.center} pointerEvents="none">
        <AppText size={18} weight="extrabold" align="center">
          Taraawiix
        </AppText>
        <AppText size={88} weight="extrabold" align="center">
          {state.count}
        </AppText>
        <AppText size={18} color={ink.soft} align="center">
          {done ? 'Waa dhammaatay. Taqabbal Allaah.' : `/ ${state.target} rakaco`}
        </AppText>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <AppText size={13} weight="bold" color={ink.onGrass} align="center">
          Tirada rakacooyinka
        </AppText>
        <View style={styles.targets} accessibilityRole="radiogroup">
          {TARAAWIIX_TARGETS.map((t) => {
            const selected = state.target === t;
            return (
              <Pressable
                key={t}
                onPress={() => save(taraawiixSetTarget(state, t), null)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${t} rakaco`}
                style={[styles.target, selected && styles.targetOn]}
              >
                <AppText size={16} weight="bold" color={selected ? colors.onPrimary : colors.ink}>
                  {t}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Scene>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', gap: 4 },
  bottom: { position: 'absolute', left: 16, right: 16, bottom: 0, gap: 8 },
  targets: { flexDirection: 'row', gap: 8 },
  target: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetOn: { backgroundColor: colors.primary },
});
