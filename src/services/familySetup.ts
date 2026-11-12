import { doc, getDoc, setDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BabyProfile } from '../hooks/useBabyProfile';

/**
 * פתיחת משפחה חדשה והצטרפות למשפחה קיימת.
 *
 * שתי הפעולות היחידות שכותבות לאוסף users, והן כתובות כך שחוקי
 * האבטחה יוכלו לאשר אותן בלי להסתמך על שום דבר שהלקוח טוען:
 *
 * - משפחה חדשה מקבלת את מזהה המשתמש שפתח אותה כמזהה שלה. זה מה
 *   שמונע פתיחת משפחה קיימת או הצבעה על משפחה של אחר.
 * - הצטרפות עוברת דרך הזמנה חד-פעמית, והחוק קורא את ההזמנה בעצמו.
 */

/** כמה זמן הזמנה תקפה. שבוע מספיק לשלוח בוואטסאפ ולשכוח ליום-יומיים. */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** בלי תווים שמתבלבלים זה בזה כשמקלידים: אפס/O, אחת/I/L */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/**
 * פותח משפחה חדשה שמזההּ הוא מזהה המשתמש, ושומר את פרטי התינוק/ת.
 * הפרופיל נכתב בנפרד ואחרי, כי החוק שמגן עליו דורש שהשיוך כבר יהיה
 * קיים — ובתוך אצווה אחת החוקים נבדקים מול המצב שלפניה.
 */
export async function createFamily(uid: string, email: string, profile: BabyProfile) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'households', uid), { members: [uid], createdBy: uid });
  batch.set(doc(db, 'users', uid), { householdId: uid, email });
  await batch.commit();

  await setDoc(doc(db, 'households', uid, 'settings', 'babyProfile'), {
    name: profile.name,
    birthDate: profile.birthDate,
    ...(profile.familyName ? { familyName: profile.familyName } : {}),
  });
}

export type JoinError = 'invite/not-found' | 'invite/used' | 'invite/expired' | 'invite/full';

/**
 * מצרף את המשתמש למשפחה שההזמנה מצביעה עליה.
 * רשימת החברים מעודכנת ב-arrayUnion ולא בקריאה-ואז-כתיבה, כי עד
 * שההצטרפות מאושרת אין למצטרף הרשאת קריאה על מסמך המשפחה.
 */
export async function joinFamily(uid: string, email: string, code: string): Promise<string> {
  const inviteRef = doc(db, 'invites', code.trim().toUpperCase());
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) throw new Error('invite/not-found' as JoinError);

  const invite = snap.data();
  if (invite.used) throw new Error('invite/used' as JoinError);
  if (typeof invite.expiresAt === 'number' && invite.expiresAt <= Date.now()) {
    throw new Error('invite/expired' as JoinError);
  }

  const householdId: string = invite.householdId;
  const batch = writeBatch(db);
  batch.update(doc(db, 'households', householdId), {
    members: arrayUnion(uid),
    joinedWith: inviteRef.id,
  });
  batch.set(doc(db, 'users', uid), { householdId, email, inviteCode: inviteRef.id });
  batch.update(inviteRef, { used: true, usedBy: uid });
  await batch.commit();

  return householdId;
}

/**
 * מייצר הזמנה חדשה ומחזיר את הקוד. נוצרת רק בידי חבר באותה משפחה.
 *
 * שם המשפחה נשמר על ההזמנה עצמה בכוונה: מי שלוחץ על הקישור עדיין לא
 * מחובר, ולכן אין לו גישה לפרופיל המשפחה — בלי זה אי אפשר לומר לו
 * לאן הגיע לפני שהוא נרשם.
 */
export async function createInvite(
  householdId: string,
  uid: string,
  familyName?: string,
): Promise<string> {
  const code = generateInviteCode();
  await setDoc(doc(db, 'invites', code), {
    householdId,
    createdBy: uid,
    familyName: familyName?.trim() || '',
    used: false,
    usedBy: null,
    expiresAt: Date.now() + INVITE_TTL_MS,
  });
  return code;
}

export interface InvitePreview {
  familyName: string;
  status: 'ok' | 'not-found' | 'used' | 'expired';
}

/** נקרא לפני הרשמה, בלי התחברות — ולכן קורא רק את ההזמנה עצמה. */
export async function previewInvite(code: string): Promise<InvitePreview> {
  const snap = await getDoc(doc(db, 'invites', code.trim().toUpperCase()));
  if (!snap.exists()) return { familyName: '', status: 'not-found' };
  const d = snap.data();
  const familyName = (d.familyName as string) || '';
  if (d.used) return { familyName, status: 'used' };
  if (typeof d.expiresAt === 'number' && d.expiresAt <= Date.now()) {
    return { familyName, status: 'expired' };
  }
  return { familyName, status: 'ok' };
}
