import { useEffect, useState } from 'react';

/**
 * השעה הנוכחית כ-state, מתעדכנת בקצב קבוע.
 *
 * שתי סיבות. הראשונה: "לפני 40 דק׳" וטיימר השינה הפעילה היו קופאים
 * ברגע שהמסך נפתח, ומי שמשאיר את האפליקציה פתוחה ליד המיטה ראה מספר
 * שגוי. השנייה: קריאה ל-Date.now() בתוך רינדור הופכת את הרכיב ללא
 * טהור, כך שהוא יכול להציג זמנים שונים בשני רינדורים של אותו מצב.
 *
 * דקה היא הרזולוציה הנכונה — כל מה שמוצג נמדד בדקות, ושעון שמתקתק
 * כל שנייה היה מעיר את העץ 60 פעמים בלי שום הבדל על המסך.
 */
export function useNow(intervalMs = 60000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
