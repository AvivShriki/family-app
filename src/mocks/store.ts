// In-memory store that mimics Firestore's real-time behavior via listeners.
import { FamilyEvent, ShoppingItem, BabyLog } from '../types';

type CollectionName = 'events' | 'shoppingList' | 'babyLogs';

const now = Date.now();
const day = 86400000;

const seed: Record<CollectionName, any[]> = {
  events: [
    { id: 'e1', title: 'ביקור אצל סבא וסבתא', date: '2026-07-04', time: '16:00', note: '', createdBy: 'aviv', createdAt: now - day * 3 },
    { id: 'e2', title: 'ביקורת רופא ילדים — ליבי', date: '2026-07-10', time: '10:30', note: 'חיסון חמישה חודשים', createdBy: 'noy', createdAt: now - day },
    { id: 'e3', title: 'יום הולדת לנוי 🎂', date: '2026-07-22', time: '', note: '', createdBy: 'aviv', createdAt: now },
  ] as FamilyEvent[],
  shoppingList: [
    { id: 's1', text: 'חיתולים מידה 3', checked: false, addedBy: 'noy', createdAt: now - 1000 },
    { id: 's2', text: 'מגבונים לחים', checked: false, addedBy: 'noy', createdAt: now - 2000 },
    { id: 's3', text: 'בננות', checked: true, addedBy: 'aviv', createdAt: now - 3000 },
    { id: 's4', text: 'חלב אם — שקיות אחסון', checked: false, addedBy: 'noy', createdAt: now - 4000 },
    { id: 's5', text: 'לחם', checked: true, addedBy: 'aviv', createdAt: now - 5000 },
  ] as ShoppingItem[],
  babyLogs: [
    { id: 'b1', type: 'feeding', timestamp: now - 1000 * 60 * 30, feedingType: 'breast_left', durationMin: 12, loggedBy: 'noy' },
    { id: 'b2', type: 'diaper', timestamp: now - 1000 * 60 * 90, diaperType: 'wet', loggedBy: 'aviv' },
    { id: 'b3', type: 'sleep', timestamp: now - 1000 * 60 * 60 * 3, endTimestamp: now - 1000 * 60 * 60 * 1.5, loggedBy: 'noy' },
    { id: 'b4', type: 'feeding', timestamp: now - 1000 * 60 * 60 * 4, feedingType: 'bottle', amountMl: 90, loggedBy: 'aviv' },
    { id: 'b5', type: 'note', timestamp: now - 1000 * 60 * 60 * 6, details: 'חייכה בפעם הראשונה! 😍', loggedBy: 'noy' },
  ] as BabyLog[],
};

// Deep-clone seed so mutations don't affect the original
const store: Record<CollectionName, any[]> = {
  events: seed.events.map((e) => ({ ...e })),
  shoppingList: seed.shoppingList.map((e) => ({ ...e })),
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

export function mockAdd(col: CollectionName, data: any) {
  const id = Math.random().toString(36).slice(2);
  store[col] = [{ id, ...data }, ...store[col]];
  notify(col);
}

export function mockDelete(col: CollectionName, id: string) {
  store[col] = store[col].filter((d) => d.id !== id);
  notify(col);
}

export function mockUpdate(col: CollectionName, id: string, data: any) {
  store[col] = store[col].map((d) => (d.id === id ? { ...d, ...data } : d));
  notify(col);
}
