import { DOCUMENT_KINDS, type CarDocument, type DocumentKind } from '@/components/documents/types';
import type { Intervention } from '@/components/services/types';
import { daysUntil, parseDate } from '@/lib/dates';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Kinds the dashboard warns about when there's no valid one on file. */
const ESSENTIAL_KINDS: DocumentKind[] = ['insurance', 'vignette'];

export type Expiry = {
  document: CarDocument;
  title: string;
  days: number;
  /** Length of the validity period, when the start date is known. */
  totalDays?: number;
};

/** Documents with an expiry date, most urgent (or already expired) first. */
export function getExpiries(documents: CarDocument[]): Expiry[] {
  return documents
    .flatMap((document) => {
      const days = document.expiryDate ? daysUntil(document.expiryDate) : null;
      if (days === null) return [];
      const start = document.startDate ? parseDate(document.startDate) : null;
      const end = parseDate(document.expiryDate!);
      const totalDays =
        start && end ? Math.round((end.getTime() - start.getTime()) / 86_400_000) : undefined;
      const label = DOCUMENT_KINDS[document.kind].label;
      const title = document.name === label ? label : `${label} · ${document.name}`;
      return [{ document, title, days, totalDays }];
    })
    .sort((a, b) => a.days - b.days);
}

/** Essential documents (insurance, vignette) with no currently valid copy. */
export function getMissingEssentials(documents: CarDocument[]) {
  return ESSENTIAL_KINDS.filter(
    (kind) =>
      !documents.some((d) => {
        if (d.kind !== kind || !d.expiryDate) return false;
        const days = daysUntil(d.expiryDate);
        return days !== null && days >= 0;
      }),
  ).map((kind) => ({
    kind,
    label: DOCUMENT_KINDS[kind].label,
    hasExpired: documents.some((d) => d.kind === kind),
  }));
}

/** Spending per calendar month for the last `count` months, oldest first. */
export function getMonthlySpending(interventions: Intervention[], count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const value = interventions
      .filter((x) => x.date.startsWith(key))
      .reduce((sum, x) => sum + x.cost, 0);
    return {
      key,
      short: MONTHS[date.getMonth()].charAt(0),
      long: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
      value,
    };
  });
}

export function getSpendingSummary(interventions: Intervention[]) {
  const year = String(new Date().getFullYear());
  const sum = (list: Intervention[]) => list.reduce((total, i) => total + i.cost, 0);
  return {
    total: sum(interventions),
    thisYear: sum(interventions.filter((i) => i.date.startsWith(year))),
    services: sum(interventions.filter((i) => i.kind === 'service')),
    repairs: sum(interventions.filter((i) => i.kind === 'repair')),
  };
}

export function getLastService(interventions: Intervention[]) {
  const last = interventions
    .filter((i) => i.kind === 'service')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return null;
  const days = daysUntil(last.date);
  return { intervention: last, daysAgo: days === null ? null : -days };
}

/** Highest mileage recorded on any intervention. */
export function getLatestMileage(interventions: Intervention[]) {
  const values = interventions.flatMap((i) => (i.mileage === undefined ? [] : [i.mileage]));
  return values.length ? Math.max(...values) : null;
}
