import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarSwitcher } from '@/components/garage/car-switcher';
import { InterventionCard } from '@/components/services/intervention-card';
import { InterventionForm } from '@/components/services/intervention-form';
import { formatCost } from '@/components/services/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { garageActions, useGarage } from '@/lib/garage';

export default function ServicesScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const garage = useGarage();
  const car = garage.activeCar;
  const interventions = garage.interventions.filter((i) => i.carId === car?.id);

  const sorted = [...interventions].sort((a, b) => b.date.localeCompare(a.date));
  const totalSpent = interventions.reduce((sum, i) => sum + i.cost, 0);

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
          <ThemedText type="subtitle">Services</ThemedText>
          <ThemedText themeColor="textSecondary">
            Log routine services and repairs for your car.
          </ThemedText>
        </ThemedView>

        <CarSwitcher />

        {car && (
          <>
            <InterventionForm key={car.id} car={car} onAdd={garageActions.addIntervention} />

            <ThemedView style={styles.historyHeader}>
              <ThemedText type="smallBold">History ({interventions.length})</ThemedText>
              <ThemedText type="smallBold">Total spent: {formatCost(totalSpent)}</ThemedText>
            </ThemedView>

            {sorted.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                No interventions for {car.plate} yet. Add the first one above.
              </ThemedText>
            ) : (
              sorted.map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  onDelete={() => garageActions.removeIntervention(intervention)}
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
  historyHeader: {
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
