import { useEffect, useState, type ReactNode } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { treeLayers } from '../core/progress.ts';
import { tree as T } from '../theme/theme';

const AnimatedG = Animated.createAnimatedComponent(G);

function Layer({ visible, reducedMotion, children }: { visible: boolean; reducedMotion: boolean; children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(visible ? 1 : 0));
  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(visible ? 1 : 0);
      return;
    }
    const anim = Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 600, useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [visible, reducedMotion, opacity]);
  return <AnimatedG opacity={opacity}>{children}</AnimatedG>;
}

const L = T.leaves;

function Leaf({ x, y, angle, color, size = 1 }: { x: number; y: number; angle: number; color: string; size?: number }) {
  return (
    <Path
      d={`M0 0 C${6 * size} ${-6 * size} ${16 * size} ${-6 * size} ${22 * size} 0 C${16 * size} ${6 * size} ${6 * size} ${6 * size} 0 0Z`}
      fill={color}
      transform={`translate(${x} ${y}) rotate(${angle})`}
    />
  );
}

function Flower({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <Circle key={a} cx={4.2 * Math.cos((a * Math.PI) / 180)} cy={4.2 * Math.sin((a * Math.PI) / 180)} r={3.4} fill="#FFFFFF" />
      ))}
      <Circle r={2.6} fill={T.flowerCenter} />
    </G>
  );
}

function Fruit({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M0 -7 C1 -10 3 -12 5 -12" stroke={T.stem} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Circle r={7} fill={T.fruit} />
      <Circle cx={-2.4} cy={-2.4} r={2.1} fill={T.fruitHighlight} />
    </G>
  );
}

const STEM_LEAVES: [number, number, number][] = [
  [130, 258, -150], [130, 246, -30], [131, 232, -155], [131, 220, -25], [131, 206, -150],
  [130, 194, -30], [130, 182, -150], [130, 172, -35], [130, 162, -95],
];

const CANOPY: [number, number, number, number][] = [
  [130, 112, 62, 0], [78, 134, 40, 1], [182, 134, 40, 1], [96, 88, 42, 2], [164, 86, 42, 2],
  [130, 62, 40, 3], [64, 106, 26, 3], [196, 106, 26, 3], [110, 136, 30, 4], [152, 132, 30, 4], [130, 90, 30, 4],
];

const FLOWERS: [number, number][] = [
  [96, 70], [152, 56], [182, 104], [74, 120], [124, 98], [204, 130], [58, 140],
  [110, 46], [168, 130], [140, 140], [86, 96], [196, 82], [130, 72],
];

const FRUITS: [number, number][] = [[118, 66], [166, 76], [80, 108], [190, 118], [136, 118], [100, 140], [62, 128], [158, 150]];
const EXTRA_FRUITS: [number, number][] = [[144, 50], [96, 116], [206, 108], [116, 152], [176, 100], [70, 92], [150, 96]];

export interface TreeProps {
  /** Round progress 0..1. */
  progress: number;
  width: number;
  reducedMotion?: boolean;
}

/** The dhikr tree. Grows with progress; purely motivational. */
export function Tree({ progress, width, reducedMotion = false }: TreeProps) {
  const layers = treeLayers(progress);
  const rm = reducedMotion;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Geedka: ${layers.stage.label}`}>
      <Svg width={width} height={(width * 300) / 260} viewBox="0 0 260 300">
        {/* soil */}
        <Ellipse cx={130} cy={284} rx={72} ry={12} fill={T.soilDark} />
        <Ellipse cx={130} cy={280} rx={56} ry={8} fill={T.soil} />

        <Layer visible={layers.seed} reducedMotion={rm}>
          <Ellipse cx={130} cy={276} rx={7} ry={5} fill="#9A6A3E" transform="rotate(-20 130 276)" />
          <Path d="M127 274 C129 272 132 272 134 274" stroke="#C49464" strokeWidth={1.2} fill="none" />
        </Layer>

        <Layer visible={layers.sprout} reducedMotion={rm}>
          <Path d="M130 280 C131 270 129 262 130 254" stroke={T.stem} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Leaf x={130} y={256} angle={-150} color={L[2]} size={0.9} />
          <Leaf x={130} y={254} angle={-30} color={L[3]} size={0.9} />
        </Layer>

        <Layer visible={layers.stem} reducedMotion={rm}>
          <Path d="M130 280 C127 240 134 200 130 158" stroke={T.stem} strokeWidth={4} fill="none" strokeLinecap="round" />
          {STEM_LEAVES.map(([x, y, a], i) => (
            <Leaf key={i} x={x} y={y} angle={a} color={L[i % L.length]!} size={0.85} />
          ))}
        </Layer>

        <Layer visible={layers.branches} reducedMotion={rm}>
          <Path d="M118 282 C124 240 124 200 126 150 L134 150 C136 200 136 240 142 282Z" fill={T.bark} />
          <Path d="M128 214 C112 196 98 178 84 158" stroke={T.bark} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Path d="M132 200 C150 184 164 168 178 148" stroke={T.bark} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Path d="M129 172 C118 150 108 132 100 112" stroke={T.bark} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <Path d="M131 166 C144 146 152 128 160 108" stroke={T.bark} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <Layer visible={!layers.canopy} reducedMotion={rm}>
            {[[84, 156], [178, 146], [100, 110], [160, 106], [130, 146]].map(([x, y], i) => (
              <G key={i}>
                <Circle cx={x} cy={y} r={14} fill={L[(i + 1) % L.length]} />
                <Circle cx={x! - 8} cy={y! + 4} r={9} fill={L[(i + 3) % L.length]} />
                <Circle cx={x! + 9} cy={y! + 3} r={8} fill={L[(i + 2) % L.length]} />
              </G>
            ))}
          </Layer>
        </Layer>

        <Layer visible={layers.canopy} reducedMotion={rm}>
          {CANOPY.map(([x, y, r, c], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill={L[c]} />
          ))}
        </Layer>

        <Layer visible={layers.flowers} reducedMotion={rm}>
          {FLOWERS.map(([x, y], i) => (
            <Flower key={i} x={x} y={y} />
          ))}
        </Layer>

        <Layer visible={layers.fruits} reducedMotion={rm}>
          {FRUITS.map(([x, y], i) => (
            <Fruit key={i} x={x} y={y} />
          ))}
        </Layer>

        <Layer visible={layers.extraFruits} reducedMotion={rm}>
          {EXTRA_FRUITS.map(([x, y], i) => (
            <Fruit key={i} x={x} y={y} />
          ))}
        </Layer>
      </Svg>
    </View>
  );
}
