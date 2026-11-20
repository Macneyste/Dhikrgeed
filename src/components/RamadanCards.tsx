import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatCountdown, formatTime } from '../core/format.ts';
import { toHijri } from '../core/hijri.ts';
import { isLastTenNights, nextFastEvent, ramadanNight } from '../core/ramadan.ts';
import type { PrayerInfo } from '../hooks/usePrayerTimes';
import { useSettings } from '../hooks/useSettings';
import { colors } from '../theme/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

/**
 * Home cards for Ramadan. Outside Ramadan mode nothing is shown, except a
 * one-time suggestion during Ramadan itself, which the person can decline.
 */
export function RamadanCards({ prayer }: { prayer: PrayerInfo }) {
  const { settings, update } = useSettings();
  const { now, today, tomorrow } = prayer;
  const hijri = toHijri(now, settings.hijriAdjust);
  const inRamadan = hijri?.month === 9;

  if (!settings.ramadan) {
    if (!inRamadan || settings.ramadanAskedYear === hijri.year) return null;
    const answer = (on: boolean) => {
      update('ramadan', on).catch(() => {});
      update('ramadanAskedYear', hijri.year).catch(() => {});
    };
    return (
      <Card style={styles.card}>
        <AppText size={17} weight="extrabold">
          Ramadaan Kariim
        </AppText>
        <AppText size={14} color={colors.soft}>
          Ma rabtaa habka Ramadaan? Waqtiyada Suxuurta iyo Afurka, iyo tiriyaha Taraawiixda. Dejinta waad ka bedeli
          kartaa mar kasta.
        </AppText>
        <View style={styles.actions}>
          <Button label="Haa, fur" onPress={() => answer(true)} style={styles.action} />
          <Button label="Maya" variant="secondary" onPress={() => answer(false)} style={styles.action} />
        </View>
      </Card>
    );
  }

  const next = nextFastEvent(now, today, tomorrow);
  const name = next.kind === 'suhoor' ? 'Suxuur' : 'Afur';
  const night = ramadanNight(hijri, now, today);

  return (
    <>
      <Card
        style={styles.card}
        accessibilityLabel={`${name} ${formatTime(next.at)}, ${formatCountdown(next.at.getTime() - now.getTime())}`}
      >
        <AppText size={11} weight="extrabold" color={colors.amberText} style={styles.eyebrow}>
          RAMADAAN
        </AppText>
        <View style={styles.times}>
          <Time label="Suxuur" at={next.kind === 'suhoor' ? next.at : tomorrow.fajr} active={next.kind === 'suhoor'} />
          <Time label="Afur" at={today.maghrib} active={next.kind === 'iftar'} />
        </View>
        <AppText size={15} weight="bold">
          {name}: {formatCountdown(next.at.getTime() - now.getTime())}
        </AppText>
      </Card>

      {isLastTenNights(night) && (
        <Card style={styles.card}>
          <AppText size={17} weight="extrabold">
            Tobanka habeen ee ugu dambeeya
          </AppText>
          <AppText size={14} color={colors.soft}>
            Caawa waa habeenka {night}aad ee Ramadaan.
          </AppText>
        </Card>
      )}

      <Card onPress={() => router.push('/taraawiix')} style={styles.card} accessibilityLabel="Tiriyaha Taraawiixda">
        <AppText size={17} weight="extrabold">
          Taraawiix
        </AppText>
        <AppText size={14} color={colors.soft}>
          Tiri rakacooyinka caawa.
        </AppText>
      </Card>
    </>
  );
}

function Time({ label, at, active }: { label: string; at: Date; active: boolean }) {
  return (
    <View style={styles.time}>
      <AppText size={13} color={colors.soft}>
        {label}
      </AppText>
      <AppText size={22} weight="extrabold" color={active ? colors.primary : colors.ink}>
        {formatTime(at)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  eyebrow: { letterSpacing: 1.2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  action: { flex: 1 },
  times: { flexDirection: 'row', gap: 24 },
  time: { gap: 2 },
});
