import { useSyncExternalStore } from 'react';

import type { CarDocument } from '@/components/documents/types';
import type { Intervention } from '@/components/services/types';
import { deleteAttachment } from '@/lib/attachments';
import { cancelReminders } from '@/lib/reminders';
import { readItem, writeItem } from '@/lib/storage';
import { ensureSignedIn, supabase } from '@/lib/supabase';


export type Car = {
  id: string;
  /** Normalized: uppercase, single spaces. Unique across the garage. */
  plate: string;
  make?: string;
  model?: string;
  year?: number;
};

type GarageState = {
  cars: Car[];
  activeCarId: string | null;
  documents: CarDocument[];
  interventions: Intervention[];
};

const STORAGE_KEY = 'glovebox:garage:v1';
const EMPTY_STATE: GarageState = { cars: [], activeCarId: null, documents: [], interventions: [] };

// const toCar = (r: any): Car => ({
//   id: r.id, plate: r.plate, make: r.make ?? undefined, model: r.model ?? undefined, year: r.year ?? undefined,
// });
// const toDocument = (r: any): CarDocument => ({
//   id: r.id, carId: r.car_id, kind: r.kind, name: r.name,
//   number: r.number ?? undefined, issuer: r.issuer ?? undefined,
//   startDate: r.start_date ?? undefined, expiryDate: r.expiry_date ?? undefined,
//   notes: r.notes ?? undefined, files: r.files, reminderIds: r.reminder_ids,
// });
// const fromDocument = (d: CarDocument) => ({
//   id: d.id, car_id: d.carId, kind: d.kind, name: d.name, number: d.number, issuer: d.issuer,
//   start_date: d.startDate, expiry_date: d.expiryDate, notes: d.notes,
//   files: d.files, reminder_ids: d.reminderIds,
// });
// Write toIntervention / fromIntervention the same way (use Number(r.cost) for the cost).

// export async function syncFromSupabase() {
//   await ensureSignedIn();
//   const [cars, documents, interventions] = await Promise.all([
//     supabase.from('cars').select('*').order('created_at'),
//     supabase.from('documents').select('*'),
//     supabase.from('interventions').select('*'),
//   ]);
//   if (cars.error || documents.error || interventions.error) return; // stay on the local cache

//   // One-time upload: the database is empty but this device already has data.
//   if (cars.data.length === 0 && getSnapshot().cars.length > 0) {
//     const s = getSnapshot();
//     await supabase.from('cars').insert(s.cars.map(({ id, plate, make, model, year }) => ({ id, plate, make, model, year })));
//     await supabase.from('documents').insert(s.documents.map(fromDocument));
//     await supabase.from('interventions').insert(s.interventions.map(fromIntervention));
//     return;
//   }

//   update((s) => ({
//     ...s,
//     cars: cars.data.map(toCar),
//     documents: documents.data.map(toDocument),
//     interventions: interventions.data.map(toIntervention),
//   }));
// }


