// Local prayer reminders. Inexact date triggers only; nothing leaves the device.

import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { resolveCity } from '../core/cities.ts';
import { planReminders, PRAYER_KEYS } from '../core/reminders.ts';
import type { AppSettings } from '../db/settingsRepo';
import { prayerDays } from './prayerTimes';

export const CHANNEL_ID = 'prayer';

let configured = false;

export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Xusuusinta salaadda',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
    });
  }
}

export async function hasPermission(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

export async function requestPermission(): Promise<boolean> {
  const status = await Notifications.requestPermissionsAsync();
  return status.granted;
}

/** Cancels everything and schedules reminders for today and the next 2 days. */
export async function rescheduleReminders(settings: AppSettings): Promise<number> {
  await configureNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const anyEnabled = PRAYER_KEYS.some((k) => settings.reminders.prayers[k]);
  if (!anyEnabled || !(await hasPermission())) return 0;

  const city = resolveCity(settings.city, settings.customCity);
  const now = new Date();
  const plans = planReminders({
    days: prayerDays(city, now, 3),
    settings: settings.reminders,
    cityName: city.name,
    now,
  });
  for (const plan of plans) {
    await Notifications.scheduleNotificationAsync({
      identifier: plan.id,
      content: { title: plan.title, body: plan.body, data: plan.data },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: plan.fireAt, channelId: CHANNEL_ID },
    });
  }
  return plans.length;
}
