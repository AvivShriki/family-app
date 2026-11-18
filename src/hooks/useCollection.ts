import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useHousehold } from '../context/HouseholdContext';
import { mockSubscribe, mockAdd, mockDelete, mockUpdate } from '../mocks/store';

import { DEMO_MODE } from '../config/demo';

type ColName = 'babyLogs';

// כל אוסף חי בתוך משק הבית של המשפחה — זה מה שמבודד בין משפחות
const colRef = (householdId: string, colName: ColName) =>
  collection(db, 'households', householdId, colName);

export function useCollection<T extends { id: string }>(
  colName: ColName,
  orderByField: string,
  direction: 'asc' | 'desc' = 'asc',
  /**
   * טוען רק מסמכים שבהם orderByField גדול או שווה לערך הזה.
   *
   * זה מה שחוסם את הגידול בעלות: בלי החסם, כל פתיחה של האפליקציה
   * מושכת את כל ההיסטוריה, והמחיר עולה ככל שמתעדים יותר. אי-שוויון
   * על אותו שדה שלפיו ממיינים אינו דורש אינדקס מורכב.
   */
  sinceValue?: number,
) {
  const { householdId } = useHousehold();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /**
   * ניסיון חוזר אחד אחרי רענון טוקן.
   *
   * חוקי Firestore קוראים email_verified מהטוקן. מי שאישר את המייל
   * זה עתה עדיין נושא טוקן שאומר שלא, והמנוי הזה נפתח לפני שהרענון
   * מספיק לרוץ — נדחה, ואז נשאר מת גם אחרי שהטוקן התחדש. זה בדיוק
   * מה שאולץ משתמשים חדשים לצאת ולהיכנס מחדש.
   *
   * פעם אחת בלבד: אם גם הטוקן הנקי נדחה, זו באמת שגיאת הרשאה ואין
   * טעם להיכנס ללולאה מול השרת.
   */
  const [retry, setRetry] = useState(0);
  const retried = useRef(false);

  useEffect(() => {
    if (DEMO_MODE) {
      const unsub = mockSubscribe(colName, (all) => {
        // גם הדמו מסנן, אחרת אי אפשר לבדוק את התנהגות החלון
        const docs =
          sinceValue === undefined ? all : all.filter((d) => d[orderByField] >= sinceValue);
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

    const q =
      sinceValue === undefined
        ? query(colRef(householdId, colName), orderBy(orderByField, direction))
        : query(
            colRef(householdId, colName),
            where(orderByField, '>=', sinceValue),
            orderBy(orderByField, direction),
          );
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
        if (err.code === 'permission-denied' && !retried.current && auth.currentUser) {
          retried.current = true;
          auth.currentUser
            .getIdToken(true)
            .then(() => setRetry((n) => n + 1))
            .catch(() => {
              setError(err.message);
              setLoading(false);
            });
          return;
        }
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [colName, orderByField, direction, householdId, sinceValue, retry]);

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