let state = EMPTY_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load(): GarageState {
  const raw = readItem(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<GarageState>;
    return {
      cars: parsed.cars ?? [],
      activeCarId: parsed.activeCarId ?? null,
      documents: parsed.documents ?? [],
      interventions: parsed.interventions ?? [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function getSnapshot() {
  if (!loaded) {
    state = load();
    loaded = true;
  }
  return state;
}

// Server rendering (web) has no storage; the client re-renders with the stored data after hydration.
function getServerSnapshot() {
  return EMPTY_STATE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(change: (current: GarageState) => GarageState) {
  state = change(getSnapshot());
  writeItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener());
}

// --- Supabase rows (snake_case) <-> app types (camelCase) ---

type CarRow = {
  id: string;
  plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
};

type DocumentRow = {
  id: string;
  car_id: string;
  kind: DocumentKind;
  name: string;
  number: string | null;
  issuer: string | null;
  start_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  files: Attachment[];
  reminder_ids: string[];
};

type InterventionRow = {
  id: string;
  car_id: string;
  kind: InterventionKind;
  title: string;
  items: string[];
  date: string;
  mileage: number | null;
  cost: number | string;
  notes: string | null;
  bills: Attachment[];
};

const toCar = (r: CarRow): Car => ({
  id: r.id,
  plate: r.plate,
  make: r.make ?? undefined,
  model: r.model ?? undefined,
  year: r.year ?? undefined,
});

const fromCar = (c: Car) => ({
  id: c.id,
  plate: c.plate,
  make: c.make ?? null,
  model: c.model ?? null,
  year: c.year ?? null,
});

const toDocument = (r: DocumentRow): CarDocument => ({
  id: r.id,
  carId: r.car_id,
  kind: r.kind,
  name: r.name,
  number: r.number ?? undefined,
  issuer: r.issuer ?? undefined,
  startDate: r.start_date ?? undefined,
  expiryDate: r.expiry_date ?? undefined,
  notes: r.notes ?? undefined,
  files: r.files ?? [],
  reminderIds: r.reminder_ids ?? [],
});

const fromDocument = (d: CarDocument) => ({
  id: d.id,
  car_id: d.carId,
  kind: d.kind,
  name: d.name,
  number: d.number ?? null,
  issuer: d.issuer ?? null,
  start_date: d.startDate ?? null,
  expiry_date: d.expiryDate ?? null,
  notes: d.notes ?? null,
  files: d.files,
  reminder_ids: d.reminderIds,
});

const toIntervention = (r: InterventionRow): Intervention => ({
  id: r.id,
  carId: r.car_id,
  kind: r.kind,
  title: r.title,
  items: r.items ?? [],
  date: r.date,
  mileage: r.mileage ?? undefined,
  // Postgres numeric can arrive as a string; the app expects a number.
  cost: Number(r.cost),
  notes: r.notes ?? undefined,
  bills: r.bills ?? [],
});

const fromIntervention = (i: Intervention) => ({
  id: i.id,
  car_id: i.carId,
  kind: i.kind,
  title: i.title,
  items: i.items,
  date: i.date,
  mileage: i.mileage ?? null,
  cost: i.cost,
  notes: i.notes ?? null,
  bills: i.bills,
});

// --- Sync ---

let signingIn: Promise<unknown> | null = null;

/** Shares one sign-in between all callers; retries next time if it failed (e.g. offline). */
function whenSignedIn() {
  signingIn ??= ensureSignedIn().catch((error) => {
    signingIn = null;
    throw error;
  });
  return signingIn;
}

/** Downloads the garage from Supabase. Keeps the local copy if the request fails. */
export async function syncFromSupabase() {
  try {
    await whenSignedIn();
    const [cars, documents, interventions] = await Promise.all([
      supabase.from('cars').select('*').order('created_at'),
      supabase.from('documents').select('*'),
      supabase.from('interventions').select('*'),
    ]);
    if (cars.error) throw cars.error;
    if (documents.error) throw documents.error;
    if (interventions.error) throw interventions.error;

    // First run with Supabase: the database is empty but this device has data, so upload it.
    const local = getSnapshot();
    if (cars.data.length === 0 && local.cars.length > 0) {
      await uploadLocal(local);
      return;
    }

    update((s) => ({
      ...s,
      cars: (cars.data as CarRow[]).map(toCar),
      documents: (documents.data as DocumentRow[]).map(toDocument),
      interventions: (interventions.data as InterventionRow[]).map(toIntervention),
    }));
  } catch (error) {
    console.warn('Supabase sync failed, using the local copy:', error);
  }
}

async function uploadLocal(local: GarageState) {
  // Cars first: documents and interventions reference them.
  const cars = await supabase.from('cars').upsert(local.cars.map(fromCar));
  if (cars.error) throw cars.error;
  const [documents, interventions] = await Promise.all([
    supabase.from('documents').upsert(local.documents.map(fromDocument)),
    supabase.from('interventions').upsert(local.interventions.map(fromIntervention)),
  ]);
  if (documents.error) throw documents.error;
  if (interventions.error) throw interventions.error;
}

/**
 * Sends one change to Supabase after the screen has already been updated locally.
 * If it fails, reloads from Supabase so the screen matches the database again.
 */
async function push(write: () => PromiseLike<{ error: { message: string } | null }>) {
  try {
    await whenSignedIn();
    const { error } = await write();
    if (error) throw error;
  } catch (error) {
    console.warn('Supabase write failed:', error);
    syncFromSupabase();
  }
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Romanian plate layouts: county letters, digits, then letters.
 * L NN LLL, L NNN LLL or LL NN LLL (e.g. B 12 ABC, B 123 ABC, CJ 12 ABC).
 */
export const PLATE_PATTERN = /^(?:[A-Z] \d{2,3}|[A-Z]{2} \d{2}) [A-Z]{3}$/;

/** Uppercases and puts single spaces between the groups, so "cj12abc" and "CJ-12-ABC" become "CJ 12 ABC". */
export function normalizePlate(plate: string) {
  const compact = plate.toUpperCase().replace(/[\s-]+/g, '');
  const groups = /^([A-Z]+)(\d+)([A-Z]+)$/.exec(compact);
  return groups ? groups.slice(1).join(' ') : plate.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function useGarage() {
  const garage = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const activeCar = garage.cars.find((car) => car.id === garage.activeCarId) ?? garage.cars[0];
  return { ...garage, activeCar };
}

function cleanUpDocument(document: CarDocument) {
  cancelReminders(document.reminderIds).catch(() => {});
  document.files.forEach(deleteAttachment);
}

export const garageActions = {
  /** Returns an error message if the plate is already taken. */
  addCar(car: Omit<Car, 'id'>): string | null {
    const plate = normalizePlate(car.plate);
    if (!PLATE_PATTERN.test(plate)) {
      return `${plate} isn't a valid Romanian plate. Use a format like B 123 ABC or CJ 12 ABC.`;
    }
    if (getSnapshot().cars.some((c) => c.plate === plate)) {
      return `${plate} is already in your garage.`;
    }
    const newCar: Car = { ...car, id: newId(), plate };
    update((s) => ({ ...s, cars: [...s.cars, newCar], activeCarId: newCar.id }));
    push(() => supabase.from('cars').insert(fromCar(newCar)));
    return null;

  },

  selectCar(carId: string) {
    update((s) => ({ ...s, activeCarId: carId }));
  },

  /** Removes the car with all its documents, services, files and reminders. */
  removeCar(carId: string) {
    const current = getSnapshot();
    current.documents.filter((d) => d.carId === carId).forEach(cleanUpDocument);
    current.interventions
      .filter((i) => i.carId === carId)
      .forEach((i) => i.bills.forEach(deleteAttachment));
    update((s) => {
      const cars = s.cars.filter((c) => c.id !== carId);
      return {
        cars,
        activeCarId: s.activeCarId === carId ? (cars[0]?.id ?? null) : s.activeCarId,
        documents: s.documents.filter((d) => d.carId !== carId),
        interventions: s.interventions.filter((i) => i.carId !== carId),
      };
    });
    // The database deletes the car's documents and interventions with it (on delete cascade).
    push(() => supabase.from('cars').delete().eq('id', carId));

  },

  addDocument(document: CarDocument) {
    update((s) => ({ ...s, documents: [...s.documents, document] }));
    push(() => supabase.from('documents').insert(fromDocument(document)));
  },

  removeDocument(document: CarDocument) {
    cleanUpDocument(document);
    update((s) => ({ ...s, documents: s.documents.filter((d) => d.id !== document.id) }));
    push(() => supabase.from('documents').delete().eq('id', document.id));
  },

  addIntervention(intervention: Intervention) {
    update((s) => ({ ...s, interventions: [...s.interventions, intervention] }));
    push(() => supabase.from('interventions').insert(fromIntervention(intervention)));
  },

  removeIntervention(intervention: Intervention) {
    intervention.bills.forEach(deleteAttachment);
    update((s) => ({
      ...s,
      interventions: s.interventions.filter((i) => i.id !== intervention.id),
    }));
    push(() => supabase.from('interventions').delete().eq('id', intervention.id));
  },
};
