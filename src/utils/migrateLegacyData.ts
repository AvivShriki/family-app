import { collection, getDocs, writeBatch, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * העברה חד-פעמית של הנתונים מהמבנה הישן (אוספים בשורש, משותפים לכולם)
 * אל תוך משק הבית של המשפחה. מזהי המסמכים נשמרים, ולכן הרצה חוזרת
 * פשוט דורסת את אותם מסמכים ולא מייצרת כפילויות.
 *
 * זמני: אחרי שההעברה בוצעה ואומתה, הקובץ הזה והכרטיס שמפעיל אותו נמחקים.
 */

// רק משק הבית הזה החזיק נתונים במבנה הישן
export const LEGACY_HOUSEHOLD_ID = 'aviv-noy';

const LEGACY_COLLECTIONS = ['events', 'shoppingList', 'babyLogs'] as const;

export interface MigrationResult {
  events: number;
  shoppingList: number;
  babyLogs: number;
  profile: boolean;
}

/** כמה מסמכים ממתינים להעברה. 0 (או שגיאת הרשאות) = אין מה לעשות. */
export async function countLegacyDocs(): Promise<number> {
  let total = 0;
  for (const name of LEGACY_COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    total += snap.size;
  }
  const profile = await getDoc(doc(db, 'settings', 'babyProfile'));
  return total + (profile.exists() ? 1 : 0);
}

export async function migrateLegacyData(householdId: string): Promise<MigrationResult> {
  const result: MigrationResult = { events: 0, shoppingList: 0, babyLogs: 0, profile: false };

  for (const name of LEGACY_COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    // מגבלת Firestore היא 500 פעולות לאצווה — משאירים מרווח
    const chunks: (typeof snap.docs)[] = [];
    for (let i = 0; i < snap.docs.length; i += 450) chunks.push(snap.docs.slice(i, i + 450));

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((d) => {
        batch.set(doc(db, 'households', householdId, name, d.id), d.data());
      });
      await batch.commit();
    }
    result[name] = snap.size;
  }

  const profile = await getDoc(doc(db, 'settings', 'babyProfile'));
  if (profile.exists()) {
    const batch = writeBatch(db);
    batch.set(doc(db, 'households', householdId, 'settings', 'babyProfile'), profile.data());
    await batch.commit();
    result.profile = true;
  }

  return result;
}
