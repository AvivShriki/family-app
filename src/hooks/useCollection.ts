import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useHousehold } from '../context/HouseholdContext';
import { mockSubscribe, mockAdd, mockDelete, mockUpdate } from '../mocks/store';

import { DEMO_MODE } from '../config/demo';

type ColName = 'events' | 'shoppingList' | 'babyLogs';

// כל אוסף חי בתוך משק הבית של המשפחה — זה מה שמבודד בין משפחות
const colRef = (householdId: string, colName: ColName) =>
  collection(db, 'households', householdId, colName);

export function useCollection<T extends { id: string }>(
  colName: ColName,
  orderByField: string,
  direction: 'asc' | 'desc' = 'asc',
) {
  const { householdId } = useHousehold();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (DEMO_MODE) {
      const unsub = mockSubscribe(colName, (docs) => {
        const sorted = [...docs].sort((a, b) =>
          direction === 'asc'
            ? a[orderByField] > b[orderByField]
              ? 1
              : -1
            : a[orderByField] < b[orderByField]
              ? 1
              : -1,
        );
        setItems(sorted as T[]);
        setLoading(false);
      });
      return unsub;
    }

    // עדיין לא יודעים לאיזה משק בית לפנות — נשארים בטעינה במקום לשאול את
    // השורש ולקבל שגיאת הרשאות
    if (!householdId) {
      setItems([]);
      return;
    }

    const q = query(colRef(householdId, colName), orderBy(orderByField, direction));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
        setError(null);
      },
      (err) => {
        // Without this, a rules/permissions failure leaves the screen loading forever
        console.error(`Firestore error on "${colName}":`, err);
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [colName, orderByField, direction, householdId]);

  // כתיבה בלי משק בית תיכשל ממילא בחוקי האבטחה — עדיף להיכשל מוקדם ובבירור
  const requireHousehold = () => {
    if (!householdId) throw new Error('אין משק בית משויך למשתמש הזה');
    return householdId;
  };

  const add = async (data: Omit<T, 'id'>): Promise<string> => {
    if (DEMO_MODE) return mockAdd(colName, data);
    const ref = await addDoc(colRef(requireHousehold(), colName), data);
    return ref.id;
  };

  const remove = async (id: string) => {
    if (DEMO_MODE) {
      mockDelete(colName, id);
      return;
    }
    await deleteDoc(doc(db, 'households', requireHousehold(), colName, id));
  };

  const update = async (id: string, data: Partial<T>) => {
    if (DEMO_MODE) {
      mockUpdate(colName, id, data);
      return;
    }
    await updateDoc(doc(db, 'households', requireHousehold(), colName, id), data as any);
  };

  return { items, loading, error, add, remove, update };
}
