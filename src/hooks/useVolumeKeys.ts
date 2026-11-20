import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { startVolumeKeys } from '../../modules/volume-keys';

export interface VolumeKeyHandlers {
  /** Volume Down. */
  down(): void;
  /** Volume Up. */
  up(): void;
}

/**
 * Routes the volume keys to `handlers` while `enabled`, the calling screen is
 * focused and the app is in the foreground. Otherwise the keys change the
 * volume as usual.
 */
export function useVolumeKeys(enabled: boolean, handlers: VolumeKeyHandlers): void {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !foreground) return undefined;
      return startVolumeKeys((key) => (key === 'down' ? latest.current.down() : latest.current.up()));
    }, [enabled, foreground]),
  );
}
