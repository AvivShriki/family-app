import { User, sendEmailVerification } from 'firebase/auth';
import { MAILER_URL } from '../config/mailer';

/**
 * שולח את מייל אישור הכתובת.
 *
 * מנסה קודם את השירות שלנו, ששולח מייל מעוצב בעברית. אם הוא כבוי,
 * לא זמין או מחזיר שגיאה — נופל חזרה למייל של Firebase.
 *
 * הנפילה חזרה היא העיקר: מייל האימות חוסם כניסה לאפליקציה, ולכן תקלה
 * בשירות חיצוני לא יכולה להיות הסיבה שמשתמש חדש נתקע בחוץ. במקרה הגרוע
 * הוא מקבל מייל פחות יפה.
 */
export async function sendVerificationEmail(user: User): Promise<'custom' | 'firebase'> {
  if (MAILER_URL) {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${MAILER_URL}/verify-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return 'custom';
      console.error('שליחת המייל המעוצב נכשלה, עוברים למייל של Firebase:', res.status);
    } catch (e) {
      console.error('שליחת המייל המעוצב נכשלה, עוברים למייל של Firebase:', e);
    }
  }
  await sendEmailVerification(user);
  return 'firebase';
}
