import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, ArabicText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Card';
import { grassOffset, groundHeight, Scene } from '@/components/Scene';
import { Tree } from '@/components/Tree';
import { useSettings } from '@/hooks/useSettings';
import { useSkyInk } from '@/hooks/useSky';
import { colors } from '@/theme/theme';

export default function WelcomeScreen() {
  const { settings, update } = useSettings();
  const ink = useSkyInk();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const groundTop = height - groundHeight(width);
  const treeW = Math.min(220, width * 0.56);
  const treeH = (treeW * 300) / 260;
  const treeTop = groundTop + grassOffset(width) + 6 - treeH * (284 / 300);

  const start = async () => {
    try {
      await update('onboarded', true);
    } catch {
      // Still continue; the welcome screen will simply show again next time.
    }
    router.replace('/');
  };

  return (
    <Scene>
      <View style={[styles.tree, { top: treeTop, left: (width - treeW) / 2 }]} pointerEvents="none">
        <Tree progress={1} width={treeW} reducedMotion={settings.reducedMotion} />
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 24 }]}>
        <Chip label="ADKAAR · TASBIIX · SALAAD" color={colors.primary} />
        <ArabicText size={44}>أَذْكَار</ArabicText>
        <AppText size={28} weight="extrabold" align="center" accessibilityRole="header">
          Ku soo dhawoow
        </AppText>
        <AppText size={15} color={ink.soft} align="center">
          Taabasho kasta oo dikri ah waa dhibic biyo ah. Arag geedkaaga oo kora ilaa uu miro ka bixiyo.
        </AppText>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.chips}>
          <Chip label="Internet la'aan" color={colors.grassDark} />
          <Chip label="Akoon la'aan" color={colors.grassDark} />
          <Chip label="Halkaad joogtay" color={colors.grassDark} />
        </View>
        <Button label="Bilow" onPress={start} height={58} />
      </View>
    </Scene>
  );
}

const styles = StyleSheet.create({
  tree: { position: 'absolute' },
  top: { paddingHorizontal: 28, gap: 6, alignItems: 'center' },
  bottom: { position: 'absolute', left: 20, right: 20, bottom: 0, gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
});
