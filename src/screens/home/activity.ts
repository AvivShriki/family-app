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

/** "2ש׳ 30ד׳" — נקודתיים בשורת מונים נקראות כשעון */
export function shortDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return m > 0 ? `${h}ש׳ ${m}ד׳` : `${h}ש׳`;
  return `${m}ד׳`;
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
  if (log.type === 'feeding' && log.amountMl) parts.push(`${log.amountMl} מ"ל`);
  if (log.type === 'sleep') {
    parts.push(
      log.endTimestamp ? shortDuration(log.endTimestamp - log.timestamp) : 'עוד לא נרשמה התעוררות',
    );
  }
  if (log.type === 'diaper' && log.diaperType) parts.push(DIAPER[log.diaperType] ?? '');
  if (log.details) parts.push(log.details);
  return parts.filter(Boolean).join(' · ');
}
