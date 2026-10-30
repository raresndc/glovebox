import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Chip, ErrorText, Field, PrimaryButton, formStyles } from '@/components/ui/form';
import { IconBadge, Icons } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { garageActions, useGarage } from '@/lib/garage';

export function AddCarForm({ onDone }: { onDone?: () => void }) {
  const theme = useTheme();
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!plate.trim()) {
      setError('Enter the number plate.');
      return;
    }
    const yearValue = year.trim() ? Number(year.trim()) : undefined;
    if (yearValue !== undefined && !(Number.isInteger(yearValue) && yearValue > 1900)) {
      setError('Enter the year as four digits, e.g. 2019.');
      return;
    }
    const problem = garageActions.addCar({
      plate,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year: yearValue,
    });
    if (problem) {
      setError(problem);
      return;
    }
    setPlate('');
    setMake('');
    setModel('');
    setYear('');
    setError(null);
    onDone?.();
  };

  return (
    <Surface>
      <View style={styles.formHeader}>
        <IconBadge name={Icons.car} color={theme.tint} />
        <View style={formStyles.flex}>
          <ThemedText type="smallBold">Add a car</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Each car is kept separately by its number plate.
          </ThemedText>
        </View>
      </View>
      <Field
        label="Number plate"
        value={plate}
        onChangeText={setPlate}
        placeholder="e.g. CJ 12 ABC"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <View style={formStyles.row}>
        <Field
          label="Make"
          style={formStyles.flex}
          value={make}
          onChangeText={setMake}
          placeholder="e.g. Dacia"
        />
        <Field
          label="Model"
          style={formStyles.flex}
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Logan"
        />
      </View>
      <Field
        label="Year"
        value={year}
        onChangeText={setYear}
        placeholder="Optional"
        keyboardType="number-pad"
        maxLength={4}
      />
      <ErrorText>{error}</ErrorText>
      <PrimaryButton label="Add car" icon={Icons.plus} onPress={submit} />
    </Surface>
  );
}

/** Plate chips to switch the active car, plus an inline form to add another. */
export function CarSwitcher() {
  const { cars, activeCar } = useGarage();
  const [adding, setAdding] = useState(false);

  if (cars.length === 0) return <AddCarForm />;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {cars.map((car) => (
          <Chip
            key={car.id}
            label={car.plate}
            icon={Icons.car}
            selected={car.id === activeCar?.id}
            onPress={() => garageActions.selectCar(car.id)}
          />
        ))}
        <Chip
          label={adding ? 'Cancel' : 'Add car'}
          icon={adding ? Icons.close : Icons.plus}
          selected={false}
          onPress={() => setAdding((a) => !a)}
        />
      </ScrollView>
      {adding && (
        <Animated.View entering={FadeInDown.springify().damping(18)} exiting={FadeOutUp.duration(150)}>
          <AddCarForm onDone={() => setAdding(false)} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  chips: {
    gap: Spacing.two,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
