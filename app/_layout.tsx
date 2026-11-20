import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppEffects } from '@/components/AppEffects';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Scene } from '@/components/Scene';
import { getDatabase } from '@/db/database';
import { loadSettings, type AppSettings } from '@/db/settingsRepo';
import { SettingsProvider } from '@/hooks/useSettings';
import { colors } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Boot = { state: 'loading' } | { state: 'ready'; settings: AppSettings } | { state: 'error' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    // Subset of Amiri Bold (scripts/subset-fonts.mjs); same family name as before.
    Amiri_700Bold: require('../assets/fonts/Amiri-Bold-subset.ttf'),
  });
  const [boot, setBoot] = useState<Boot>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getDatabase()
      .then(loadSettings)
      .then((settings) => alive && setBoot({ state: 'ready', settings }))
      .catch((error: unknown) => {
        // Never log user text; the error name is enough to diagnose.
        console.warn('Database open failed:', error instanceof Error ? error.name : 'unknown');
        if (alive) setBoot({ state: 'error' });
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const ready = (fontsLoaded || fontError !== null) && boot.state !== 'loading';
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {boot.state === 'ready' ? (
        <SettingsProvider initial={boot.settings}>
          <AppEffects />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.sky1 } }} />
        </SettingsProvider>
      ) : (
        <Scene>
          <View style={styles.error}>
            <AppText size={22} weight="extrabold" align="center">
              Xogta app-ka lama furi karo
            </AppText>
            <AppText size={15} color={colors.soft} align="center">
              Tirintaadii waxba lagama tirtirin. Xir app-ka oo mar kale fur, ama hoos ka taabo.
            </AppText>
            <Button
              label="Mar kale isku day"
              onPress={() => {
                setBoot({ state: 'loading' });
                setAttempt((a) => a + 1);
              }}
            />
          </View>
        </Scene>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
});
