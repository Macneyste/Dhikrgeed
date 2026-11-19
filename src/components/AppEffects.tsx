import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { routeFromNotificationData } from '../core/routes.ts';
import { useSettings } from '../hooks/useSettings';
import { rescheduleReminders } from '../services/notifications';

/**
 * Background duties with no UI:
 * - reschedules reminders on app open, when the app returns to the
 *   foreground, and whenever the city or reminder settings change;
 * - opens the after-prayer counter when a reminder is tapped, but only for
 *   allowlisted routes.
 */
export function AppEffects() {
  const { settings } = useSettings();
  const { city, customCity, reminders } = settings;

  useEffect(() => {
    const run = () =>
      rescheduleReminders({ ...settings, city, customCity, reminders }).catch(() => {
        // Reminders are best effort; counting must never depend on them.
      });
    run();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && run());
    return () => sub.remove();
    // Only these settings affect reminders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, customCity, reminders]);

  useEffect(() => {
    const open = (data: unknown) => {
      const path = routeFromNotificationData(data);
      if (path) router.push(path as '/session/after-prayer');
    };
    // Cold start from a notification: wait a moment so navigation is mounted.
    const timer = setTimeout(() => {
      Notifications.getLastNotificationResponseAsync()
        .then((r) => r && open(r.notification.request.content.data))
        .catch(() => {});
    }, 400);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data));
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return null;
}
