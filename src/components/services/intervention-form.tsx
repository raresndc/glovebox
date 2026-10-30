import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
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
import { Icons } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteAttachment, type Attachment } from '@/lib/attachments';
import { parseDate, today } from '@/lib/dates';
import { newId, type Car } from '@/lib/garage';

import {
  INTERVENTION_KINDS,
  SERVICE_ITEMS,
  parseAmount,
  type Intervention,
  type InterventionKind,
} from './types';

type Props = {
  car: Car;
  onAdd: (intervention: Intervention) => void;
};

export function InterventionForm({ car, onAdd }: Props) {
  const theme = useTheme();
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
    <Surface>
      <View style={[styles.segmented, { backgroundColor: theme.background }]}>
        {(Object.keys(INTERVENTION_KINDS) as InterventionKind[]).map((k) => (
          <View key={k} style={formStyles.flex}>
            <Chip
              label={INTERVENTION_KINDS[k].label}
              icon={INTERVENTION_KINDS[k].icon}
              selected={kind === k}
              onPress={() => setKind(k)}
            />
          </View>
        ))}
      </View>

      <Field
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder={kind === 'service' ? 'e.g. Yearly service (optional)' : 'e.g. Front brakes'}
      />

      {kind === 'service' ? (
        <View style={formStyles.field}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            What was done
          </ThemedText>
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
          <ThemedText type="smallBold" themeColor="textSecondary">
            Parts replaced
          </ThemedText>
          {parts.map((part, index) => (
            <View
              key={`${part}-${index}`}
              style={[styles.partRow, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" style={formStyles.flex}>
                {part}
              </ThemedText>
              <IconButton
                name={Icons.close}
                label={`Remove ${part}`}
                onPress={() => setParts((current) => current.filter((_, i) => i !== index))}
              />
            </View>
          ))}
          <View style={styles.partInput}>
            <Input
              style={formStyles.flex}
              value={partDraft}
              onChangeText={setPartDraft}
              placeholder="e.g. Brake pads"
              returnKeyType="done"
              onSubmitEditing={addPart}
              submitBehavior="submit"
            />
            <Chip label="Add" icon={Icons.plus} selected={false} onPress={addPart} />
          </View>
        </View>
      )}

      <View style={formStyles.row}>
        <Field
          label="Date"
          style={formStyles.flex}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD">
          <View style={formStyles.chips}>
            <Chip small label="Today" selected={date === today()} onPress={() => setDate(today())} />
          </View>
        </Field>
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
      <PrimaryButton label="Save intervention" icon={Icons.check} onPress={submit} />
    </Surface>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: Radius.pill,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one + Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.medium,
  },
  partInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
