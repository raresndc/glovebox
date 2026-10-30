import { SymbolView } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { IconBadge, Icons, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { STATUS_COLORS } from '@/lib/status';

/** The card surface used across the app: raised with a soft shadow in light mode, outlined in dark. */
export function Surface({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  return (
    <View
      style={[
        styles.surface,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        !dark && styles.shadow,
        style,
      ]}>
      {children}
    </View>
  );
}

/** Friendly placeholder for an empty list, with an optional call to action below the text. */
export function EmptyState({
  icon,
  title,
  text,
  children,
}: {
  icon: IconName;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Surface style={styles.empty}>
      <IconBadge name={icon} color={theme.tint} size={56} />
      <View style={styles.emptyText}>
        <ThemedText type="default" style={styles.emptyTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {text}
        </ThemedText>
      </View>
      {children}
    </Surface>
  );
}

type BannerTone = 'success' | 'info';

const BANNER_ICONS: Record<BannerTone, IconName> = { success: Icons.check, info: Icons.info };

/** Short confirmation shown after saving; dismisses itself after a few seconds. */
export function Banner({
  tone,
  text,
  onDismiss,
}: {
  tone: BannerTone;
  text: string;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const color = tone === 'success' ? STATUS_COLORS.good : theme.tint;

  useEffect(() => {
    const timer = setTimeout(onDismiss, tone === 'success' ? 3500 : 8000);
    return () => clearTimeout(timer);
  }, [onDismiss, tone, text]);

  return (
    <Animated.View entering={FadeInUp.springify().damping(18)} exiting={FadeOutUp.duration(200)}>
      <PressableScale
        onPress={onDismiss}
        accessibilityRole="alert"
        accessibilityHint="Dismiss"
        style={[styles.banner, { backgroundColor: theme.backgroundElement, borderColor: color }]}>
        <SymbolView name={BANNER_ICONS[tone]} tintColor={color} size={20} />
        <ThemedText type="small" style={styles.flex}>
          {text}
        </ThemedText>
        <SymbolView name={Icons.close} tintColor={theme.textSecondary} size={14} />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  shadow: {
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderCurve: 'continuous',
  },
  flex: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  emptyText: {
    alignItems: 'center',
    gap: Spacing.one,
    maxWidth: 320,
  },
  emptyTitle: {
    fontWeight: 700,
  },
  center: {
    textAlign: 'center',
  },
});
