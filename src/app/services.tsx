import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CarSwitcher } from '@/components/garage/car-switcher';
import { InterventionCard } from '@/components/services/intervention-card';
import { InterventionForm } from '@/components/services/intervention-form';
import { INTERVENTION_KINDS, formatCost } from '@/components/services/types';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton, SecondaryButton } from '@/components/ui/form';
import { Icons } from '@/components/ui/icon';
import { Appear } from '@/components/ui/motion';
import { Screen } from '@/components/ui/screen';
import { Banner, EmptyState } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { garageActions, useGarage } from '@/lib/garage';

export default function ServicesScreen() {
  const garage = useGarage();
  const car = garage.activeCar;
  const interventions = garage.interventions.filter((i) => i.carId === car?.id);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const sorted = [...interventions].sort((a, b) => b.date.localeCompare(a.date));
  const totalSpent = interventions.reduce((sum, i) => sum + i.cost, 0);

  return (
    <Screen
      eyebrow={car?.plate}
      title="Services"
      subtitle="Log routine services and repairs, with what they cost.">
      <CarSwitcher />

      {notice && <Banner tone="success" text={notice} onDismiss={dismissNotice} />}

      {car && (
        <>
          {adding ? (
            <Appear>
              <View style={styles.formHeader}>
                <ThemedText type="smallBold" style={styles.flex}>
                  New intervention for {car.plate}
                </ThemedText>
                <SecondaryButton label="Cancel" icon={Icons.close} onPress={() => setAdding(false)} />
              </View>
              <InterventionForm
                key={car.id}
                car={car}
                onAdd={(intervention) => {
                  garageActions.addIntervention(intervention);
                  setAdding(false);
                  setNotice(
                    `${INTERVENTION_KINDS[intervention.kind].label} saved · ${formatCost(intervention.cost)}`,
                  );
                }}
              />
            </Appear>
          ) : (
            <PrimaryButton
              label="Log service or repair"
              icon={Icons.plus}
              onPress={() => setAdding(true)}
            />
          )}

          {interventions.length > 0 && (
            <View style={styles.historyHeader}>
              <ThemedText type="smallBold">History ({interventions.length})</ThemedText>
              <ThemedText type="smallBold">Total spent: {formatCost(totalSpent)}</ThemedText>
            </View>
          )}

          {sorted.length === 0
            ? !adding && (
                <EmptyState
                  icon={INTERVENTION_KINDS.repair.icon}
                  title="No interventions yet"
                  text={`Log oil changes, filters and repairs for ${car.plate} to track what the car costs.`}
                />
              )
            : sorted.map((intervention, index) => (
                <Appear key={intervention.id} index={index}>
                  <InterventionCard
                    intervention={intervention}
                    onDelete={() => garageActions.removeIntervention(intervention)}
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
});
