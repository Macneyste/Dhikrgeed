import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { resolveCity } from '../core/cities.ts';
import { addDays, dayKey, startOfDay } from '../core/format.ts';
import { nextSkyChange, skyFor, type SkyPeriod } from '../core/sky.ts';
import { skyTimesFor } from '../services/prayerTimes';
import { skyThemes, type SkyTheme } from '../theme/theme';
import { useSettings } from './useSettings';

const SkyContext = createContext<SkyPeriod>('day');

/**
 * Follows the time of day for the chosen city: one timer for the next
 * boundary (or midnight), plus a refresh when the app returns.
 */
export function SkyProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [now, setNow] = useState(() => new Date());

  const city = useMemo(() => resolveCity(settings.city, settings.customCity), [settings.city, settings.customCity]);
  const day = dayKey(now);
  // Recalculate only when the city or the day changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const times = useMemo(() => skyTimesFor(city, now), [city, day]);

  useEffect(() => {
    const at = nextSkyChange(now, times) ?? startOfDay(addDays(now, 1));
    const id = setTimeout(() => setNow(new Date()), Math.max(1000, at.getTime() - now.getTime() + 500));
    return () => clearTimeout(id);
  }, [now, times]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(new Date()));
    return () => sub.remove();
  }, []);

  return <SkyContext.Provider value={skyFor(now, times)}>{children}</SkyContext.Provider>;
}

export function useSkyPeriod(): SkyPeriod {
  return useContext(SkyContext);
}

// ---------------------------------------------------------------------------
// Text colour for whatever surface the text sits on. Scene provides the sky's
// colours; cards and sheets reset to the day colours.

export type Ink = Pick<SkyTheme, 'ink' | 'soft' | 'onGrass'>;

const DAY_INK: Ink = { ink: skyThemes.day.ink, soft: skyThemes.day.soft, onGrass: skyThemes.day.onGrass };

const InkContext = createContext<Ink>(DAY_INK);

export function InkProvider({ value = DAY_INK, children }: { value?: Ink; children: ReactNode }) {
  return <InkContext.Provider value={value}>{children}</InkContext.Provider>;
}

/** Ink of the surface this component is rendered inside. */
export function useInk(): Ink {
  return useContext(InkContext);
}

/** Ink of the current sky, for screens that render their own <Scene>. */
export function useSkyInk(): Ink {
  const t = skyThemes[useSkyPeriod()];
  return useMemo(() => ({ ink: t.ink, soft: t.soft, onGrass: t.onGrass }), [t]);
}
