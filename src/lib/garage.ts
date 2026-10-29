import { useSyncExternalStore } from 'react';

import type { CarDocument } from '@/components/documents/types';
import type { Intervention } from '@/components/services/types';
import { deleteAttachment } from '@/lib/attachments';
import { cancelReminders } from '@/lib/reminders';
import { readItem, writeItem } from '@/lib/storage';

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
    const id = newId();
    update((s) => ({ ...s, cars: [...s.cars, { ...car, id, plate }], activeCarId: id }));
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
  },

  addDocument(document: CarDocument) {
    update((s) => ({ ...s, documents: [...s.documents, document] }));
  },

  removeDocument(document: CarDocument) {
    cleanUpDocument(document);
    update((s) => ({ ...s, documents: s.documents.filter((d) => d.id !== document.id) }));
  },

  addIntervention(intervention: Intervention) {
    update((s) => ({ ...s, interventions: [...s.interventions, intervention] }));
  },

  removeIntervention(intervention: Intervention) {
    intervention.bills.forEach(deleteAttachment);
    update((s) => ({
      ...s,
      interventions: s.interventions.filter((i) => i.id !== intervention.id),
    }));
  },
};
