import type { ComponentProps } from 'react';
import type { SymbolView } from 'expo-symbols';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

/** Reserved status colors; always shown with an icon and a label, never on their own. */
export const STATUS_COLORS = {
  good: '#0CA30C',
  warning: '#FAB219',
  serious: '#EC835A',
  critical: '#D03B3B',
} as const;

export type StatusLevel = keyof typeof STATUS_COLORS;

const STATUS_ICONS: Record<StatusLevel, SymbolName> = {
  good: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  warning: { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' },
  serious: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  critical: { ios: 'xmark.octagon.fill', android: 'report', web: 'report' },
};

export function getExpiryStatus(days: number) {
  const level: StatusLevel =
    days <= 0 ? 'critical' : days <= 7 ? 'serious' : days <= 30 ? 'warning' : 'good';
  const label =
    days < 0
      ? 'Expired'
      : days === 0
        ? 'Expires today'
        : days <= 30
          ? `${days} ${days === 1 ? 'day' : 'days'} left`
          : 'Valid';
  return { level, label, color: STATUS_COLORS[level], icon: STATUS_ICONS[level] };
}

export function statusIcon(level: StatusLevel) {
  return STATUS_ICONS[level];
}
