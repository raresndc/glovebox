import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DocumentCard } from '@/components/documents/document-card';
import { DocumentForm } from '@/components/documents/document-form';
import { CarSwitcher } from '@/components/garage/car-switcher';
import { EXPIRING_SOON_DAYS } from '@/components/documents/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysUntil } from '@/lib/dates';
import { garageActions, useGarage } from '@/lib/garage';

export default function DocumentsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const garage = useGarage();
  const car = garage.activeCar;
  const documents = garage.documents.filter((d) => d.carId === car?.id);

  // Soonest expiry first; documents without an expiry date go last.
  const sorted = [...documents].sort((a, b) =>
    (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31'),
  );
  const needsAttention = documents.filter((d) => {
    const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
    return days !== null && days <= EXPIRING_SOON_DAYS;
  }).length;

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Documents</ThemedText>
          <ThemedText themeColor="textSecondary">
            Keep your car papers in one place and get reminded before they expire.
          </ThemedText>
        </ThemedView>

        <CarSwitcher />

        {car && (
          <>
            <DocumentForm key={car.id} car={car} onAdd={garageActions.addDocument} />

            <ThemedView style={styles.listHeader}>
              <ThemedText type="smallBold">Your documents ({documents.length})</ThemedText>
              {needsAttention > 0 && (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {needsAttention} expiring within {EXPIRING_SOON_DAYS} days
                </ThemedText>
              )}
            </ThemedView>

            {sorted.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                No documents for {car.plate} yet. Add the insurance or vignette above.
              </ThemedText>
            ) : (
              sorted.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onDelete={() => garageActions.removeDocument(document)}
                />
              ))
            )}
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    width: '100%',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  titleContainer: {
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
