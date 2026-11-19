import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../theme/theme';

export type IconName =
  | 'home'
  | 'book'
  | 'bell'
  | 'bellOff'
  | 'history'
  | 'settings'
  | 'back'
  | 'undo'
  | 'reset'
  | 'search'
  | 'check'
  | 'plus'
  | 'minus'
  | 'share'
  | 'chevron'
  | 'alert';

const PATHS: Record<IconName, string[]> = {
  home: ['M3.5 11 L12 4 L20.5 11 V20 H14.5 V14.5 H9.5 V20 H3.5 Z'],
  book: ['M4 5.5 C7 4.5 10 4.5 12 6.5 C14 4.5 17 4.5 20 5.5 V19 C17 18 14 18 12 20 C10 18 7 18 4 19 Z', 'M12 6.5 V20'],
  bell: ['M6 16 V11 C6 7.7 8.7 5 12 5 C15.3 5 18 7.7 18 11 V16 L19.5 17.5 H4.5 Z', 'M10 20 C10.6 21.2 13.4 21.2 14 20'],
  bellOff: ['M6 16 V11 C6 7.7 8.7 5 12 5 C15.3 5 18 7.7 18 11 V16 L19.5 17.5 H4.5 Z', 'M4 4 L20 20'],
  history: ['M4.5 12 A7.5 7.5 0 1 0 7 6.4', 'M4 4.5 V8.5 H8', 'M12 8 V12 L15 14'],
  settings: [
    'M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5.3 5.3 L7 7 M17 17 L18.7 18.7 M5.3 18.7 L7 17 M17 7 L18.7 5.3',
  ],
  back: ['M15 5 L8 12 L15 19'],
  undo: ['M8.5 6 L4.5 10 L8.5 14', 'M4.5 10 H14 C17.3 10 20 12.7 20 16 C20 17.2 19.7 18.2 19.2 19'],
  reset: ['M19.5 12 A7.5 7.5 0 1 1 17.3 6.7', 'M19.5 4 V8.5 H15'],
  search: ['M16 16 L20.5 20.5'],
  check: ['M5 12.5 L10 17 L19 7'],
  plus: ['M12 5 V19 M5 12 H19'],
  minus: ['M5 12 H19'],
  share: ['M12 4 V15', 'M8 8 L12 4 L16 8', 'M5 12 V19.5 H19 V12'],
  chevron: ['M9 5 L16 12 L9 19'],
  alert: ['M12 7.5 V13', 'M12 16.5 V16.6'],
};

export function Icon({ name, size = 24, color = colors.ink, strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {name === 'settings' && <Circle cx={12} cy={12} r={5.5} stroke={color} strokeWidth={strokeWidth} fill="none" />}
      {name === 'settings' && <Circle cx={12} cy={12} r={2} stroke={color} strokeWidth={strokeWidth} fill="none" />}
      {name === 'search' && <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={strokeWidth} fill="none" />}
      {name === 'alert' && <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} fill="none" />}
      {PATHS[name].map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </Svg>
  );
}
