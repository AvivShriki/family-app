// In-memory store that mimics Firestore's real-time behavior via listeners.
import { BabyLog } from '../types';

type CollectionName = 'babyLogs';

const now = Date.now();
const day = 86400000;

// Helper: set a specific HH:MM for today
function setTime(h: number, m: number): number {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

const seed: Record<CollectionName, any[]> = {
  babyLogs: [
    { id: 'b1', type: 'feeding', timestamp: setTime(7, 45), amountMl: 180, loggedBy: 'noy' },
    {
      id: 'b2',
      type: 'sleep',
      timestamp: setTime(9, 15),
      endTimestamp: setTime(10, 30),
      loggedBy: 'noy',
    },
    {
      id: 'b3',
      type: 'medication',
      medicationId: 'm1',
      timestamp: setTime(9, 15),
      loggedBy: 'noy',
    },
    { id: 'b4', type: 'feeding', timestamp: setTime(11, 0), amountMl: 150, loggedBy: 'aviv' },
    { id: 'b5', type: 'diaper', timestamp: setTime(12, 45), diaperType: 'dirty', loggedBy: 'aviv' },
    {
      id: 'b6',
      type: 'sleep',
      timestamp: setTime(13, 20),
      endTimestamp: setTime(15, 5),
      loggedBy: 'noy',
    },
    { id: 'b7', type: 'feeding', timestamp: setTime(15, 40), amountMl: 160, loggedBy: 'aviv' },
    {
      id: 'b8',
      type: 'medication',
      medicationId: 'm2',
      timestamp: setTime(18, 40),
      loggedBy: 'noy',
    },
  ] as BabyLog[],
};

// Deep-clone seed so mutations don't affect the original
const store: Record<CollectionName, any[]> = {
  babyLogs: seed.babyLogs.map((e) => ({ ...e })),
};

type Listener = (docs: any[]) => void;
const listeners: Record<string, Listener[]> = {};

function notify(col: CollectionName) {
  (listeners[col] ?? []).forEach((fn) => fn(store[col]));
}

export function mockSubscribe(col: CollectionName, cb: Listener): () => void {
  if (!listeners[col]) listeners[col] = [];
  listeners[col].push(cb);
  // Fire immediately with current data
  setTimeout(() => cb(store[col]), 0);
  return () => {
    listeners[col] = listeners[col].filter((fn) => fn !== cb);
  };
}

export function mockAdd(col: CollectionName, data: any): string {
  const id = Math.random().toString(36).slice(2);
  store[col] = [{ id, ...data }, ...store[col]];
  notify(col);
  return id;
}

export function mockDelete(col: CollectionName, id: string) {
  store[col] = store[col].filter((d) => d.id !== id);
  notify(col);
}

export function mockUpdate(col: CollectionName, id: string, data: any) {
  store[col] = store[col].map((d) => (d.id === id ? { ...d, ...data } : d));
  notify(col);
}
