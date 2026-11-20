import { router, useFocusEffect } from 'expo-router';
import { Magnetometer } from 'expo-sensors';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { resolveCity } from '@/core/cities';
import { compassPoint, headingFromMagnetometer, qiblaBearing, smoothHeading, turnToQibla } from '@/core/qibla';
import { useSettings } from '@/hooks/useSettings';
import { colors } from '@/theme/theme';

const DIAL = 260;
const FACING_TOLERANCE = 5;

/** Compass that turns with the phone; the green arrow is the qibla. */
function Dial({ heading, bearing }: { heading: number; bearing: number }) {
  const c = DIAL / 2;
  return (
    <Svg width={DIAL} height={DIAL} accessible={false}>
      <Circle cx={c} cy={c} r={c - 4} fill={colors.surface} stroke={colors.line} strokeWidth={2} />
      <G rotation={-heading} origin={`${c}, ${c}`}>
        {Array.from({ length: 36 }, (_, i) => (
          <Line
            key={i}
            x1={c}
            y1={10}
            x2={c}
            y2={i % 9 === 0 ? 26 : 18}
            stroke={colors.muted}
            strokeWidth={i % 9 === 0 ? 2 : 1}
            rotation={i * 10}
            origin={`${c}, ${c}`}
          />
        ))}
        <SvgText x={c} y={44} fill={colors.danger} fontSize={16} fontWeight="bold" textAnchor="middle">
          W
        </SvgText>
        <G rotation={bearing} origin={`${c}, ${c}`}>
          <Path d={`M${c} 52 L${c - 14} 84 L${c + 14} 84 Z`} fill={colors.primary} />
          <Line x1={c} y1={84} x2={c} y2={c} stroke={colors.primary} strokeWidth={4} strokeLinecap="round" />
        </G>
      </G>
      {/* Fixed marker: the top of the phone. */}
      <Path d={`M${c} 2 L${c - 8} 16 L${c + 8} 16 Z`} fill={colors.ink} />
      <Circle cx={c} cy={c} r={6} fill={colors.ink} />
    </Svg>
  );
}

export default function QiblaScreen() {
  const { settings } = useSettings();
  const city = useMemo(() => resolveCity(settings.city, settings.customCity), [settings.city, settings.customCity]);
  const bearing = qiblaBearing(city.lat, city.lng);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const smoothed = useRef<number | null>(null);

  // The sensor runs only while this screen is focused.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      let sub: { remove(): void } | null = null;
      Magnetometer.isAvailableAsync()
        .then((ok) => {
          if (!alive) return;
          setAvailable(ok);
          if (!ok) return;
          Magnetometer.setUpdateInterval(100);
          sub = Magnetometer.addListener(({ x, y }) => {
            smoothed.current = smoothHeading(smoothed.current, headingFromMagnetometer(x, y));
            setHeading(Math.round(smoothed.current));
          });
        })
        .catch(() => alive && setAvailable(false));
      return () => {
        alive = false;
        sub?.remove();
        smoothed.current = null;
      };
    }, []),
  );

  const turn = bearing !== null && heading !== null ? turnToQibla(bearing, heading) : null;
  const facing = turn !== null && Math.abs(turn) <= FACING_TOLERANCE;
  const bearingText = bearing === null ? '' : `${Math.round(bearing)}°`;

  return (
    <Screen
      title="Qibladda"
      left={<IconButton icon="back" label="Dib u noqo" onPress={() => router.back()} background={colors.surface} />}
    >
      <Card
        style={styles.summary}
        accessibilityLabel={`Qibladda ${city.name}: ${bearingText}, ${bearing === null ? '' : compassPoint(bearing)}`}
      >
        <AppText size={13} color={colors.soft}>
          {city.name}
        </AppText>
        <AppText size={34} weight="extrabold">
          {bearingText}
        </AppText>
        <AppText size={15} weight="bold">
          {bearing === null ? '' : compassPoint(bearing)} · laga bilaabo waqooyiga
        </AppText>
      </Card>

      {available && bearing !== null && heading !== null && (
        <View style={styles.dialWrap}>
          <Dial heading={heading} bearing={bearing} />
          <AppText
            size={16}
            weight="extrabold"
            color={facing ? colors.primary : colors.ink}
            align="center"
            accessibilityLiveRegion="polite"
          >
            {facing
              ? 'Waxaad u jeeddaa qibladda'
              : turn! > 0
                ? `U leexo midig ${Math.round(turn!)}°`
                : `U leexo bidix ${Math.round(-turn!)}°`}
          </AppText>
        </View>
      )}

      {available === false && (
        <AppText size={14} color={colors.soft} align="center">
          Telefoonkan compass ma laha. Isticmaal tirada sare: {bearingText} oo laga bilaabo waqooyiga.
        </AppText>
      )}

      {available && (
        <AppText size={13} color={colors.soft} align="center">
          Telefoonka si siman u qabo. Haddii jihadu ay khaldan tahay, telefoonka ku wareeji qaab 8 ah. Ka fogee bir iyo
          aalado koronto. Compass-ku wuxuu muujiyaa waqooyiga birlabta, kaas oo meelaha qaarkood dhowr darajo ka duwan.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { alignItems: 'center', gap: 2 },
  dialWrap: { alignItems: 'center', gap: 14, marginVertical: 8 },
});
