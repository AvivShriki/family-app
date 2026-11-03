import React, { createContext, useContext } from 'react';
import { useCollection } from '../hooks/useCollection';
import { BabyLog } from '../types';

/**
 * מנוי אחד משותף על רישומי התינוקת.
 *
 * קודם לכן חמישה מקומות — דף הבית, היומן, הסיכום, הלוח וחלון ההוספה —
 * פתחו כל אחד מנוי נפרד על אותו אוסף. Firestore מחייב בקריאה לכל מסמך
 * בכל מנוי, כך שפתיחה אחת של האפליקציה עם 1,171 רישומים עלתה כ-5,900
 * קריאות מתוך מכסה יומית של 50,000 — והמכסה אכן נגמרה.
 *
 * עכשיו יש מנוי אחד לכל האפליקציה. גם חלון ההוספה, שרק כותב, מקבל
 * ממנו את add ו-update בלי לפתוח מנוי משלו.
 */
type BabyLogsValue = ReturnType<typeof useCollection<BabyLog>>;

const BabyLogsContext = createContext<BabyLogsValue | null>(null);

export function BabyLogsProvider({ children }: { children: React.ReactNode }) {
  const value = useCollection<BabyLog>('babyLogs', 'timestamp', 'asc');
  return <BabyLogsContext.Provider value={value}>{children}</BabyLogsContext.Provider>;
}

export function useBabyLogs(): BabyLogsValue {
  const ctx = useContext(BabyLogsContext);
  if (!ctx) throw new Error('useBabyLogs חייב לשבת בתוך BabyLogsProvider');
  return ctx;
}
