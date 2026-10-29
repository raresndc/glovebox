import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { parseDate } from '@/lib/dates';

const CHANNEL_ID = 'expiry-reminders';
/** Days before the expiry date to send a reminder; 0 is the expiry day itself. */
export const REMINDER_DAYS_BEFORE = [30, 7, 1, 0];
const REMINDER_HOUR = 9;

export type ScheduleResult = {
  ids: string[];
  status: 'scheduled' | 'denied' | 'nothing-upcoming' | 'unsupported';
};

/** Call once at startup so reminders also show while the app is open. */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function isAllowed(status: Notifications.NotificationPermissionsStatus) {
  return status.granted || status.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

async function ensurePermission() {
  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Expiry reminders',
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (isAllowed(current)) return true;
  if (!current.canAskAgain) return false;
  return isAllowed(await Notifications.requestPermissionsAsync());
}

export async function scheduleExpiryReminders({
  documentId,
  label,
  name,
  expiryDate,
}: {
  documentId: string;
  label: string;
  name: string;
  expiryDate: string;
}): Promise<ScheduleResult> {
  const expiry = parseDate(expiryDate);
  if (!expiry) return { ids: [], status: 'nothing-upcoming' };

  const now = Date.now();
  const upcoming = REMINDER_DAYS_BEFORE.map((days) => ({
    days,
    at: new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate() - days, REMINDER_HOUR),
  })).filter(({ at }) => at.getTime() > now);

  if (upcoming.length === 0) return { ids: [], status: 'nothing-upcoming' };
  if (!(await ensurePermission())) return { ids: [], status: 'denied' };

  const ids = await Promise.all(
    upcoming.map(({ days, at }) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title:
            days === 0
              ? `${label} expires today`
              : `${label} expires in ${days} ${days === 1 ? 'day' : 'days'}`,
          body: `${name} is valid until ${expiryDate}.`,
          data: { documentId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: at,
          channelId: CHANNEL_ID,
        },
      }),
    ),
  );
  return { ids, status: 'scheduled' };
}

export async function cancelReminders(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
