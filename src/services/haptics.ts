// Haptic patterns for counting. Called only after a save succeeds.
// Devices without a vibrator (or with haptics disabled) must never crash.

import * as Haptics from 'expo-haptics';

export type HapticEvent = 'count' | 'item' | 'round' | 'undo';

function run(event: HapticEvent): Promise<void> {
  switch (event) {
    case 'round':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'item':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'undo':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'count':
      return Haptics.selectionAsync();
  }
}

export function playHaptic(event: HapticEvent, enabled: boolean): void {
  if (!enabled) return;
  try {
    run(event).catch(() => {});
  } catch {
    // Native module missing or no vibrator: feedback is optional.
  }
}
