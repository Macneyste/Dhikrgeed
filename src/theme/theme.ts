import type { SkyPeriod } from '../core/sky.ts';
import type { Phase } from '../core/types.ts';

export const colors = {
  ink: '#3A2420',
  soft: '#6A5048',
  muted: '#7A645B',
  sky1: '#FFF6EF',
  sky2: '#FCE8DD',
  sky3: '#F7D7C8',
  surface: '#FFFFFF',
  surfaceWarm: '#FFFBF8',
  line: '#F0DCD0',
  lineSoft: '#F6E8E0',
  primary: '#2F6B3A',
  onPrimary: '#FFFFFF',
  grassDark: '#24401A',
  danger: '#A63D2F',
  hill: '#F2CFBF',
  grass1: '#B9D38A',
  grass2: '#A2C473',
  grass3: '#8DB560',
  amberSoft: '#FBEBC4',
  amberText: '#835C0B',
  shadow: '#5A3424',
} as const;

/** Mixes a #RRGGBB colour toward black by `amount` (0..1). */
export function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((n >> shift) & 255) * (1 - amount))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`.toUpperCase();
}

export interface SkyTheme {
  /** Top, middle and bottom of the sky gradient. */
  stops: readonly [string, string, string];
  /** Text drawn directly on the sky (≥ 4.5:1 against every stop). */
  ink: string;
  soft: string;
  /** Text drawn on the grass. */
  onGrass: string;
  hill: string;
  grass: readonly [string, string, string];
  stars: boolean;
}

const dayGround = { hill: colors.hill, grass: [colors.grass1, colors.grass2, colors.grass3] as const };

export const skyThemes: Record<SkyPeriod, SkyTheme> = {
  dawn: {
    stops: ['#FDE7D6', '#F6C9B3', '#E9A98F'],
    ink: colors.ink,
    soft: '#55372D',
    onGrass: colors.grassDark,
    stars: false,
    ...dayGround,
  },
  day: {
    stops: [colors.sky1, colors.sky2, colors.sky3],
    ink: colors.ink,
    soft: colors.soft,
    onGrass: colors.grassDark,
    stars: false,
    ...dayGround,
  },
  dusk: {
    stops: ['#FBD3B0', '#F2A57E', '#C9786A'],
    ink: '#24120F',
    soft: '#3A211B',
    onGrass: colors.grassDark,
    stars: false,
    ...dayGround,
  },
  night: {
    stops: ['#1E2340', '#2B3160', '#3D3F72'],
    ink: '#F5F1FF',
    soft: '#C9CBE8',
    onGrass: '#FFFFFF',
    stars: true,
    hill: darken(colors.hill, 0.4),
    grass: [darken(colors.grass1, 0.4), darken(colors.grass2, 0.4), darken(colors.grass3, 0.4)],
  },
};

export interface PhaseColors {
  text: string;
  light: string;
  base: string;
  dark: string;
}

export const phaseColors: Record<Phase, PhaseColors> = {
  teal: { text: '#17756B', light: '#A6E6DD', base: '#2FA597', dark: '#1B6E64' },
  purple: { text: '#5B3FA8', light: '#D6C8FA', base: '#8467D6', dark: '#5638A6' },
  gold: { text: '#835C0B', light: '#FBE3A0', base: '#D9A63B', dark: '#A27318' },
};

export const tree = {
  soilDark: '#5E3A22',
  soil: '#7A4B2C',
  bark: '#7A4B2C',
  leaves: ['#3F8B3B', '#4E9C45', '#5BAA4A', '#6DBA55', '#7CC662'],
  flowerCenter: '#E9B949',
  fruit: '#D63B2F',
  fruitHighlight: '#F39488',
  stem: '#3F8B3B',
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  arabic: 'Amiri_700Bold',
} as const;

export const radius = {
  card: 20,
  button: 16,
  chip: 20,
} as const;

/** Minimum touch target in dp. */
export const TOUCH = 48;

export const type = {
  screenTitle: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.ink },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.soft, lineHeight: 22 },
  caption: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.soft },
  chip: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1.3 },
  arabicShort: { fontFamily: fonts.arabic, fontSize: 45, color: colors.ink, writingDirection: 'rtl' as const },
  arabicLong: { fontFamily: fonts.arabic, fontSize: 26, color: colors.ink, writingDirection: 'rtl' as const },
} as const;

export const shadow = {
  shadowColor: colors.shadow,
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

/** Applies the "Qoraal weyn" (large text) setting. */
export function scaleFont(size: number, large: boolean): number {
  return large ? Math.round(size * 1.18) : size;
}
