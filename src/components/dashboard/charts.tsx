import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { IconBadge, type IconName } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { getExpiryStatus } from '@/lib/status';

/** Categorical slots 1–2, stepped per mode (validated against the card surfaces). */
const SERIES = {
  light: ['#2A78D6', '#EB6834'],
  dark: ['#3987E5', '#D95926'],
};

const GROW = { duration: 700, easing: Easing.out(Easing.cubic) };

export function useSeriesColors() {
  return SERIES[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

/** 0 → 1 once after mount, to grow chart marks in. */
function useGrowIn(delay = 0) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withDelay(delay, withTiming(1, GROW)));
  }, [progress, delay]);
  return progress;
}

export function Card({
  title,
  icon,
  action,
  children,
}: {
  title?: string;
  icon?: IconName;
  /** Rendered at the end of the title row. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Surface>
      {title && (
        <View style={styles.cardHeader}>
          {icon && <IconBadge name={icon} color={theme.tint} size={28} />}
          <ThemedText type="smallBold" style={styles.flex}>
            {title}
          </ThemedText>
          {action}
        </View>
      )}
      {children}
    </Surface>
  );
}

export function StatTile({
  label,
  value,
  caption,
  icon,
  accent,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: IconName;
  accent: string;
}) {
  return (
    <Surface style={styles.tile}>
      <IconBadge name={icon} color={accent} size={34} />
      <View style={styles.tileText}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </ThemedText>
        {caption && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {caption}
          </ThemedText>
        )}
      </View>
    </Surface>
  );
}

/** Status icon and label in a pill tinted with the status color. */
export function StatusLabel({ days }: { days: number }) {
  const status = getExpiryStatus(days);
  return (
    <View style={[styles.status, { backgroundColor: `${status.color}22` }]}>
      <SymbolView name={status.icon} tintColor={status.color} size={13} />
      <ThemedText type="smallBold" style={styles.statusText}>
        {status.label}
      </ThemedText>
    </View>
  );
}

/**
 * Validity remaining for one document. With a start date the track is the whole validity
 * period; without one it's a year.
 */
export function ExpiryMeter({
  title,
  days,
  expiryDate,
  totalDays,
  icon,
  accent,
  index = 0,
}: {
  title: string;
  days: number;
  expiryDate: string;
  totalDays?: number;
  icon: IconName;
  accent: string;
  index?: number;
}) {
  const theme = useTheme();
  const status = getExpiryStatus(days);
  const span = totalDays && totalDays > 0 ? totalDays : 365;
  const fraction = Math.min(1, Math.max(0, days / span));
  const caption =
    days < 0
      ? `Expired ${-days} ${days === -1 ? 'day' : 'days'} ago · ${expiryDate}`
      : `${days} ${days === 1 ? 'day' : 'days'} left · until ${expiryDate}`;
  const progress = useGrowIn(150 + index * 90);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * fraction * 100}%` }));

  return (
    <View
      style={styles.meter}
      accessible
      accessibilityLabel={`${title}: ${status.label}, ${caption}`}>
      <IconBadge name={icon} color={accent} size={36} />
      <View style={styles.meterBody}>
        <View style={styles.meterHeader}>
          <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
            {title}
          </ThemedText>
          <StatusLabel days={days} />
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          {fraction > 0 && (
            <Animated.View style={[styles.fill, { backgroundColor: status.color }, fillStyle]} />
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {caption}
        </ThemedText>
      </View>
    </View>
  );
}

export type MonthValue = { key: string; short: string; long: string; value: number };

function Bar({
  height,
  color,
  dimmed,
  index,
}: {
  height: number;
  color: string;
  dimmed: boolean;
  index: number;
}) {
  const progress = useGrowIn(index * 40);
  const barStyle = useAnimatedStyle(() => ({ height: `${progress.get() * height}%` }));
  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: color, opacity: dimmed ? 0.35 : 1 }, barStyle]}
    />
  );
}

/** Single-series column chart; tap a column to read its value. */
export function MonthlyBars({
  data,
  format,
}: {
  data: MonthValue[];
  format: (value: number) => string;
}) {
  const theme = useTheme();
  const [color] = useSeriesColors();
  const [selected, setSelected] = useState<string | null>(null);
  const max = Math.max(...data.map((d) => d.value), 0);
  const active = data.find((d) => d.key === selected);

  return (
    <View style={styles.chart}>
      <View style={[styles.readout, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type={active ? 'smallBold' : 'small'} themeColor={active ? 'text' : 'textSecondary'}>
          {active ? `${active.long}: ${format(active.value)}` : 'Tap a month to see what you spent'}
        </ThemedText>
      </View>
      <View style={styles.plot}>
        {data.map((d, index) => {
          const height = max > 0 ? (d.value / max) * 100 : 0;
          const isSelected = d.key === selected;
          return (
            <Pressable
              key={d.key}
              style={styles.column}
              onPress={() => setSelected(isSelected ? null : d.key)}
              accessibilityRole="button"
              accessibilityLabel={`${d.long}: ${format(d.value)}`}>
              <View
                style={[
                  styles.barArea,
                  { borderColor: theme.border },
                  isSelected && { backgroundColor: theme.backgroundSelected },
                ]}>
                {d.value > 0 && (
                  <Bar
                    height={Math.max(height, 2)}
                    color={color}
                    dimmed={selected !== null && !isSelected}
                    index={index}
                  />
                )}
              </View>
              <ThemedText
                type="small"
                themeColor={isSelected ? 'text' : 'textSecondary'}
                style={styles.axisLabel}>
                {d.short}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {max > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Highest month: {format(max)}
        </ThemedText>
      )}
    </View>
  );
}

/** Two-part share bar with a labelled legend (labels carry identity, not just color). */
export function SplitBar({
  parts,
  format,
}: {
  parts: { label: string; value: number }[];
  format: (value: number) => string;
}) {
  const colors = useSeriesColors();
  const progress = useGrowIn(300);
  const growStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  if (total === 0) return null;

  return (
    <View style={styles.chart}>
      <Animated.View style={[styles.split, growStyle]}>
        {parts.map((p, i) =>
          p.value > 0 ? (
            <View
              key={p.label}
              style={[styles.segment, { flex: p.value, backgroundColor: colors[i] }]}
            />
          ) : null,
        )}
      </Animated.View>
      <View style={styles.legend}>
        {parts.map((p, i) => (
          <View key={p.label} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: colors[i] }]} />
            <ThemedText type="small">
              {p.label} {format(p.value)}{' '}
              <ThemedText type="small" themeColor="textSecondary">
                ({Math.round((p.value / total) * 100)}%)
              </ThemedText>
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 150,
    gap: Spacing.two,
  },
  tileText: {
    gap: Spacing.half,
  },
  tileValue: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: 800,
    letterSpacing: -0.4,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 18,
  },
  flex: {
    flex: 1,
  },
  meter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  meterBody: {
    flex: 1,
    gap: Spacing.one + Spacing.half,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  chart: {
    gap: Spacing.two,
  },
  readout: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  plot: {
    flexDirection: 'row',
    height: 150,
    gap: 2,
  },
  column: {
    flex: 1,
    alignItems: 'stretch',
  },
  barArea: {
    flex: 1,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  axisLabel: {
    textAlign: 'center',
    fontSize: 11,
  },
  split: {
    flexDirection: 'row',
    height: 12,
    gap: 2,
  },
  segment: {
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
