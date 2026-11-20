import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { getDatabase } from '../db/database';
import { DEFAULT_SETTINGS, loadSettings, saveSetting, type AppSettings } from '../db/settingsRepo';

interface SettingsContextValue {
  settings: AppSettings;
  /** Updates state at once and persists; reverts if the write fails. */
  update<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void>;
  /** Re-reads every setting from the database (after a restore). */
  reload(): Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  update: async () => {},
  reload: async () => {},
});

export function SettingsProvider({ initial, children }: { initial: AppSettings; children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(initial);

  const update = useCallback(async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    let previous: AppSettings[K] | undefined;
    setSettings((s) => {
      previous = s[key];
      return { ...s, [key]: value };
    });
    try {
      const db = await getDatabase();
      await saveSetting(db, key, value);
    } catch (error) {
      setSettings((s) => ({ ...s, [key]: previous as AppSettings[K] }));
      throw error;
    }
  }, []);

  const reload = useCallback(async () => {
    setSettings(await loadSettings(await getDatabase()));
  }, []);

  const value = useMemo(() => ({ settings, update, reload }), [settings, update, reload]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
