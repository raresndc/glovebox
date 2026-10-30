/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F3F5FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8ECF5',
    textSecondary: '#5B6475',
    border: '#E2E7F0',
    tint: '#4157E8',
    /** Text and icons drawn on top of `tint`. */
    onTint: '#FFFFFF',
    danger: '#D93A3F',
  },
  dark: {
    text: '#F1F5F9',
    background: '#0A0F1E',
    backgroundElement: '#161C2F',
    backgroundSelected: '#232B44',
    textSecondary: '#9AA4B8',
    border: '#262F4A',
    tint: '#8197FF',
    onTint: '#0A0F1E',
    danger: '#FF6B6F',
  },
} as const;

/** Brand gradients, from the navy of the app icon towards indigo. Same in both modes. */
export const Gradients = {
  hero: ['#1B2A4E', '#2C3F8F', '#5A4FCF'],
  primary: ['#4157E8', '#6A4FD8'],
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 720;
