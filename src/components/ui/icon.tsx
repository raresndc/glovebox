import { SymbolView } from 'expo-symbols';
import { type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

export type IconName = ComponentProps<typeof SymbolView>['name'];

/** Icons shared across screens, as SF Symbol (iOS) and Material Symbol (Android, web) names. */
export const Icons = {
  car: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  gauge: { ios: 'gauge.with.dots.needle.67percent', android: 'speed', web: 'speed' },
  wallet: { ios: 'creditcard.fill', android: 'payments', web: 'payments' },
  folder: { ios: 'folder.fill', android: 'folder', web: 'folder' },
  chart: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  timer: { ios: 'hourglass', android: 'hourglass_bottom', web: 'hourglass_bottom' },
  pdf: { ios: 'doc.richtext', android: 'picture_as_pdf', web: 'picture_as_pdf' },
  photo: { ios: 'photo', android: 'image', web: 'image' },
  paperclip: { ios: 'paperclip', android: 'attach_file', web: 'attach_file' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  error: { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' },
} satisfies Record<string, IconName>;

/** Rounded square with a soft tint of `color` behind the icon. */
export function IconBadge({
  name,
  color,
  size = 40,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, backgroundColor: `${color}22`, borderRadius: size * 0.32 },
      ]}>
      <SymbolView name={name} tintColor={color} size={size * 0.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
});
