import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEMO_MODE } from '../config/demo';

/**
 * תמונות של רישומים, במסמך נפרד לכל רישום.
 *
 * למה לא בתוך הרישום עצמו, כמו תמונת הפרופיל: היומן מנוי על חלון של
 * 60 יום, כלומר אלפי רישומים נמשכים בכל פתיחה של האפליקציה. תמונה
 * בתוך הרישום הייתה נוסעת איתו בכל פעם — מכפילה את עלות הקריאה
 * ואת התעבורה, ובדרך גם נתקלת במגבלת ה-1MB של מסמך.
 *
 * כאן הרישום מחזיק דגל hasPhoto בלבד, והתמונה נטענת רק כשבאמת
 * פותחים אותה. אותו אוסף כבר מכוסה בחוקי האבטחה הקיימים
 * (households/{hid}/{sub}/{document=**}), ולכן לא נדרש שינוי חוקים.
 */

const photoDoc = (householdId: string, logId: string) =>
  doc(db, 'households', householdId, 'logPhotos', logId);

// במצב דמו אין Firestore; התמונות חיות בזיכרון עד רענון
const demoPhotos = new Map<string, string>();

export async function savePhoto(householdId: string, logId: string, dataUrl: string) {
  if (DEMO_MODE) {
    demoPhotos.set(logId, dataUrl);
    return;
  }
  await setDoc(photoDoc(householdId, logId), { dataUrl, updatedAt: Date.now() });
}

export async function loadPhoto(householdId: string, logId: string): Promise<string | null> {
  if (DEMO_MODE) return demoPhotos.get(logId) ?? null;
  const snap = await getDoc(photoDoc(householdId, logId));
  return snap.exists() ? ((snap.data().dataUrl as string) ?? null) : null;
}

export async function deletePhoto(householdId: string, logId: string) {
  if (DEMO_MODE) {
    demoPhotos.delete(logId);
    return;
  }
  await deleteDoc(photoDoc(householdId, logId));
}
