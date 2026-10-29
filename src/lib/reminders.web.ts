// Scheduled local notifications aren't supported on web; reminders only run in the iOS/Android app.
import type { ScheduleResult } from './reminders';

export const REMINDER_DAYS_BEFORE = [30, 7, 1, 0];

export function configureNotifications() {}

export async function scheduleExpiryReminders(_: {
  documentId: string;
  label: string;
  name: string;
  expiryDate: string;
}): Promise<ScheduleResult> {
  return { ids: [], status: 'unsupported' };
}

export async function cancelReminders(_ids: string[]) {}
