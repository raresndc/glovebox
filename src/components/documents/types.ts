import type { Attachment } from '@/lib/attachments';

export type DocumentKind = 'insurance' | 'vignette' | 'inspection' | 'registration' | 'other';

export type CarDocument = {
  id: string;
  carId: string;
  kind: DocumentKind;
  name: string;
  /** Policy, series or registration number. */
  number?: string;
  /** Insurer or issuing authority. */
  issuer?: string;
  /** YYYY-MM-DD */
  startDate?: string;
  /** YYYY-MM-DD */
  expiryDate?: string;
  notes?: string;
  /** Scanned or downloaded copies (PDF or photo). */
  files: Attachment[];
  /** Scheduled notification ids, so they can be cancelled when the document is deleted. */
  reminderIds: string[];
};

type KindInfo = {
  label: string;
  namePlaceholder: string;
  /** Insurance and vignette must have an expiry date and get reminders by default. */
  tracksExpiry: boolean;
};

export const DOCUMENT_KINDS: Record<DocumentKind, KindInfo> = {
  insurance: { label: 'Insurance', namePlaceholder: 'e.g. RCA policy', tracksExpiry: true },
  vignette: { label: 'Vignette', namePlaceholder: 'e.g. Rovinieta 12 months', tracksExpiry: true },
  inspection: { label: 'Inspection', namePlaceholder: 'e.g. ITP', tracksExpiry: false },
  registration: {
    label: 'Registration',
    namePlaceholder: 'e.g. Registration certificate',
    tracksExpiry: false,
  },
  other: { label: 'Other', namePlaceholder: 'e.g. Extended warranty', tracksExpiry: false },
};

/** Documents expiring within this many days are highlighted. */
export const EXPIRING_SOON_DAYS = 30;
