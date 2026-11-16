// חלון הטעינה של רישומי התינוקת — לוגיקה טהורה, מכוסה בבדיקות.

const DAY_MS = 86400000;

/**
 * כמה ימים אחורה נטענים בפתיחת האפליקציה.
 *
 * עד כה נטענה כל ההיסטוריה בכל פתיחה, ולכן העלות גדלה ככל שהמשפחה
 * מתעדת יותר: משפחה אחרי שנה הגיעה ל-3,650 קריאות בכל פתיחה קרה,
 * ושלוש משפחות כאלה מיצו את המכסה היומית. עם חלון קבוע העלות נשארת
 * קבועה — בערך 600 מסמכים — ולא משנה בת כמה התינוקת.
 *
 * שישים יום מכסים את מה שבאמת נפתח: דף הבית, הציר של היום, והחודש
 * הנוכחי והקודם בלוח.
 */
export const WINDOW_DAYS = 60;

/** בכמה ימים מתרחב החלון כשגוללים אל מעבר לקצה שלו */
export const EXTEND_DAYS = 60;

/** חצות של התאריך הנתון, לפי השעון המקומי */
export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** תחילת החלון הפותח: חצות של היום שלפני WINDOW_DAYS ימים */
export function windowStart(now: number, days: number = WINDOW_DAYS): number {
  return startOfDay(now - days * DAY_MS);
}

/**
 * מרחיב את החלון אחורה כשמבקשים תאריך שקודם לו.
 *
 * ההרחבה היא תמיד בצעד שלם ולא עד התאריך המבוקש בדיוק, כדי שגלילה
 * יום-יום אחורה לא תייצר שאילתה חדשה בכל נגיעה. החלון לעולם לא
 * מצטמצם: מה שכבר נטען נשאר, אחרת מסך שחוזר קדימה היה מאבד נתונים
 * שכבר שילמנו עליהם.
 */
export function extendedWindow(
  current: number,
  needed: number,
  extendDays: number = EXTEND_DAYS,
): number {
  const target = startOfDay(needed);
  if (target >= current) return current;
  return startOfDay(target - extendDays * DAY_MS);
}
