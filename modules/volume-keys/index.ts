// JS side of the local volume-keys module (Android only).
// Without the native module (tests, web, Expo Go) every call is a no-op.

import { NativeModule, requireOptionalNativeModule } from 'expo';

export type VolumeKey = 'up' | 'down';

type Events = { onVolumeKey: (event: { key: string }) => void };

declare class VolumeKeysNative extends NativeModule<Events> {
  setEnabled(enabled: boolean): void;
}

const native = requireOptionalNativeModule<VolumeKeysNative>('VolumeKeys');

export const volumeKeysAvailable = native != null;

/**
 * Starts consuming volume keys and calls `onKey` once per press.
 * Returns a function that stops and gives the keys back to the system.
 */
export function startVolumeKeys(onKey: (key: VolumeKey) => void): () => void {
  if (!native) return () => {};
  const sub = native.addListener('onVolumeKey', (e) => {
    if (e.key === 'up' || e.key === 'down') onKey(e.key);
  });
  native.setEnabled(true);
  return () => {
    native.setEnabled(false);
    sub.remove();
  };
}
