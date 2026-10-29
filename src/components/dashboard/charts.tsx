import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { getExpiryStatus } from '@/lib/status';

/** Categorical slots 1–2, stepped per mode (validated against the card surfaces). */
const SERIES = {
  light: ['#2A78D6', '#EB6834'],
  dark: ['#3987E5', '#D95926'],
};

export function useSeriesColors() {
  return SERIES[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {title && <ThemedText type="smallBold">{title}</ThemedText>}
      {children}
    </ThemedView>
  );
}

export function StatTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.tile}>
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
    </ThemedView>
  );
}

export function StatusLabel({ days }: { days: number }) {
  const status = getExpiryStatus(days);
  return (
    <View style={styles.status}>
      <SymbolView name={status.icon} tintColor={status.color} size={14} />
      <ThemedText type="smallBold">{status.label}</ThemedText>
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
}: {
  title: string;
  days: number;
  expiryDate: string;
  totalDays?: number;
}) {
  const theme = useTheme();
  const status = getExpiryStatus(days);
  const span = totalDays && totalDays > 0 ? totalDays : 365;
  const fraction = Math.min(1, Math.max(0, days / span));
  const caption =
    days < 0
      ? `Expired ${-days} ${days === -1 ? 'day' : 'days'} ago · ${expiryDate}`
      : `${days} ${days === 1 ? 'day' : 'days'} left · until ${expiryDate}`;

  return (
    <View
      style={styles.meter}
      accessible
      accessibilityLabel={`${title}: ${status.label}, ${caption}`}>
      <View style={styles.meterHeader}>
        <ThemedText type="small" style={styles.flex} numberOfLines={1}>
          {title}
        </ThemedText>
        <StatusLabel days={days} />
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        {fraction > 0 && (
          <View
            style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: status.color }]}
          />
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {caption}
      </ThemedText>
    </View>
  );
}

export type MonthValue = { key: string; short: string; long: string; value: number };

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
      <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
        {active ? `${active.long}: ${format(active.value)}` : 'Tap a month to see what you spent'}
      </ThemedText>
      <View style={styles.plot}>
        {data.map((d) => {
          const height = max > 0 ? (d.value / max) * 100 : 0;
          const isSelected = d.key === selected;
          return (
            <Pressable
              key={d.key}
              style={styles.column}
              onPress={() => setSelected(isSelected ? null : d.key)}
              accessibilityRole="button"
              accessibilityLabel={`${d.long}: ${format(d.value)}`}>
              <View style={[styles.barArea, { borderColor: theme.backgroundSelected }]}>
                {d.value > 0 && (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(height, 2)}%`,
                        backgroundColor: color,
                        opacity: selected && !isSelected ? 0.45 : 1,
                      },
                    ]}
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
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  if (total === 0) return null;

  return (
    <View style={styles.chart}>
      <View style={styles.split}>
        {parts.map((p, i) =>
          p.value > 0 ? (
            <View
              key={p.label}
              style={[styles.segment, { flex: p.value, backgroundColor: colors[i] }]}
            />
          ) : null,
        )}
      </View>
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
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  tileValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 600,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  flex: {
    flex: 1,
  },
  meter: {
    gap: Spacing.one,
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
  plot: {
    flexDirection: 'row',
    height: 140,
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
