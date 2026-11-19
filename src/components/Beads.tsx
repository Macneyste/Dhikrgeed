import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from 'react-native-svg';

import type { Phase } from '../core/types.ts';
import { phaseColors } from '../theme/theme';

const BEADS = 12;

function BeadGradient({ id, phase }: { id: string; phase: Phase }) {
  const c = phaseColors[phase];
  return (
    <RadialGradient id={id} cx="35%" cy="30%" r="70%">
      <Stop offset="0" stopColor={c.light} />
      <Stop offset="0.55" stopColor={c.base} />
      <Stop offset="1" stopColor={c.dark} />
    </RadialGradient>
  );
}

/** One bead as a standalone view (used for the drop animation). */
export function Bead({ phase, size }: { phase: Phase; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <BeadGradient id={`b-${phase}`} phase={phase} />
      </Defs>
      <Circle cx={12} cy={13} r={10} fill="#5A3424" opacity={0.15} />
      <Circle cx={12} cy={12} r={10} fill={`url(#b-${phase})`} />
    </Svg>
  );
}

export interface TasbihStringProps {
  width: number;
  phase: Phase;
  /** Phase of the next item, or null on the last item. */
  nextPhase: Phase | null;
  /** Counts left in the current item. */
  remaining: number;
}

/** Diagonal string with 12 beads, a gold knot and tassel at the right end. */
export function TasbihString({ width, phase, nextPhase, remaining }: TasbihStringProps) {
  const h = 74;
  const x0 = 18;
  const x1 = width - 46;
  const y0 = 14;
  const y1 = y0 + Math.tan((7 * Math.PI) / 180) * (x1 - x0);
  const nextCount = nextPhase && remaining < BEADS ? BEADS - remaining : 0;
  const r = Math.min(13, (x1 - x0) / BEADS / 2.2);
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none">
      <Svg width={width} height={h + 30}>
        <Defs>
          <BeadGradient id="s-teal" phase="teal" />
          <BeadGradient id="s-purple" phase="purple" />
          <BeadGradient id="s-gold" phase="gold" />
        </Defs>
        <Line x1={x0 - 10} y1={y0 - 1} x2={x1 + 16} y2={y1 + 2} stroke="#8B6B5C" strokeWidth={1.6} />
        {Array.from({ length: BEADS }, (_, i) => {
          const t = i / (BEADS - 1);
          const x = x0 + t * (x1 - x0 - r * 2) + r;
          const y = y0 + t * (y1 - y0);
          const p = i < nextCount && nextPhase ? nextPhase : phase;
          return (
            <Circle key={i} cx={x} cy={y} r={r} fill={`url(#s-${p})`} stroke="rgba(90,52,36,0.12)" strokeWidth={1} />
          );
        })}
        <Circle cx={x1 + 20} cy={y1 + 3} r={5.5} fill={phaseColors.gold.base} />
        <Path
          d={`M${x1 + 20} ${y1 + 8} L${x1 + 15} ${y1 + 30} M${x1 + 20} ${y1 + 8} L${x1 + 20} ${y1 + 32} M${x1 + 20} ${y1 + 8} L${x1 + 25} ${y1 + 30}`}
          stroke={phaseColors.gold.dark}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

/** End of the string in the TasbihString's own coordinates, for drop animations. */
export function stringEnd(width: number): { x: number; y: number } {
  const x0 = 18;
  const x1 = width - 46;
  return { x: x1 - 10, y: 14 + Math.tan((7 * Math.PI) / 180) * (x1 - x0) };
}

interface Drop {
  key: number;
  phase: Phase;
}

/**
 * Animates a bead falling from `from` to `to` (screen-relative coordinates
 * inside the parent) each time `seq` changes.
 */
export function BeadDrops({
  seq,
  phase,
  from,
  to,
  reducedMotion,
}: {
  seq: number | null;
  phase: Phase;
  from: { x: number; y: number };
  to: { x: number; y: number };
  reducedMotion: boolean;
}) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (seq === null || seq === last.current || reducedMotion) return;
    last.current = seq;
    // Defer so state is set from a callback, not synchronously in the effect.
    const id = setTimeout(() => setDrops((d) => [...d.slice(-5), { key: seq, phase }]), 0);
    return () => clearTimeout(id);
  }, [seq, phase, reducedMotion]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {drops.map((d) => (
        <FallingBead key={d.key} phase={d.phase} from={from} to={to} onDone={() => setDrops((all) => all.filter((x) => x.key !== d.key))} />
      ))}
    </View>
  );
}

function FallingBead({
  phase,
  from,
  to,
  onDone,
}: {
  phase: Phase;
  from: { x: number; y: number };
  to: { x: number; y: number };
  onDone: () => void;
}) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.timing(t, { toValue: 1, duration: 550, easing: Easing.in(Easing.quad), useNativeDriver: true });
    anim.start(({ finished }) => finished && onDone());
    return () => anim.stop();
    // onDone identity changes each render; the animation runs once per bead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
  const size = 22;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        opacity: t.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [from.x - size / 2, to.x - size / 2] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [from.y - size / 2, to.y - size / 2] }) },
        ],
      }}
    >
      <Bead phase={phase} size={size} />
    </Animated.View>
  );
}
