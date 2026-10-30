import { SymbolView } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Icons, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/motion';
import { Gradients, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Input({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        styles.input,
        {
          backgroundColor: theme.background,
          color: theme.text,
          borderColor: focused ? theme.tint : theme.border,
        },
        props.multiline && styles.multiline,
        style,
      ]}
      {...props}
    />
  );
}

export function Field({
  label,
  style,
  children,
  ...props
}: TextInputProps & { label: string; children?: ReactNode }) {
  return (
    <View style={[styles.field, style]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Input {...props} />
      {children}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  accent,
  small,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  /** Selected background; defaults to the theme tint. */
  accent?: string;
  small?: boolean;
}) {
  const theme = useTheme();
  const background = selected ? (accent ?? theme.tint) : theme.backgroundSelected;
  const foreground = selected ? (accent ? '#FFFFFF' : theme.onTint) : theme.text;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, small && styles.chipSmall, { backgroundColor: background }]}>
      {icon && <SymbolView name={icon} tintColor={foreground} size={small ? 12 : 14} />}
      <ThemedText type={selected ? 'smallBold' : 'small'} style={{ color: foreground }}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

export function IconButton({
  name,
  label,
  onPress,
  color,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.two}
      pressedScale={0.85}
      style={[styles.iconButton, { backgroundColor: theme.backgroundSelected }]}>
      <SymbolView name={name} tintColor={color ?? theme.textSecondary} size={14} />
    </PressableScale>
  );
}

/** Trash button that asks "Delete?" before calling `onConfirm`. */
export function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const theme = useTheme();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return <IconButton name={Icons.trash} label={label} onPress={() => setConfirming(true)} />;
  }
  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.confirm}>
      <IconButton name={Icons.close} label="Cancel" onPress={() => setConfirming(false)} />
      <PressableScale
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.deletePill, { backgroundColor: theme.danger }]}>
        <ThemedText type="smallBold" style={styles.onColor}>
          Delete
        </ThemedText>
      </PressableScale>
    </Animated.View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} accessibilityRole="button">
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primary}>
        {icon && <SymbolView name={icon} tintColor="#FFFFFF" size={16} />}
        <ThemedText type="smallBold" style={styles.onColor}>
          {label}
        </ThemedText>
      </LinearGradient>
    </PressableScale>
  );
}

/** Quieter button for secondary actions, e.g. "Cancel" or "+ Attach". */
export function SecondaryButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.secondary, { borderColor: theme.border, backgroundColor: theme.background }]}>
      {icon && <SymbolView name={icon} tintColor={theme.tint} size={16} />}
      <ThemedText type="smallBold" themeColor="tint">
        {label}
      </ThemedText>
    </PressableScale>
  );
}

export function ErrorText({ children }: { children: string | null }) {
  const theme = useTheme();
  if (!children) return null;
  return (
    <Animated.View
      entering={FadeIn}
      style={[styles.message, { backgroundColor: `${theme.danger}18` }]}>
      <SymbolView name={Icons.error} tintColor={theme.danger} size={16} />
      <ThemedText type="small" style={[styles.flexText, { color: theme.danger }]}>
        {children}
      </ThemedText>
    </Animated.View>
  );
}

export const formStyles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  field: formStyles.field,
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  chipSmall: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small + 2,
    borderWidth: 1.5,
    minHeight: 46,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  deletePill: {
    height: 32,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    justifyContent: 'center',
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    boxShadow: '0 6px 16px rgba(65, 87, 232, 0.35)',
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  onColor: {
    color: '#FFFFFF',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.two + Spacing.one,
    borderRadius: Radius.small,
  },
  flexText: {
    flex: 1,
  },
});
