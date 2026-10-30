import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { StatusLabel } from '@/components/dashboard/charts';
import { ThemedText } from '@/components/themed-text';
import { AttachmentList } from '@/components/ui/attachments';
import { DeleteButton } from '@/components/ui/form';
import { IconBadge, Icons } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysUntil } from '@/lib/dates';

import { DOCUMENT_KINDS, type CarDocument } from './types';

type Props = {
  document: CarDocument;
  onDelete: () => void;
};

export function DocumentCard({ document, onDelete }: Props) {
  const theme = useTheme();
  const { kind, name, number, issuer, startDate, expiryDate, notes, files, reminderIds } = document;
  const kindInfo = DOCUMENT_KINDS[kind];
  const days = expiryDate ? daysUntil(expiryDate) : null;
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
    <Surface style={styles.card}>
      <View style={styles.header}>
        <IconBadge name={kindInfo.icon} color={kindInfo.accent} size={44} />
        <View style={styles.headerText}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.kind}>
            {kindInfo.label}
          </ThemedText>
          <ThemedText type="default" style={styles.name}>
            {name}
          </ThemedText>
          {details ? (
            <ThemedText type="small" themeColor="textSecondary">
              {details}
            </ThemedText>
          ) : null}
        </View>
        <DeleteButton label={`Delete ${name}`} onConfirm={onDelete} />
      </View>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <View style={styles.meta}>
          <SymbolView name={Icons.calendar} tintColor={theme.textSecondary} size={14} />
          <ThemedText type="small">{validity}</ThemedText>
        </View>
        <View style={styles.meta}>
          {reminderIds.length > 0 && (
            <View accessibilityLabel="Reminders on">
              <SymbolView name={Icons.bell} tintColor={theme.tint} size={14} />
            </View>
          )}
          {days !== null && <StatusLabel days={days} />}
        </View>
      </View>

      {notes && (
        <ThemedText type="small" themeColor="textSecondary">
          {notes}
        </ThemedText>
      )}
      <AttachmentList attachments={files} />
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
  name: {
    fontWeight: 700,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
