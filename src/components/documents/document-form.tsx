import { useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AttachmentPicker } from '@/components/ui/attachments';
import { Chip, ErrorText, Field, PrimaryButton, formStyles } from '@/components/ui/form';
import { Icons } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteAttachment, type Attachment } from '@/lib/attachments';
import { addMonths, daysUntil, parseDate, today } from '@/lib/dates';
import { newId, type Car } from '@/lib/garage';
import { REMINDER_DAYS_BEFORE, scheduleExpiryReminders } from '@/lib/reminders';

import { DOCUMENT_KINDS, type CarDocument, type DocumentKind } from './types';

const remindersSupported = Platform.OS !== 'web';

/** One-tap validity periods, counted from the start date (or today). */
const VALIDITY_SHORTCUTS = [
  { label: '1 month', months: 1 },
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
];

type Props = {
  car: Car;
  /** `notice` explains anything that didn't go as planned, e.g. reminders that couldn't be set. */
  onAdd: (document: CarDocument, notice: string | null) => void;
};

export function DocumentForm({ car, onAdd }: Props) {
  const theme = useTheme();
  const [kind, setKind] = useState<DocumentKind>('insurance');
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [issuer, setIssuer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [remind, setRemind] = useState(DOCUMENT_KINDS.insurance.tracksExpiry);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const kindInfo = DOCUMENT_KINDS[kind];

  const selectKind = (next: DocumentKind) => {
    setKind(next);
    setRemind(DOCUMENT_KINDS[next].tracksExpiry);
  };

  const submit = async () => {
    let notice: string | null = null;
    const finalName = name.trim() || kindInfo.label;
    const expiry = expiryDate.trim();

    if (startDate.trim() && !parseDate(startDate)) {
      setError('Enter the start date as YYYY-MM-DD.');
      return;
    }
    if (kindInfo.tracksExpiry && !expiry) {
      setError(`Enter when the ${kindInfo.label.toLowerCase()} expires.`);
      return;
    }
    if (expiry && !parseDate(expiry)) {
      setError('Enter the expiry date as YYYY-MM-DD.');
      return;
    }
    if (expiry && startDate.trim() && expiry < startDate.trim()) {
      setError('The expiry date is before the start date.');
      return;
    }

    setError(null);
    setSaving(true);
    const id = newId();
    let reminderIds: string[] = [];

    if (remind && expiry && remindersSupported) {
      try {
        const result = await scheduleExpiryReminders({
          documentId: id,
          label: `${kindInfo.label} for ${car.plate}`,
          name: finalName,
          expiryDate: expiry,
        });
        reminderIds = result.ids;
        if (result.status === 'denied') {
          notice = 'Saved, but notifications are off. Turn them on in Settings to get reminders.';
        } else if (result.status === 'nothing-upcoming') {
          notice = 'Saved. It expires too soon to schedule any reminders.';
        }
      } catch {
        notice = "Saved, but reminders couldn't be scheduled.";
      }
    }

    onAdd({
      id,
      carId: car.id,
      kind,
      name: finalName,
      number: number.trim() || undefined,
      issuer: issuer.trim() || undefined,
      startDate: startDate.trim() || undefined,
      expiryDate: expiry || undefined,
      notes: notes.trim() || undefined,
      files,
      reminderIds,
    }, notice);

    setName('');
    setNumber('');
    setIssuer('');
    setStartDate('');
    setExpiryDate('');
    setNotes('');
    setFiles([]);
    setSaving(false);
  };

  const expiryDays = daysUntil(expiryDate);
  const periodStart = parseDate(startDate) ? startDate.trim() : today();

  return (
    <Surface>
      <View style={formStyles.field}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Type
        </ThemedText>
        <View style={formStyles.chips}>
          {(Object.keys(DOCUMENT_KINDS) as DocumentKind[]).map((k) => (
            <Chip
              key={k}
              label={DOCUMENT_KINDS[k].label}
              icon={DOCUMENT_KINDS[k].icon}
              selected={kind === k}
              onPress={() => selectKind(k)}
            />
          ))}
        </View>
      </View>

      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder={kindInfo.namePlaceholder}
      />

      <View style={formStyles.row}>
        <Field
          label="Number"
          style={formStyles.flex}
          value={number}
          onChangeText={setNumber}
          placeholder="Policy / series no."
          autoCapitalize="characters"
        />
        <Field
          label="Issuer"
          style={formStyles.flex}
          value={issuer}
          onChangeText={setIssuer}
          placeholder="Optional"
        />
      </View>

      <View style={formStyles.row}>
        <Field
          label="Valid from"
          style={formStyles.flex}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD">
          <View style={formStyles.chips}>
            <Chip small label="Today" selected={startDate === today()} onPress={() => setStartDate(today())} />
          </View>
        </Field>
        <Field
          label={kindInfo.tracksExpiry ? 'Expires on' : 'Expires on (optional)'}
          style={formStyles.flex}
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={formStyles.chips}>
        <ThemedText type="small" themeColor="textSecondary">
          Valid for
        </ThemedText>
        {VALIDITY_SHORTCUTS.map(({ label, months }) => {
          const value = addMonths(periodStart, months);
          return (
            <Chip
              key={label}
              small
              label={label}
              selected={value !== null && expiryDate === value}
              onPress={() => value && setExpiryDate(value)}
            />
          );
        })}
      </View>

      {remindersSupported && (
        <View style={[styles.reminderRow, { backgroundColor: theme.background }]}>
          <View style={formStyles.flex}>
            <ThemedText type="smallBold">Remind me before it expires</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {REMINDER_DAYS_BEFORE.filter((d) => d > 0).join(', ')} days before and on the day
              {expiryDays !== null && expiryDays >= 0 ? ` · expires in ${expiryDays} days` : ''}
            </ThemedText>
          </View>
          <Switch
            value={remind}
            onValueChange={setRemind}
            trackColor={{ true: theme.tint, false: theme.backgroundSelected }}
          />
        </View>
      )}

      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Coverage, where the paper copy is, anything worth remembering"
        multiline
      />

      <AttachmentPicker
        label="Document copy"
        attachments={files}
        onAdd={(file) => setFiles((current) => [...current, file])}
        onRemove={(file) => {
          deleteAttachment(file);
          setFiles((current) => current.filter((f) => f.uri !== file.uri));
        }}
      />

      <ErrorText>{error}</ErrorText>
      <PrimaryButton
        label={saving ? 'Saving…' : 'Save document'}
        icon={Icons.check}
        onPress={submit}
        disabled={saving}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
});
