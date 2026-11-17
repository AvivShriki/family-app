import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BabyLog } from '../../types';
import { c } from './theme';

export type MCIcon = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * הזהות החזותית של כל סוג פעילות, למסך הבית.
 *
 * לכל סוג משפחת גוון משלו מתוך הפלטה — ורוד, תכלת, ירוק, לוונדר
 * וקרם — כך שאפשר לזהות פעילות לפי הצבע עוד לפני שקוראים את השם.
 * כל גוון מגיע בזוג: משטח רך לרקע, וגרסה כהה שקריאה כטקסט.
 */
export interface Meta {
  label: string;
  icon: MCIcon;
  tint: string;
  surface: string;
}

const META: Record<BabyLog['type'], Meta> = {
  feeding: { label: 'האכלה', icon: 'baby-bottle-outline', tint: c.roseDeep, surface: c.roseSoft },
  sleep: { label: 'שינה', icon: 'weather-night', tint: c.blueDeep, surface: c.blue },
  diaper: {
    label: 'חיתול',
    icon: 'human-baby-changing-table',
    tint: c.greenDeep,
    surface: c.green,
  },
  medication: { label: 'תרופה', icon: 'pill', tint: c.lavenderDeep, surface: c.lavender },
  note: { label: 'הערה', icon: 'note-text-outline', tint: c.textSoft, surface: c.bgDeep },
  // המבנה הישן. רישומים שנכתבו לפני המעבר לרשימת תרופות עדיין מוצגים.
  vitamin: {
    label: 'ויטמין D',
    icon: 'white-balance-sunny',
    tint: c.lavenderDeep,
    surface: c.lavender,
  },
  iron: { label: 'ברזל', icon: 'water', tint: c.lavenderDeep, surface: c.lavender },
};

export const metaOf = (type: BabyLog['type']): Meta => META[type] ?? META.note;

const DIAPER: Record<string, string> = { wet: 'שתן', dirty: 'קקי', both: 'שתן + קקי' };

const hoursWord = (h: number) => (h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`);
const minutesWord = (m: number) => (m === 1 ? 'דקה' : m === 2 ? 'שתי דקות' : `${m} דקות`);

/**
 * משך בזמן, במילים מלאות: "שעתיים ו-40 דקות".
 *
 * קודם היה "2ש׳ 40ד׳". הקיצורים חסכו מקום אבל דרשו פענוח, והגרש
 * הקטן נבלע בקריאה מהירה — בדיוק מה שהורה עייף עושה.
 *
 * עברית סופרת אחרת בכל כמות: שעה, שעתיים, שלוש שעות. צורת יחיד
 * וזוגי אינן "מקרה קצה" כאן אלא הערכים השכיחים ביותר בשינה אחת.
 */
export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min <= 0) return 'פחות מדקה';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return minutesWord(m);
  if (m === 0) return hoursWord(h);
  // מקף לפני ספרה ("ו-40 דקות") אבל לא לפני מילה ("ודקה")
  const mins = minutesWord(m);
  return `${hoursWord(h)} ${/^\d/.test(mins) ? 'ו-' : 'ו'}${mins}`;
}

/**
 * הכותרת של רישום בציר.
 *
 * האכלה בלי כמות היא הנקה — זו לא קטגוריה נפרדת בנתונים אלא אותו
 * רישום בלי מ"ל, וכך גם מוצג.
 */
export function titleOf(log: BabyLog, medName?: string): string {
  if (log.type === 'feeding') return log.amountMl ? 'האכלה' : 'הנקה';
  if (log.type === 'medication') return medName ?? 'תרופה';
  return metaOf(log.type).label;
}

/** הפרט שמוסיף מידע מעבר לשם ולשעה */
export function detailOf(log: BabyLog): string {
  const parts: string[] = [];
  if (log.type === 'feeding' && log.amountMl) parts.push(`${log.amountMl} מיליליטר`);
  if (log.type === 'sleep') {
    parts.push(
      log.endTimestamp ? formatDuration(log.endTimestamp - log.timestamp) : 'עוד לא נרשמה התעוררות',
    );
  }
  if (log.type === 'diaper' && log.diaperType) parts.push(DIAPER[log.diaperType] ?? '');
  if (log.details) parts.push(log.details);
  return parts.filter(Boolean).join(' · ');
}
