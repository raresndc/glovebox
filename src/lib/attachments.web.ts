// On web there's no app storage to copy into, so attachments are kept as in-memory blob URLs.
import * as DocumentPicker from 'expo-document-picker';

import type { Attachment } from './attachments';

export const ATTACHMENT_TYPES = ['application/pdf', 'image/*'];

export async function pickAttachment(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ATTACHMENT_TYPES, base64: false });
  if (result.canceled) return null;

  const asset = result.assets[0];
  return {
    name: asset.name,
    uri: asset.file ? URL.createObjectURL(asset.file) : asset.uri,
    mimeType: asset.mimeType,
    size: asset.size,
  };
}

export async function openAttachment(attachment: Attachment) {
  window.open(attachment.uri, '_blank', 'noopener');
}

export function deleteAttachment(attachment: Attachment) {
  if (attachment.uri.startsWith('blob:')) URL.revokeObjectURL(attachment.uri);
}
