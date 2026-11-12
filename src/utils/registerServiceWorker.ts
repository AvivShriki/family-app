import { Platform } from 'react-native';

/**
 * רישום רכיב הרקע, שהוא מה שהופך את האתר לאפליקציה שניתן להתקין —
 * ובאייפון גם התנאי לקבלת התראות בהמשך.
 *
 * הרישום נדחה עד אחרי טעינת העמוד כדי לא להתחרות על רוחב הפס עם
 * הבאנדל עצמו, ונכשל בשקט: אם הדפדפן לא תומך, האפליקציה פשוט ממשיכה
 * לעבוד כאתר רגיל.
 */
export function registerServiceWorker() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // נתיב יחסי: האתר מוגש גם משורש הדומיין וגם מתת-נתיב ב-GitHub Pages
    navigator.serviceWorker
      .register('sw.js')
      .catch((err) => console.error('רישום רכיב הרקע נכשל:', err));
  });
}
