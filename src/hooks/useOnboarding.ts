import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * האם להציג את ההדרכה.
 *
 * הדגל נשמר במכשיר ולא ב-Firestore בכוונה: מסמך המשתמש הוא לכתיבה
 * חד-פעמית לפי חוקי האבטחה (create בלבד, בלי update), ולא שווה לפתוח
 * אותו רק בשביל זה. "לכל מכשיר" הוא גם ההתנהגות הנכונה — מי שנכנס
 * מטלפון חדש מקבל את ההדרכה שוב, וזה בדיוק מה שהוא צריך.
 *
 * המפתח ממוספר: אם ההדרכה תשתנה מהותית, העלאת המספר תציג אותה מחדש.
 */
const KEY = 'onboarding:seen:v1';

/**
 * המצב משותף לכל המשתמשים ב-hook ולא מקומי לכל אחד.
 *
 * ההדרכה מוצגת מתוך הניווט, אבל כפתור "הצגה מחדש" יושב במסך ההגדרות.
 * בלי מצב משותף, לחיצה שם הייתה מעדכנת עותק אחר ושום דבר לא היה קורה.
 * חנות זעירה עדיפה כאן על Context נוסף בעץ שכבר עמוס בספקים.
 */
// null = עדיין לא נקרא מהאחסון. חשוב להבחין בינו לבין false, אחרת
// ההדרכה מהבהבת לרגע בכל טעינה לפני שהתשובה חוזרת.
let visible: boolean | null = null;
const listeners = new Set<(v: boolean | null) => void>();

function set(v: boolean | null) {
  visible = v;
  listeners.forEach((fn) => fn(v));
}

let loaded = false;
function loadOnce() {
  if (loaded) return;
  loaded = true;
  AsyncStorage.getItem(KEY)
    .then((v) => set(v !== '1'))
    // כשל קריאה לא יחסום את האפליקציה; במקרה כזה פשוט לא מדריכים.
    .catch(() => set(false));
}

export function useOnboarding() {
  const [show, setShow] = useState<boolean | null>(visible);

  useEffect(() => {
    listeners.add(setShow);
    loadOnce();
    return () => {
      listeners.delete(setShow);
    };
  }, []);

  const finish = useCallback(() => {
    set(false);
    AsyncStorage.setItem(KEY, '1').catch(() => {});
  }, []);

  const replay = useCallback(() => set(true), []);

  return { show: show === true, ready: show !== null, finish, replay };
}
