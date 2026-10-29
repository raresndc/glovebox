import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip, ErrorText, IconButton } from '@/components/ui/form';
import { Spacing } from '@/constants/theme';
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
    <ThemedView type="backgroundSelected" style={styles.row}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Open ${attachment.name}`}
        style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
        <SymbolView
          name={
            isPdf
              ? { ios: 'doc.richtext', android: 'picture_as_pdf', web: 'picture_as_pdf' }
              : { ios: 'photo', android: 'image', web: 'image' }
          }
          tintColor={theme.text}
          size={18}
        />
        <View style={styles.rowText}>
          <ThemedText type="small" numberOfLines={1}>
            {attachment.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {size ? `${size} · ` : ''}Tap to open
          </ThemedText>
        </View>
      </Pressable>
      {onRemove && (
        <IconButton
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          label={`Remove ${attachment.name}`}
          onPress={onRemove}
        />
      )}
    </ThemedView>
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
      <ThemedText type="smallBold">{label}</ThemedText>
      <AttachmentList attachments={attachments} onRemove={onRemove} />
      <View style={styles.attach}>
        <Chip label="+ Attach PDF or photo" selected={false} onPress={pick} />
      </View>
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
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
  attach: {
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.7,
  },
});
