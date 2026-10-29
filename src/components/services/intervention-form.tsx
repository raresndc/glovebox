import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AttachmentPicker } from '@/components/ui/attachments';
import {
  Chip,
  ErrorText,
  Field,
  IconButton,
  Input,
  PrimaryButton,
  formStyles,
} from '@/components/ui/form';
import { Spacing } from '@/constants/theme';
import { deleteAttachment, type Attachment } from '@/lib/attachments';
import { parseDate, today } from '@/lib/dates';
import { newId, type Car } from '@/lib/garage';

import { SERVICE_ITEMS, parseAmount, type Intervention, type InterventionKind } from './types';

type Props = {
  car: Car;
  onAdd: (intervention: Intervention) => void;
};

export function InterventionForm({ car, onAdd }: Props) {
  const [kind, setKind] = useState<InterventionKind>('service');
  const [title, setTitle] = useState('');
  const [serviceItems, setServiceItems] = useState<string[]>([]);
  const [parts, setParts] = useState<string[]>([]);
  const [partDraft, setPartDraft] = useState('');
  const [date, setDate] = useState(today);
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [bills, setBills] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleServiceItem = (item: string) =>
    setServiceItems((current) =>
      current.includes(item) ? current.filter((i) => i !== item) : [...current, item],
    );

  const addPart = () => {
    const part = partDraft.trim();
    if (!part) return;
    setParts((current) => [...current, part]);
    setPartDraft('');
  };

  const submit = () => {
    const items = kind === 'service' ? serviceItems : parts;
    const finalTitle = title.trim() || (kind === 'service' ? serviceItems.join(', ') : '');
    const totalCost = parseAmount(cost);
    const mileageValue = parseAmount(mileage);

    if (!finalTitle) {
      setError(
        kind === 'service'
          ? 'Pick at least one service item or enter a title.'
          : 'Enter a title for the repair.',
      );
      return;
    }
    if (!parseDate(date)) {
      setError('Enter the date as YYYY-MM-DD.');
      return;
    }
    if (mileage.trim() && mileageValue === null) {
      setError('Mileage must be a number.');
      return;
    }
    if (totalCost === null) {
      setError('Enter the total cost.');
      return;
    }

    onAdd({
      id: newId(),
      carId: car.id,
      kind,
      title: finalTitle,
      items,
      date: date.trim(),
      mileage: mileageValue ?? undefined,
      cost: totalCost,
      notes: notes.trim() || undefined,
      bills,
    });

    setTitle('');
    setServiceItems([]);
    setParts([]);
    setPartDraft('');
    setMileage('');
    setCost('');
    setNotes('');
    setBills([]);
    setError(null);
  };

  return (
    <ThemedView type="backgroundElement" style={formStyles.card}>
      <View style={styles.segmented}>
        <Chip label="Service" selected={kind === 'service'} onPress={() => setKind('service')} />
        <Chip label="Repair" selected={kind === 'repair'} onPress={() => setKind('repair')} />
      </View>

      <Field
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder={kind === 'service' ? 'e.g. Yearly service (optional)' : 'e.g. Front brakes'}
      />

      {kind === 'service' ? (
        <View style={formStyles.field}>
          <ThemedText type="smallBold">What was done</ThemedText>
          <View style={formStyles.chips}>
            {SERVICE_ITEMS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={serviceItems.includes(item)}
                onPress={() => toggleServiceItem(item)}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={formStyles.field}>
          <ThemedText type="smallBold">Parts replaced</ThemedText>
          {parts.map((part, index) => (
            <ThemedView key={`${part}-${index}`} type="backgroundSelected" style={styles.partRow}>
              <ThemedText type="small" style={formStyles.flex}>
                {part}
              </ThemedText>
              <IconButton
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                label={`Remove ${part}`}
                onPress={() => setParts((current) => current.filter((_, i) => i !== index))}
              />
            </ThemedView>
          ))}
          <View style={formStyles.row}>
            <Input
              style={formStyles.flex}
              value={partDraft}
              onChangeText={setPartDraft}
              placeholder="e.g. Brake pads"
              returnKeyType="done"
              onSubmitEditing={addPart}
              submitBehavior="submit"
            />
            <Chip label="Add" selected={false} onPress={addPart} />
          </View>
        </View>
      )}

      <View style={formStyles.row}>
        <Field
          label="Date"
          style={formStyles.flex}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
        <Field
          label="Mileage (km)"
          style={formStyles.flex}
          value={mileage}
          onChangeText={setMileage}
          placeholder="Optional"
          keyboardType="number-pad"
        />
      </View>

      <Field
        label="Total cost"
        value={cost}
        onChangeText={setCost}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Workshop, warranty, anything worth remembering"
        multiline
      />

      <AttachmentPicker
        label="Bill"
        attachments={bills}
        onAdd={(bill) => setBills((current) => [...current, bill])}
        onRemove={(bill) => {
          deleteAttachment(bill);
          setBills((current) => current.filter((b) => b.uri !== bill.uri));
        }}
      />

      <ErrorText>{error}</ErrorText>
      <PrimaryButton label="Add intervention" onPress={submit} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
});
