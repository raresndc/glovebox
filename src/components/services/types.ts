import type { Attachment } from '@/lib/attachments';

export type InterventionKind = 'service' | 'repair';

export type Intervention = {
  id: string;
  carId: string;
  kind: InterventionKind;
  title: string;
  /** Service items done, or parts replaced for a repair. */
  items: string[];
  /** YYYY-MM-DD */
  date: string;
  mileage?: number;
  cost: number;
  notes?: string;
  /** Bills or invoices (PDF or photo). */
  bills: Attachment[];
};

export const SERVICE_ITEMS = [
  'Oil change',
  'Oil filter',
  'Air filter',
  'Cabin filter',
  'Fuel filter',
  'Spark plugs',
];

/** Accepts both "12.50" and "12,50". Returns null for empty or invalid input. */
export function parseAmount(text: string) {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function formatCost(value: number) {
  return value.toFixed(2);
}
