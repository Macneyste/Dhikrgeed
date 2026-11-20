import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, ArabicText, hasArabic } from '@/components/AppText';
import { BeadDrops, stringEnd, TasbihString } from '@/components/Beads';
import { Button, IconButton } from '@/components/Button';
import { Chip } from '@/components/Card';
import { HighlightAllaah } from '@/components/Highlighted';
import { Sheet, Toast } from '@/components/Overlays';
import { PhaseCards } from '@/components/PhaseCards';
import { grassOffset, groundHeight, Scene } from '@/components/Scene';
import { Tree } from '@/components/Tree';
import { progress } from '@/core/progress';
import { safeRouteId } from '@/core/routes';
import { canUndo, currentIndex, totalCount, totalTarget } from '@/core/session';
import { useSession } from '@/hooks/useSession';
import { useSettings } from '@/hooks/useSettings';
import { collectionTitle } from '@/services/collections';
import { playHaptic } from '@/services/haptics';
import { colors, phaseColors } from '@/theme/theme';

const STRING_H = 104;

function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function CounterScreen() {
  const params = useLocalSearchParams<{ collectionId: string }>();
  const collectionId = safeRouteId(params.collectionId);
  const { settings } = useSettings();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = useSession(collectionId);
  const [confirmReset, setConfirmReset] = useState(false);

  // Haptics follow saved changes only.
  const lastTap = s.lastTap;
  useEffect(() => {
    if (!lastTap) return;
    playHaptic(lastTap.roundCompleted ? 'round' : lastTap.itemCompleted ? 'item' : 'count', settings.haptics);
  }, [lastTap, settings.haptics]);
  const undoSeq = s.undoSeq;
  useEffect(() => {
    if (undoSeq > 0) playHaptic('undo', settings.haptics);
  }, [undoSeq, settings.haptics]);

  // Layout: tree soil sits on the first grass layer.
  const groundTop = height - groundHeight(width);
  const treeW = Math.min(260, width * 0.67);
  const treeH = (treeW * 300) / 260;
  const soilY = groundTop + grassOffset(width) + 6;
  const treeTop = soilY - treeH * (284 / 300);
  const headerBottom = insets.top + 64;
  const stringTop = Math.max(headerBottom + 120, treeTop - STRING_H + treeH * 0.12);
  const textMax = Math.max(110, stringTop - headerBottom - 4);

  if (!collectionId) {
    return <Message title="Dikrigan lama helin" onBack={goHome} />;
  }
  if (s.loadError) {
    return <Message title="Wareegga lama furi karo" onBack={goHome} onRetry={s.retry} />;
  }
  const session = s.session;
  if (!session) return <Scene />;

  const title = collectionTitle(session.collectionId, session);
  const index = currentIndex(session);
  const complete = session.status === 'completed';
  const item = session.items[complete ? session.items.length - 1 : index]!;
  const next = complete ? null : (session.items[index + 1] ?? null);
  const phase = phaseColors[item.snapshot.phase];
  const done = totalCount(session);
  const total = totalTarget(session);
  const p = progress(session.items);
  const remaining = item.target - item.count;
  const longText = item.snapshot.arabic.length > 32;
  const arabicScript = hasArabic(item.snapshot.arabic);

  const end = stringEnd(width);
  const dropFrom = { x: end.x, y: stringTop + end.y };
  const dropTo = { x: width / 2 + (((s.lastTap?.seq ?? 0) * 37) % 60) - 30, y: treeTop + treeH * 0.4 };

  const share = () => {
    Share.share({
      message: `Taqabbal Allaahu minnaa wa minkum. Waxaan dhammeeyay ${title} (${done} / ${total}) — Dhikrgeed.`,
    }).catch(() => {});
  };

  const tapLabel = `${item.snapshot.label}, ${item.count} / ${item.target}. Wadar ${done} / ${total}`;

  return (
    <Scene>
      {!complete && <KeepAwake />}
      {/* Tap area: everything above the cards. Pressable cancels when a scroll starts. */}
      <Pressable
        testID="tap-area"
        style={StyleSheet.absoluteFill}
        onPress={complete ? undefined : s.tap}
        disabled={complete}
        accessibilityRole="button"
        accessibilityLabel={complete ? 'Wareegga waa dhammaaday' : tapLabel}
        accessibilityHint={complete ? undefined : 'Laba-taabo si aad u tiriso'}
      />

      <View style={[styles.tree, { top: treeTop, left: (width - treeW) / 2 }]} pointerEvents="none">
        <Tree progress={p} width={treeW} reducedMotion={settings.reducedMotion} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton icon="back" label="Dib u noqo" onPress={goHome} size={44} />
        <View style={styles.headerChip} accessibilityLiveRegion="polite" pointerEvents="none">
          <Chip
            label={
              complete
                ? `DHAMMAYSTIRAN · ${done} / ${total}`
                : `DIKRI ${index + 1} / ${session.items.length} · ${done} / ${total}`
            }
            color={complete ? colors.primary : phase.text}
          />
        </View>
        <IconButton
          icon="undo"
          label="Ka noqo tirintii ugu dambaysay"
          onPress={s.undo}
          size={44}
          disabled={!canUndo(session)}
        />
        <IconButton
          icon="reset"
          label="Dib u bilow wareeggan"
          onPress={() => setConfirmReset(true)}
          size={44}
          disabled={done === 0}
        />
      </View>

      {/* Dhikr text. Taps inside count; scrolling never does. */}
      <View style={{ maxHeight: textMax }} pointerEvents="box-none">
        <ScrollView contentContainerStyle={styles.textWrap} showsVerticalScrollIndicator={false}>
          <Pressable onPress={complete ? undefined : s.tap} disabled={complete} accessible={false}>
            {complete ? (
              <>
                <ArabicText size={34}>تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ</ArabicText>
                <Divider color={colors.primary} />
                <AppText size={20} weight="extrabold" align="center">
                  Taqabbal Allaahu minnaa wa minkum
                </AppText>
                <HighlightAllaah
                  text="Allaah ha naga aqbalo annaga iyo idinkaba."
                  highlight={colors.primary}
                  size={15}
                  color={colors.soft}
                  align="center"
                  style={styles.meaning}
                />
                <Pressable
                  onPress={share}
                  accessibilityRole="button"
                  accessibilityLabel="La wadaag ajarka"
                  style={styles.shareChip}
                >
                  <Chip label="LA WADAAG · AJARKA LA WADAAG" color={colors.primary} />
                </Pressable>
              </>
            ) : (
              <>
                {arabicScript ? (
                  <ArabicText size={longText ? 26 : 45}>{item.snapshot.arabic}</ArabicText>
                ) : (
                  <AppText size={longText ? 20 : 30} weight="extrabold" align="center">
                    {item.snapshot.arabic}
                  </AppText>
                )}
                <Divider color={phase.base} />
                {settings.transliteration && item.snapshot.transliteration ? (
                  <AppText size={longText ? 17 : 22} weight="extrabold" align="center">
                    {item.snapshot.transliteration}
                  </AppText>
                ) : null}
                {settings.meaning && item.snapshot.meaning ? (
                  <HighlightAllaah
                    text={item.snapshot.meaning}
                    highlight={phase.text}
                    size={14.5}
                    color={colors.soft}
                    align="center"
                    style={styles.meaning}
                  />
                ) : null}
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>

      <View style={[styles.string, { top: stringTop }]} pointerEvents="none">
        {!complete && (
          <TasbihString
            width={width}
            phase={item.snapshot.phase}
            nextPhase={next?.snapshot.phase ?? null}
            remaining={remaining}
          />
        )}
      </View>

      <BeadDrops
        seq={s.lastTap?.seq ?? null}
        phase={item.snapshot.phase}
        from={dropFrom}
        to={dropTo}
        reducedMotion={settings.reducedMotion}
      />

      {/* Bottom: phase cards or completion actions, on the grass. */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        {s.saveFailedAt !== null && (
          <Toast
            title="Tirinta lama kaydin"
            message={`Tirintaadu waxay joogtaa ${s.saveFailedAt}. Taabashadii ugu dambaysay lama tirin.`}
            actionLabel="Mar kale isku day"
            onAction={() => {
              s.dismissSaveError();
              s.tap();
            }}
          />
        )}
        {complete ? (
          <View style={styles.actions}>
            <Button label="Wareeg cusub" onPress={s.newRound} />
            <Button label="Bogga hore" variant="secondary" onPress={() => router.replace('/')} />
          </View>
        ) : (
          <>
            <AppText size={13} weight="bold" color={colors.grassDark} align="center" accessible={false}>
              Taabo meel kasta si aad u tiriso
            </AppText>
            <PhaseCards items={session.items} currentIndex={index} />
          </>
        )}
      </View>

      <Sheet
        visible={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Dib u bilow wareeggan?"
        message={`${title} oo keliya ayaa eber noqonaysa. Qaybaha kale waxba iskama beddelaan.`}
      >
        <Button label="Maya" variant="secondary" onPress={() => setConfirmReset(false)} />
        <Button
          label="Haa, dib u bilow"
          variant="danger"
          onPress={() => {
            setConfirmReset(false);
            s.reset();
          }}
        />
      </Sheet>
    </Scene>
  );
}

/** Keeps the screen on while mounted: only while counting on this screen. */
function KeepAwake() {
  useKeepAwake('counter');
  return null;
}

function Divider({ color }: { color: string }) {
  return (
    <View style={styles.divider} accessible={false}>
      <View style={styles.dividerLine} />
      <View style={[styles.diamond, { backgroundColor: color }]} />
      <View style={styles.dividerLine} />
    </View>
  );
}

function Message({ title, onBack, onRetry }: { title: string; onBack: () => void; onRetry?: () => void }) {
  return (
    <Scene>
      <View style={styles.message}>
        <AppText size={22} weight="extrabold" align="center">
          {title}
        </AppText>
        {onRetry && <Button label="Mar kale isku day" onPress={onRetry} />}
        <Button label="Bogga hore" variant="secondary" onPress={onBack} />
      </View>
    </Scene>
  );
}

const styles = StyleSheet.create({
  tree: { position: 'absolute' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  headerChip: { flex: 1, alignItems: 'center' },
  textWrap: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  meaning: { marginTop: 6 },
  divider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 8 },
  dividerLine: { width: 36, height: 1, backgroundColor: colors.line },
  diamond: { width: 9, height: 9, transform: [{ rotate: '45deg' }] },
  shareChip: { marginTop: 14, alignSelf: 'center', minHeight: 48, justifyContent: 'center' },
  string: { position: 'absolute', left: 0, right: 0 },
  bottom: { position: 'absolute', left: 16, right: 16, bottom: 0, gap: 10 },
  actions: { gap: 10 },
  message: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
});
