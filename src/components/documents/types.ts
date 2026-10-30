import type { IconName } from '@/components/ui/icon';
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
  icon: IconName;
  /** Identity color for the kind's icon badge; always shown next to the label. */
  accent: string;
};

export const DOCUMENT_KINDS: Record<DocumentKind, KindInfo> = {
  insurance: {
    label: 'Insurance',
    namePlaceholder: 'e.g. RCA policy',
    tracksExpiry: true,
    icon: { ios: 'shield.lefthalf.filled', android: 'shield', web: 'shield' },
    accent: '#3B82F6',
  },
  vignette: {
    label: 'Vignette',
    namePlaceholder: 'e.g. Rovinieta 12 months',
    tracksExpiry: true,
    icon: { ios: 'road.lanes', android: 'add_road', web: 'add_road' },
    accent: '#0891B2',
  },
  inspection: {
    label: 'Inspection',
    namePlaceholder: 'e.g. ITP',
    tracksExpiry: false,
    icon: { ios: 'checklist', android: 'fact_check', web: 'fact_check' },
    accent: '#8B5CF6',
  },
  registration: {
    label: 'Registration',
    namePlaceholder: 'e.g. Registration certificate',
    tracksExpiry: false,
    icon: { ios: 'doc.text.fill', android: 'description', web: 'description' },
    accent: '#EC4899',
  },
  other: {
    label: 'Other',
    namePlaceholder: 'e.g. Extended warranty',
    tracksExpiry: false,
    icon: { ios: 'folder.fill', android: 'folder', web: 'folder' },
    accent: '#64748B',
  },
};

/** Documents expiring within this many days are highlighted. */
export const EXPIRING_SOON_DAYS = 30;
