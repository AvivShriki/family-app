import type { BabyGender } from '../hooks/useBabyProfile';

/**
 * כל הטקסטים שמשתנים לפי מין התינוק/ת, במקום אחד.
 *
 * עברית מגדרת פעלים, שמות ושייכות, ולכן "להוסיף שדה מין" נוגע בהרבה
 * יותר מכותרת אחת. ריכוז כאן מונע את המצב שבו חצי מהאפליקציה מדברת
 * בלשון נקבה על תינוק — וגם מונע חיפוש־והחלפה בכל פעם שמתווסף טקסט.
 *
 * ברירת המחדל היא נקבה, כי זה מה שהאפליקציה הציגה לפני שהשדה היה
 * קיים: משפחה ותיקה שלא בחרה מין לא אמורה לראות שינוי פתאומי.
 */
export interface GenderWords {
  /** "תינוקת" / "תינוק" */
  baby: string;
  /** "התינוקת" / "התינוק" */
  theBaby: string;
  /** "שלה" / "שלו" */
  possessive: string;
  /** "נרדמה" / "נרדם" */
  fellAsleep: string;
  /** "התעוררה" / "התעורר" */
  wokeUp: string;
  /** "ישנה" / "ישן" */
  slept: string;
  /** "אכלה" / "אכל" */
  ate: string;
  /** "נולדה" / "נולד" */
  born: string;
}

const GIRL: GenderWords = {
  baby: 'תינוקת',
  theBaby: 'התינוקת',
  possessive: 'שלה',
  fellAsleep: 'נרדמה',
  wokeUp: 'התעוררה',
  slept: 'ישנה',
  ate: 'אכלה',
  born: 'נולדה',
};

const BOY: GenderWords = {
  baby: 'תינוק',
  theBaby: 'התינוק',
  possessive: 'שלו',
  fellAsleep: 'נרדם',
  wokeUp: 'התעורר',
  slept: 'ישן',
  ate: 'אכל',
  born: 'נולד',
};

export function wordsFor(gender?: BabyGender): GenderWords {
  return gender === 'boy' ? BOY : GIRL;
}
