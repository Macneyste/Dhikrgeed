import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { SkyPeriod } from '../core/sky.ts';
import { InkProvider, useSkyPeriod } from '../hooks/useSky';
import { useSettings } from '../hooks/useSettings';
import { colors, skyThemes, type SkyTheme } from '../theme/theme';

/** Height of the ground SVG for a given width (390 × 300 reference). */
export const groundHeight = (width: number) => (width * 300) / 390;

/** Distance from the top of the ground SVG to the first grass layer, in px. */
export const grassOffset = (width: number) => (width * 62) / 390;

const CROSSFADE_MS = 1000;

export const Sky = memo(function Sky({ period = 'day', style }: { period?: SkyPeriod; style?: StyleProp<ViewStyle> }) {
  const [top, middle, bottom] = skyThemes[period].stops;
  const id = `sky-${period}`;
  return (
    <Svg
      style={[StyleSheet.absoluteFill, style]}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 10 10"
      accessible={false}
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="0.5" stopColor={middle} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="10" height="10" fill={`url(#${id})`} />
    </Svg>
  );
});

// 26 fixed stars in the upper sky, as fractions of the screen. Static: no twinkle.
const STARS: readonly [number, number, number][] = Array.from({ length: 26 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  const fx = a - Math.floor(a);
  const fy = b - Math.floor(b);
  return [0.04 + fx * 0.92, 0.03 + fy * 0.5, i % 5 === 0 ? 1.6 : 1];
});

const Stars = memo(function Stars({ width, height }: { width: number; height: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} accessible={false} pointerEvents="none">
      {STARS.map(([x, y, r], i) => (
        <Circle key={i} cx={x * width} cy={y * height} r={r} fill="#FFFFFF" opacity={r > 1 ? 0.9 : 0.65} />
      ))}
    </Svg>
  );
});

/** Sky gradient plus stars at night. */
function SkyLayer({ period, width, height }: { period: SkyPeriod; width: number; height: number }) {
  return (
    <>
      <Sky period={period} />
      {skyThemes[period].stars && <Stars width={width} height={height} />}
    </>
  );
}

export const Ground = memo(function Ground({ width, theme = skyThemes.day }: { width: number; theme?: SkyTheme }) {
  const [g1, g2, g3] = theme.grass;
  return (
    <Svg width={width} height={groundHeight(width)} viewBox="0 0 390 300" accessible={false}>
      <Path d="M0 40 C80 12 160 30 230 22 C300 14 350 30 390 26 V300 H0Z" fill={theme.hill} />
      <Path d="M0 70 C90 54 180 66 260 58 C320 52 360 60 390 62 V300 H0Z" fill={g1} />
      <Path d="M0 112 C120 100 260 106 390 98 V300 H0Z" fill={g2} />
      <Path d="M0 210 C130 200 260 206 390 198 V300 H0Z" fill={g3} />
    </Svg>
  );
});

/** The previous sky, fading out over the new one, then removed. */
function FadingSky(props: { period: SkyPeriod; width: number; height: number; onDone: () => void }) {
  const { onDone } = props;
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const anim = Animated.timing(opacity, { toValue: 0, duration: CROSSFADE_MS, useNativeDriver: true });
    anim.start(({ finished }) => finished && onDone());
    return () => anim.stop();
  }, [opacity, onDone]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <SkyLayer period={props.period} width={props.width} height={props.height} />
    </Animated.View>
  );
}

/**
 * Remembers the period that was showing so it can fade out over 1 s.
 * With reduced motion the new sky appears at once.
 */
function useCrossfade(period: SkyPeriod, reducedMotion: boolean) {
  const [state, setState] = useState<{ shown: SkyPeriod; previous: SkyPeriod | null }>({
    shown: period,
    previous: null,
  });
  // Adjusting state while rendering when the period prop changes (React's
  // recommended alternative to an effect).
  if (state.shown !== period) setState({ shown: period, previous: reducedMotion ? null : state.shown });
  const done = useCallback(() => setState((s) => ({ ...s, previous: null })), []);
  return { previous: reducedMotion ? null : state.previous, done };
}

/** Full-screen sky with the hill and grass at the bottom. Follows the time of day. */
export function Scene({
  children,
  style,
  showGround = true,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  showGround?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const { settings } = useSettings();
  const period = useSkyPeriod();
  const theme = skyThemes[period];
  const { previous, done } = useCrossfade(period, settings.reducedMotion);
  const ink = useMemo(() => ({ ink: theme.ink, soft: theme.soft, onGrass: theme.onGrass }), [theme]);

  return (
    <View style={[styles.fill, { backgroundColor: theme.stops[0] }, style]}>
      <StatusBar style={period === 'night' ? 'light' : 'dark'} />
      <SkyLayer period={period} width={width} height={height} />
      {previous && <FadingSky key={previous} period={previous} width={width} height={height} onDone={done} />}
      {showGround && (
        <View style={styles.ground} pointerEvents="none">
          <Ground width={width} theme={theme} />
        </View>
      )}
      <InkProvider value={ink}>{children}</InkProvider>
    </View>
  );
}

/** Small square scene used on cards (always day: cards are light). */
export function MiniScene({ size, children }: { size: number; children?: ReactNode }) {
  return (
    <View style={[styles.mini, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Sky />
      <View style={styles.ground} pointerEvents="none">
        <Svg width={size} height={size * 0.38} viewBox="0 0 390 150" preserveAspectRatio="none" accessible={false}>
          <Path d="M0 20 C90 6 180 16 260 10 C320 6 360 12 390 14 V150 H0Z" fill={colors.grass1} />
          <Path d="M0 70 C120 60 260 66 390 58 V150 H0Z" fill={colors.grass2} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  mini: { overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
});
