import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

export type Attachment = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

export const ATTACHMENT_TYPES = ['application/pdf', 'image/*'];

const attachmentsDir = new Directory(Paths.document, 'attachments');

/**
 * Lets the user pick a PDF or photo and copies it into the app's own storage,
 * so it stays available after the picker's cache copy is cleaned up.
 */
export async function pickAttachment(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ATTACHMENT_TYPES,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  attachmentsDir.create({ idempotent: true, intermediates: true });
  const safeName = asset.name.replace(/[^\w.-]+/g, '_');
  const destination = new File(attachmentsDir, `${Date.now().toString(36)}-${safeName}`);
  await new File(asset.uri).copy(destination);

  return {
    name: asset.name,
    uri: destination.uri,
    mimeType: asset.mimeType,
    size: asset.size,
  };
}

/** Opens Quick Look on iOS, or the user's PDF/image viewer on Android. */
export async function openAttachment(attachment: Attachment) {
  await new File(attachment.uri).preview({
    title: attachment.name,
    mimeType: attachment.mimeType,
  });
}

export function deleteAttachment(attachment: Attachment) {
  try {
    const file = new File(attachment.uri);
    if (file.exists) file.delete();
  } catch {
    // Already gone; nothing to clean up.
  }
}
