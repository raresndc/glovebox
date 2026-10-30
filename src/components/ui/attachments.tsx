import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ErrorText, IconButton, SecondaryButton } from '@/components/ui/form';
import { IconBadge, Icons } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { openAttachment, pickAttachment, type Attachment } from '@/lib/attachments';

function formatSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentRow({
  attachment,
  onRemove,
  onError,
}: {
  attachment: Attachment;
  onRemove?: () => void;
  onError: (message: string) => void;
}) {
  const theme = useTheme();
  const isPdf = attachment.mimeType === 'application/pdf' || /\.pdf$/i.test(attachment.name);
  const size = formatSize(attachment.size);

  const open = () =>
    openAttachment(attachment).catch(() =>
      onError(`Couldn't open ${attachment.name}. Is there an app installed that can view it?`),
    );

  return (
    <View style={[styles.row, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <PressableScale
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Open ${attachment.name}`}
        pressedScale={0.98}
        style={styles.rowMain}>
        <IconBadge name={isPdf ? Icons.pdf : Icons.photo} color={theme.tint} size={34} />
        <View style={styles.rowText}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {attachment.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {size ? `${size} · ` : ''}Tap to open
          </ThemedText>
        </View>
        {!onRemove && <SymbolView name={Icons.chevron} tintColor={theme.textSecondary} size={14} />}
      </PressableScale>
      {onRemove && <IconButton name={Icons.close} label={`Remove ${attachment.name}`} onPress={onRemove} />}
    </View>
  );
}

/** Read-only list: tap a file to open it. Pass onRemove to allow removing files. */
export function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: Attachment[];
  onRemove?: (attachment: Attachment) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  if (attachments.length === 0) return null;

  return (
    <View style={styles.list}>
      {attachments.map((attachment) => (
        <AttachmentRow
          key={attachment.uri}
          attachment={attachment}
          onError={setError}
          onRemove={onRemove && (() => onRemove(attachment))}
        />
      ))}
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

/** Editable list with an "Attach" button, for use inside forms. */
export function AttachmentPicker({
  label,
  attachments,
  onAdd,
  onRemove,
}: {
  label: string;
  attachments: Attachment[];
  onAdd: (attachment: Attachment) => void;
  onRemove: (attachment: Attachment) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    setError(null);
    try {
      const attachment = await pickAttachment();
      if (attachment) onAdd(attachment);
    } catch {
      setError("Couldn't load that file. Try another one.");
    }
  };

  return (
    <View style={styles.list}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <AttachmentList attachments={attachments} onRemove={onRemove} />
      <SecondaryButton label="Attach PDF or photo" icon={Icons.paperclip} onPress={pick} />
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
  },
});
