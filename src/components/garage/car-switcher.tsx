import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip, ErrorText, Field, PrimaryButton, formStyles } from '@/components/ui/form';
import { Spacing } from '@/constants/theme';
import { garageActions, useGarage } from '@/lib/garage';

export function AddCarForm({ onDone }: { onDone?: () => void }) {
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
    <ThemedView type="backgroundElement" style={formStyles.card}>
      <ThemedText type="smallBold">Add a car</ThemedText>
      <Field
        label="Number plate"
        value={plate}
        onChangeText={setPlate}
        placeholder="e.g. B 123 ABC"
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
      <PrimaryButton label="Add car" onPress={submit} />
    </ThemedView>
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
            selected={car.id === activeCar?.id}
            onPress={() => garageActions.selectCar(car.id)}
          />
        ))}
        <Chip
          label={adding ? 'Cancel' : '+ Add car'}
          selected={false}
          onPress={() => setAdding((a) => !a)}
        />
      </ScrollView>
      {adding && <AddCarForm onDone={() => setAdding(false)} />}
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
});
