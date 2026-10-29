import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AttachmentList } from '@/components/ui/attachments';
import { IconButton } from '@/components/ui/form';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysUntil } from '@/lib/dates';
import { getExpiryStatus } from '@/lib/status';

import { DOCUMENT_KINDS, type CarDocument } from './types';

function getStatus(expiryDate?: string) {
  const days = expiryDate ? daysUntil(expiryDate) : null;
  return days === null ? null : getExpiryStatus(days);
}

type Props = {
  document: CarDocument;
  onDelete: () => void;
};

export function DocumentCard({ document, onDelete }: Props) {
  const theme = useTheme();
  const { kind, name, number, issuer, startDate, expiryDate, notes, files, reminderIds } = document;
  const status = getStatus(expiryDate);
  const details = [number, issuer].filter(Boolean).join(' · ');
  const validity =
    startDate && expiryDate
      ? `${startDate} → ${expiryDate}`
      : expiryDate
        ? `Valid until ${expiryDate}`
        : startDate
          ? `Valid from ${startDate}`
          : 'No expiry date';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="code" themeColor="textSecondary" style={styles.kind}>
            {DOCUMENT_KINDS[kind].label}
          </ThemedText>
          <ThemedText type="default">{name}</ThemedText>
          {details ? (
            <ThemedText type="small" themeColor="textSecondary">
              {details}
            </ThemedText>
          ) : null}
        </View>
        {status && (
          <View style={[styles.badge, { borderColor: status.color }]}>
            <SymbolView name={status.icon} tintColor={status.color} size={12} />
            <ThemedText type="smallBold">{status.label}</ThemedText>
          </View>
        )}
        <IconButton
          name={{ ios: 'trash', android: 'delete', web: 'delete' }}
          label={`Delete ${name}`}
          onPress={onDelete}
        />
      </View>

      <View style={styles.footer}>
        <ThemedText type="small">{validity}</ThemedText>
        {reminderIds.length > 0 && (
          <View style={styles.reminders} accessibilityLabel="Reminders on">
            <SymbolView
              name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
              tintColor={theme.textSecondary}
              size={12}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Reminders on
            </ThemedText>
          </View>
        )}
      </View>

      {notes && (
        <ThemedText type="small" themeColor="textSecondary">
          {notes}
        </ThemedText>
      )}
      <AttachmentList attachments={files} />
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  reminders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
