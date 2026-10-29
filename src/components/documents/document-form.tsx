import { useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AttachmentPicker } from '@/components/ui/attachments';
import { Chip, ErrorText, Field, PrimaryButton, formStyles } from '@/components/ui/form';
import { Spacing } from '@/constants/theme';
import { deleteAttachment, type Attachment } from '@/lib/attachments';
import { daysUntil, parseDate } from '@/lib/dates';
import { newId, type Car } from '@/lib/garage';
import { REMINDER_DAYS_BEFORE, scheduleExpiryReminders } from '@/lib/reminders';

import { DOCUMENT_KINDS, type CarDocument, type DocumentKind } from './types';

const remindersSupported = Platform.OS !== 'web';

type Props = {
  car: Car;
  onAdd: (document: CarDocument) => void;
};

export function DocumentForm({ car, onAdd }: Props) {
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
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const kindInfo = DOCUMENT_KINDS[kind];

  const selectKind = (next: DocumentKind) => {
    setKind(next);
    setRemind(DOCUMENT_KINDS[next].tracksExpiry);
  };

  const submit = async () => {
    setInfo(null);
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
          setInfo('Saved, but notifications are off. Turn them on in Settings to get reminders.');
        } else if (result.status === 'nothing-upcoming') {
          setInfo('Saved. It expires too soon to schedule any reminders.');
        }
      } catch {
        setInfo("Saved, but reminders couldn't be scheduled.");
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
    });

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

  return (
    <ThemedView type="backgroundElement" style={formStyles.card}>
      <View style={formStyles.chips}>
        {(Object.keys(DOCUMENT_KINDS) as DocumentKind[]).map((k) => (
          <Chip
            key={k}
            label={DOCUMENT_KINDS[k].label}
            selected={kind === k}
            onPress={() => selectKind(k)}
          />
        ))}
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
          placeholder="YYYY-MM-DD"
        />
        <Field
          label={kindInfo.tracksExpiry ? 'Expires on' : 'Expires on (optional)'}
          style={formStyles.flex}
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {remindersSupported && (
        <View style={styles.reminderRow}>
          <View style={formStyles.flex}>
            <ThemedText type="smallBold">Remind me before it expires</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {REMINDER_DAYS_BEFORE.filter((d) => d > 0).join(', ')} days before and on the day
              {expiryDays !== null && expiryDays >= 0 ? ` · expires in ${expiryDays} days` : ''}
            </ThemedText>
          </View>
          <Switch value={remind} onValueChange={setRemind} />
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
      {info && (
        <ThemedText type="small" themeColor="textSecondary">
          {info}
        </ThemedText>
      )}
      <PrimaryButton
        label={saving ? 'Saving…' : 'Add document'}
        onPress={submit}
        disabled={saving}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
