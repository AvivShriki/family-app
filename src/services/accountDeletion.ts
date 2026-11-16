import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEMO_MODE } from '../config/demo';

/**
 * מחיקת חשבון.
 *
 * מחיקת חשבון ב-Firebase Auth מוחקת רק את אמצעי ההתחברות — כל מה
 * שב-Firestore נשאר. זה בדיוק מה שקרה כשנמחקו ארבע משפחות מהקונסולה,
 * והנתונים שלהן המשיכו לשבת במסד בלי שאף אחד יוכל להגיע אליהם.
 * הפונקציות כאן מנקות קודם, ומוחקות את החשבון אחרון.
 *
 * שני מקרים שונים לגמרי:
 *   יש עוד חברים  — המשתמש יוצא מהמשפחה, והתיעוד נשאר אצל השאר.
 *   הוא האחרון    — כל התיעוד נמחק איתו. אין למי להשאיר אותו.
 *
 * סדר הפעולות אינו שרירותי: חוקי האבטחה נשענים על מסמך השיוך ועל
 * רשימת החברים, ולכן כל מה שדורש הרשאה חייב לקרות לפני שהם נמחקים.
 */

/** תת-האוספים של משפחה. מחיקת מסמך האב אינה מוחקת אותם. */
const SUBCOLLECTIONS = ['babyLogs', 'medications', 'messages', 'settings'] as const;

/** Firestore מגביל אצווה ל-500 פעולות */
const BATCH_LIMIT = 500;

export interface DeletionPreview {
  householdId: string;
  /** כמה חברים יש במשפחה כרגע */
  members: number;
  /** האם המשתמש הוא האחרון, ולכן כל התיעוד יימחק */
  isLastMember: boolean;
  /** כמה רישומי תינוקת יימחקו. אפס כשיש עוד חברים. */
  logs: number;
}

/**
 * מה בדיוק יקרה אם המשתמש הזה ימחק את עצמו עכשיו.
 *
 * נקרא לפני ההצגה למשתמש, כי ההבדל בין "אתה יוצא" לבין "הכול נמחק"
 * הוא ההבדל היחיד שחשוב לו, ואי אפשר לנחש אותו מראש.
 */
export async function previewDeletion(uid: string, householdId: string): Promise<DeletionPreview> {
  if (DEMO_MODE) {
    return { householdId, members: 1, isLastMember: true, logs: 8 };
  }
  const snap = await getDoc(doc(db, 'households', householdId));
  const members: string[] = snap.exists() ? (snap.data().members ?? []) : [];
  const isLastMember = members.length <= 1;

  let logs = 0;
  if (isLastMember) {
    const logsSnap = await getDocs(collection(db, 'households', householdId, 'babyLogs'));
    logs = logsSnap.size;
  }

  return { householdId, members: members.length, isLastMember, logs };
}

/** מוחק את כל המסמכים באוסף, באצוות שלא חורגות מהמגבלה */
async function deleteCollection(path: string[]): Promise<number> {
  const snap = await getDocs(collection(db, path[0], ...path.slice(1)));
  let done = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
    await batch.commit();
    done += Math.min(BATCH_LIMIT, snap.docs.length - i);
  }
  return done;
}

/**
 * מנקה את כל מה ששייך למשתמש ב-Firestore.
 *
 * מוחזר כדי שהקורא ימחק את חשבון ה-Auth רק אחרי שזה הצליח: אם
 * המחיקה נקטעת באמצע, המשתמש עדיין יכול להיכנס ולנסות שוב. הסדר
 * ההפוך היה משאיר נתונים יתומים בלי אף אחד שיכול להגיע אליהם.
 */
export async function purgeUserData(
  uid: string,
  email: string,
  householdId: string,
  isLastMember: boolean,
): Promise<void> {
  if (DEMO_MODE) return;
  if (isLastMember) {
    // תת-האוספים לפני מסמך המשפחה: ברגע שהוא נמחק, רשימת החברים
    // נעלמת והחוקים כבר לא מאשרים לגעת במה שתחתיו
    for (const sub of SUBCOLLECTIONS) {
      await deleteCollection(['households', householdId, sub]);
    }
    await deleteDoc(doc(db, 'households', householdId));
  } else {
    // יציאה מהמשפחה: רק הסרה עצמית, בלי לגעת באף אחד אחר
    const snap = await getDoc(doc(db, 'households', householdId));
    const members: string[] = snap.exists() ? (snap.data().members ?? []) : [];
    await updateDoc(doc(db, 'households', householdId), {
      members: members.filter((m) => m !== uid),
    });
  }

  // מסמכי השיוך אחרונים: החוקים קוראים מהם את המשפחה של המשתמש,
  // וכל מחיקה קודמת הייתה שוללת ממנו את ההרשאה לפעולות שמעליה
  await deleteDoc(doc(db, 'users', uid));
  // הנתיב הישן לפי אימייל. ייתכן שאינו קיים, ואז אין מה למחוק.
  await deleteDoc(doc(db, 'users', email.toLowerCase())).catch(() => {});
}
