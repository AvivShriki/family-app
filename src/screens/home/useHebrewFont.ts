import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * טעינת Heebo, הפונט של מסך הבית.
 *
 * ההזרקה היא מהמסך ולא מהשורש בכוונה: ההנחיה הייתה לא לגעת בשום
 * מסך אחר, והחלת הפונט גלובלית הייתה משנה את המראה של היומן, הלוח
 * וההגדרות. כאן הוא נטען פעם אחת, וחל רק על הסגנונות של המסך הזה.
 *
 * הטעינה נכשלת בשקט: בלי Heebo המסך מוצג בפונט המערכת, שהוא ממילא
 * הנפילה הבאה בהגדרת ה-fontFamily.
 */
export function useHebrewFont() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('home-heebo')) return;

    const pre = document.createElement('link');
    pre.rel = 'preconnect';
    pre.href = 'https://fonts.gstatic.com';
    pre.crossOrigin = 'anonymous';
    document.head.appendChild(pre);

    const link = document.createElement('link');
    link.id = 'home-heebo';
    link.rel = 'stylesheet';
    // display=swap: הטקסט מוצג מיד בפונט המערכת ומתחלף כשהפונט מגיע
    link.href =
      'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}
