import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useHousehold } from './HouseholdContext';
import { DEMO_MODE } from '../config/demo';
import { Medication } from '../types';

/**
 * התרופות והתוספים של המשפחה.
 *
 * עד כה "ויטמין D" ו"ברזל" היו כתובים קשיח בשישה מקומות בקוד, ולכן
 * שום משפחה אחרת לא יכלה לתעד את מה שהיא באמת נותנת. עכשיו זו רשימה
 * שהמשפחה מנהלת בעצמה, והמסכים נגזרים ממנה.
 *
 * האוסף קטן מטבעו (יחידות בודדות), ולכן מנוי מלא עליו זול.
 */
interface MedicationsValue {
  medications: Medication[];
  /** רק אלה שפעילות היום — לפי active ולפי טווח התאריכים */
  activeToday: Medication[];
  loading: boolean;
  add: (data: Omit<Medication, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, data: Partial<Medication>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const MedicationsContext = createContext<MedicationsValue>({
  medications: [],
  activeToday: [],
  loading: true,
  add: async () => {},
  update: async () => {},
  remove: async () => {},
});

/** האם התרופה רלוונטית לתאריך הנתון, לפי טווח ההתחלה והסיום */
export function isActiveOn(m: Medication, date: Date): boolean {
  if (!m.active) return false;
  const day = date.toISOString().slice(0, 10);
  if (m.startDate && day < m.startDate) return false;
  if (m.endDate && day > m.endDate) return false;
  return true;
}

let demoMeds: Medication[] = [
  { id: 'm1', name: 'ויטמין D', emoji: '☀️', active: true, createdAt: 0, times: ['09:00'] },
  { id: 'm2', name: 'ברזל', emoji: '💧', active: true, createdAt: 0, dose: '0.5 מ"ל' },
];

export function MedicationsProvider({ children }: { children: React.ReactNode }) {
  const { householdId } = useHousehold();
  const [medications, setMedications] = useState<Medication[]>(DEMO_MODE ? demoMeds : []);
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE || !householdId) return;
    return onSnapshot(
      collection(db, 'households', householdId, 'medications'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Medication);
        list.sort((a, b) => a.createdAt - b.createdAt);
        setMedications(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error on "medications":', err);
        setLoading(false);
      },
    );
  }, [householdId]);

  const col = () => collection(db, 'households', householdId!, 'medications');

  const add = async (data: Omit<Medication, 'id' | 'createdAt'>) => {
    const entry = { ...data, createdAt: Date.now() };
    if (DEMO_MODE) {
      demoMeds = [...demoMeds, { id: String(Date.now()), ...entry }];
      setMedications(demoMeds);
      return;
    }
    if (!householdId) return;
    await addDoc(col(), entry);
  };

  const update = async (id: string, data: Partial<Medication>) => {
    if (DEMO_MODE) {
      demoMeds = demoMeds.map((m) => (m.id === id ? { ...m, ...data } : m));
      setMedications(demoMeds);
      return;
    }
    if (!householdId) return;
    await updateDoc(doc(db, 'households', householdId, 'medications', id), data as any);
  };

  const remove = async (id: string) => {
    if (DEMO_MODE) {
      demoMeds = demoMeds.filter((m) => m.id !== id);
      setMedications(demoMeds);
      return;
    }
    if (!householdId) return;
    await deleteDoc(doc(db, 'households', householdId, 'medications', id));
  };

  const activeToday = medications.filter((m) => isActiveOn(m, new Date()));

  return (
    <MedicationsContext.Provider value={{ medications, activeToday, loading, add, update, remove }}>
      {children}
    </MedicationsContext.Provider>
  );
}

export const useMedications = () => useContext(MedicationsContext);
