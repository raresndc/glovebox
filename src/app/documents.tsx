import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DocumentCard } from '@/components/documents/document-card';
import { DocumentForm } from '@/components/documents/document-form';
import { DOCUMENT_KINDS, EXPIRING_SOON_DAYS } from '@/components/documents/types';
import { CarSwitcher } from '@/components/garage/car-switcher';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/form';
import { Icons } from '@/components/ui/icon';
import { Appear } from '@/components/ui/motion';
import { Screen } from '@/components/ui/screen';
import { Banner, EmptyState } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { daysUntil } from '@/lib/dates';
import { garageActions, useGarage } from '@/lib/garage';

type Notice = { tone: 'success' | 'info'; text: string };

export default function DocumentsScreen() {
  const garage = useGarage();
  const car = garage.activeCar;
  const documents = garage.documents.filter((d) => d.carId === car?.id);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  // Soonest expiry first; documents without an expiry date go last.
  const sorted = [...documents].sort((a, b) =>
    (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31'),
  );
  const needsAttention = documents.filter((d) => {
    const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
    return days !== null && days <= EXPIRING_SOON_DAYS;
  }).length;

  return (
    <Screen
      eyebrow={car?.plate}
      title="Documents"
      subtitle="Keep your car papers in one place and get reminded before they expire.">
      <CarSwitcher />

      {notice && <Banner tone={notice.tone} text={notice.text} onDismiss={dismissNotice} />}

      {car && (
        <>
          {adding ? (
            <Appear>
              <View style={styles.formHeader}>
                <ThemedText type="smallBold" style={styles.flex}>
                  New document for {car.plate}
                </ThemedText>
                <SecondaryButton label="Cancel" icon={Icons.close} onPress={() => setAdding(false)} />
              </View>
              <DocumentForm
                key={car.id}
                car={car}
                onAdd={(document, message) => {
                  garageActions.addDocument(document);
                  setAdding(false);
                  setNotice(
                    message
                      ? { tone: 'info', text: message }
                      : {
                          tone: 'success',
                          text: `${DOCUMENT_KINDS[document.kind].label} saved for ${car.plate}.`,
                        },
                  );
                }}
              />
            </Appear>
          ) : (
            <PrimaryButton label="Add document" icon={Icons.plus} onPress={() => setAdding(true)} />
          )}

          {documents.length > 0 && (
            <View style={styles.listHeader}>
              <ThemedText type="smallBold">Your documents ({documents.length})</ThemedText>
              {needsAttention > 0 && (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {needsAttention} expiring within {EXPIRING_SOON_DAYS} days
                </ThemedText>
              )}
            </View>
          )}

          {sorted.length === 0
            ? !adding && (
                <EmptyState
                  icon={Icons.folder}
                  title="No documents yet"
                  text={`Add the insurance and vignette for ${car.plate} to see when they expire and get reminders.`}
                />
              )
            : sorted.map((document, index) => (
                <Appear key={document.id} index={index}>
                  <DocumentCard
                    document={document}
                    onDelete={() => garageActions.removeDocument(document)}
                  />
                </Appear>
              ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
});
