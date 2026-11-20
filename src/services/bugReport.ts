// "Soo sheeg cilad": opens an email draft the person reviews and sends.
// No tracking: nothing is sent automatically.

import Constants from 'expo-constants';
import * as MailComposer from 'expo-mail-composer';
import { Linking, Platform } from 'react-native';

import { bugReportBody } from '../core/log.ts';
import { logLines } from './log';

const SUBJECT = 'Dhikrgeed: cilad';

/** Support address from app.json (expo.extra.supportEmail); empty means the person fills it in. */
function supportEmail(): string {
  const value = (Constants.expoConfig?.extra as { supportEmail?: unknown } | undefined)?.supportEmail;
  return typeof value === 'string' && /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(value) ? value : '';
}

export async function openBugReport(): Promise<void> {
  const constants = Platform.constants as { Model?: string; Manufacturer?: string };
  const body = bugReportBody({
    appVersion: Constants.expoConfig?.version ?? '?',
    androidVersion: String(Platform.Version),
    deviceModel: [constants.Manufacturer, constants.Model].filter(Boolean).join(' '),
    logLines: logLines(),
  });
  const to = supportEmail();
  if (await MailComposer.isAvailableAsync()) {
    await MailComposer.composeAsync({ recipients: to ? [to] : [], subject: SUBJECT, body });
    return;
  }
  await Linking.openURL(`mailto:${to}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`);
}
