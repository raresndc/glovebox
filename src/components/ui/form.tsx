import { SymbolView } from 'expo-symbols';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Input({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[
        styles.input,
        { backgroundColor: theme.background, color: theme.text },
        props.multiline && styles.multiline,
        style,
      ]}
      {...props}
    />
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={[styles.field, style]}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Input {...props} />
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type={selected ? 'text' : 'backgroundSelected'} style={styles.chip}>
        <ThemedText type="small" themeColor={selected ? 'background' : 'text'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function IconButton({
  name,
  label,
  onPress,
}: {
  name: ComponentProps<typeof SymbolView>['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.two}
      style={({ pressed }) => pressed && styles.pressed}>
      <SymbolView name={name} tintColor={theme.textSecondary} size={16} />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => (pressed || disabled) && styles.pressed}>
      <ThemedView type="text" style={styles.primary}>
        <ThemedText type="smallBold" themeColor="background">
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function ErrorText({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <ThemedText type="small" style={styles.error}>
      {children}
    </ThemedText>
  );
}

export const formStyles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  field: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-end',
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    minHeight: 44,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: '#E5484D',
  },
  primary: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
});
