import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AttachmentList } from '@/components/ui/attachments';
import { IconButton } from '@/components/ui/form';
import { Spacing } from '@/constants/theme';

import { formatCost, type Intervention } from './types';

type Props = {
  intervention: Intervention;
  onDelete: () => void;
};

export function InterventionCard({ intervention, onDelete }: Props) {
  const { kind, title, items, date, mileage, cost, notes, bills } = intervention;
  const meta = [date, mileage !== undefined && `${mileage.toLocaleString()} km`]
    .filter(Boolean)
    .join(' · ');
  // For a service the title is often just the joined items; don't repeat them.
  const showItems = items.length > 0 && items.join(', ') !== title;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="code" themeColor="textSecondary" style={styles.kind}>
            {kind === 'service' ? 'Service' : 'Repair'}
          </ThemedText>
          <ThemedText type="default">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        </View>
        <ThemedText type="smallBold">{formatCost(cost)}</ThemedText>
        <IconButton
          name={{ ios: 'trash', android: 'delete', web: 'delete' }}
          label={`Delete ${title}`}
          onPress={onDelete}
        />
      </View>

      {showItems && (
        <ThemedText type="small">
          {kind === 'repair' ? 'Parts: ' : ''}
          {items.join(', ')}
        </ThemedText>
      )}
      {notes && (
        <ThemedText type="small" themeColor="textSecondary">
          {notes}
        </ThemedText>
      )}
      <AttachmentList attachments={bills} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  kind: {
    textTransform: 'uppercase',
  },
});
