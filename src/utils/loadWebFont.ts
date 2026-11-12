import { Platform } from 'react-native';

/**
 * טעינת Heebo, הפונט העברי של האפליקציה.
 *
 * ההזרקה היא מהקוד ולא מקובץ ה-HTML, משתי סיבות: expo export מייצר את
 * index.html בעצמו (כך שכל הזרקה שם חיה בסקריפט הפריסה ולא עובדת
 * בפיתוח), והאפליקציה צריכה להיראות אותו דבר בפיתוח ובאוויר.
 *
 * הטעינה נכשלת בשקט: בלי Heebo האפליקציה מוצגת בפונט המערכת, שהוא
 * ממילא הנפילה הבאה בהגדרת ה-fontFamily.
 */
export function loadWebFont() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('heebo-font')) return;

  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://fonts.gstatic.com';
  preconnect.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect);

  const link = document.createElement('link');
  link.id = 'heebo-font';
  link.rel = 'stylesheet';
  // display=swap: הטקסט מוצג מיד בפונט המערכת ומתחלף כשהפונט מגיע,
  // במקום מסך ריק עד שהוא נטען
  link.href =
    'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}
