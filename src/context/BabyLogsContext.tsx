import React, { createContext, useCallback, useContext, useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { BabyLog } from '../types';
import { extendedWindow, windowStart } from '../utils/logWindow';

/**
 * מנוי אחד משותף על רישומי התינוקת, בחלון תאריכים.
 *
 * קודם לכן חמישה מקומות — דף הבית, היומן, הסיכום, הלוח וחלון ההוספה —
 * פתחו כל אחד מנוי נפרד על אותו אוסף. Firestore מחייב בקריאה לכל מסמך
 * בכל מנוי, כך שפתיחה אחת של האפליקציה עם 1,171 רישומים עלתה כ-5,900
 * קריאות מתוך מכסה יומית של 50,000 — והמכסה אכן נגמרה.
 *
 * המנוי אוחד, אבל הוא עדיין משך את כל ההיסטוריה, ולכן המחיר המשיך
 * לגדול עם הזמן. עכשיו נטען חלון של שישים יום בלבד. מסך שצריך תאריך
 * ישן יותר — הלוח כשגוללים חודש אחורה, או הציר כשחוזרים יום-יום —
 * קורא ל-ensureLoadedSince, והחלון מתרחב פעם אחת בצעד שלם.
 *
 * החלון לעולם לא מצטמצם בתוך אותו ביקור: מה שכבר נטען נשאר.
 */
interface BabyLogsValue extends ReturnType<typeof useCollection<BabyLog>> {
  /** מוודא שהתאריך הנתון נמצא בתוך החלון הטעון, ומרחיב אותו אם לא */
  ensureLoadedSince: (ms: number) => void;
  /** תחילת החלון הטעון כרגע — מסך יכול לדעת אם הוא מציג היסטוריה חלקית */
  loadedSince: number;
}

const BabyLogsContext = createContext<BabyLogsValue | null>(null);

export function BabyLogsProvider({ children }: { children: React.ReactNode }) {
  // נקבע פעם אחת בהרכבה; אחרת כל רינדור היה יוצר חלון חדש ומנוי חדש
  const [since, setSince] = useState(() => windowStart(Date.now()));

  const value = useCollection<BabyLog>('babyLogs', 'timestamp', 'asc', since);

  const ensureLoadedSince = useCallback((ms: number) => {
    setSince((cur) => extendedWindow(cur, ms));
  }, []);

  return (
    <BabyLogsContext.Provider value={{ ...value, ensureLoadedSince, loadedSince: since }}>
      {children}
    </BabyLogsContext.Provider>
  );
}

export function useBabyLogs(): BabyLogsValue {
  const ctx = useContext(BabyLogsContext);
  if (!ctx) throw new Error('useBabyLogs חייב לשבת בתוך BabyLogsProvider');
  return ctx;
}
