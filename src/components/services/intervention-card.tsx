import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AttachmentList } from '@/components/ui/attachments';
import { DeleteButton } from '@/components/ui/form';
import { IconBadge, Icons } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { INTERVENTION_KINDS, formatCost, type Intervention } from './types';

type Props = {
  intervention: Intervention;
  onDelete: () => void;
};

export function InterventionCard({ intervention, onDelete }: Props) {
  const theme = useTheme();
  const { kind, title, items, date, mileage, cost, notes, bills } = intervention;
  const kindInfo = INTERVENTION_KINDS[kind];
  // For a service the title is often just the joined items; don't repeat them.
  const showItems = items.length > 0 && items.join(', ') !== title;

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <IconBadge name={kindInfo.icon} color={kindInfo.accent} size={44} />
        <View style={styles.headerText}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.kind}>
            {kindInfo.label}
          </ThemedText>
          <ThemedText type="default" style={styles.title}>
            {title}
          </ThemedText>
        </View>
        <DeleteButton label={`Delete ${title}`} onConfirm={onDelete} />
      </View>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <View style={styles.meta}>
          <SymbolView name={Icons.calendar} tintColor={theme.textSecondary} size={14} />
          <ThemedText type="small">{date}</ThemedText>
        </View>
        {mileage !== undefined && (
          <View style={styles.meta}>
            <SymbolView name={Icons.gauge} tintColor={theme.textSecondary} size={14} />
            <ThemedText type="small">{mileage.toLocaleString()} km</ThemedText>
          </View>
        )}
        <ThemedText type="smallBold" style={styles.cost}>
          {formatCost(cost)}
        </ThemedText>
      </View>

      {showItems && (
        <View style={styles.items}>
          {items.map((item, index) => (
            <View
              key={`${item}-${index}`}
              style={[styles.item, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">{item}</ThemedText>
            </View>
          ))}
        </View>
      )}
      {notes && (
        <ThemedText type="small" themeColor="textSecondary">
          {notes}
        </ThemedText>
      )}
      <AttachmentList attachments={bills} />
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
  },
  kind: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    lineHeight: 16,
  },
  title: {
    fontWeight: 700,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  cost: {
    marginLeft: 'auto',
    fontSize: 16,
  },
  items: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + Spacing.half,
  },
  item: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
});
