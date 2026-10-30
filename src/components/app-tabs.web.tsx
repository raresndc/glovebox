import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TABS: { name: string; href: '/' | '/documents' | '/services'; label: string; icon: IconName }[] =
  [
    { name: 'home', href: '/', label: 'Home', icon: { web: 'home' } },
    { name: 'documents', href: '/documents', label: 'Documents', icon: { web: 'description' } },
    { name: 'services', href: '/services', label: 'Services', icon: { web: 'build' } },
  ];

/** Floating bottom tab bar, mirroring the native tabs on phones. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      {/* Triggers must be direct children of TabList so Tabs can register them. */}
      <TabList asChild>
        <CustomTabList>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton icon={tab.icon}>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function CustomTabList({ children }: TabListProps) {
  const theme = useTheme();
  return (
    <View style={styles.tabListContainer} pointerEvents="box-none">
      <View
        style={[
          styles.innerContainer,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {children}
      </View>
    </View>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  onPress,
  onLongPress,
}: TabTriggerSlotProps & { icon: IconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.onTint : theme.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && { backgroundColor: theme.tint },
        pressed && styles.pressed,
      ]}>
      <SymbolView name={icon} tintColor={color} size={18} />
      <ThemedText type="smallBold" style={[styles.tabLabel, { color }]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.three,
    alignItems: 'center',
  },
  innerContainer: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one + Spacing.half,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.18)',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    paddingVertical: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  tabLabel: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});
