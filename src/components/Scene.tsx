import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '../theme/theme';

/** Height of the ground SVG for a given width (390 × 300 reference). */
export const groundHeight = (width: number) => (width * 300) / 390;

/** Distance from the top of the ground SVG to the first grass layer, in px. */
export const grassOffset = (width: number) => (width * 62) / 390;

export function Sky({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Svg style={[StyleSheet.absoluteFill, style]} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10" accessible={false}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.sky1} />
          <Stop offset="0.5" stopColor={colors.sky2} />
          <Stop offset="1" stopColor={colors.sky3} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="10" height="10" fill="url(#sky)" />
    </Svg>
  );
}

export function Ground({ width }: { width: number }) {
  return (
    <Svg width={width} height={groundHeight(width)} viewBox="0 0 390 300" accessible={false}>
      <Path d="M0 40 C80 12 160 30 230 22 C300 14 350 30 390 26 V300 H0Z" fill={colors.hill} />
      <Path d="M0 70 C90 54 180 66 260 58 C320 52 360 60 390 62 V300 H0Z" fill={colors.grass1} />
      <Path d="M0 112 C120 100 260 106 390 98 V300 H0Z" fill={colors.grass2} />
      <Path d="M0 210 C130 200 260 206 390 198 V300 H0Z" fill={colors.grass3} />
    </Svg>
  );
}

/** Full-screen sky with the hill and grass at the bottom. */
export function Scene({ children, style, showGround = true }: { children?: ReactNode; style?: StyleProp<ViewStyle>; showGround?: boolean }) {
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.fill, style]}>
      <Sky />
      {showGround && (
        <View style={styles.ground} pointerEvents="none">
          <Ground width={width} />
        </View>
      )}
      {children}
    </View>
  );
}

/** Small square scene used on cards. */
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
  fill: { flex: 1, backgroundColor: colors.sky1 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  mini: { overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
});
