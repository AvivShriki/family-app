import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BabyLog } from '../types';
import { colors } from './theme';

/**
 * הזהות החזותית של כל סוג פעילות — במקום אחד.
 *
 * לכל אחת מחמש הפעילויות יש משפחת גוון משלה מתוך הפלטה: אפרסק
 * להאכלה, תכלת לשינה, ירוק בהיר לחיתול, צהוב לתרופה ולילך להערה.
 * ההפרדה הזו היא מה שמאפשר לזהות פעילות בנקודה קטנה בלוח החודש.
 *
 * עד כה אותה ארוחה הייתה ורודה ביומן, ורודה-אחרת בלוח, ועוד גוון בסיכום,
 * וכל מסך בחר לעצמו אימוג'י. כאן נקבע פעם אחת: צבע, משטח, אייקון ושם.
 * כל מסך שמציג פעילות קורא מכאן.
 *
 * הצבעים נגזרים מהפלטה האורגנית: טרקוטה לארוחה, מרווה לשינה, דבש
 * לחיתול, מוס לתרופה, זית להערה. חמישה גוונים נבדלים בלי לצאת מהפלטה.
 */
export type MCIcon = keyof typeof MaterialCommunityIcons.glyphMap;

export interface ActivityMeta {
  label: string;
  /** צבע הזיהוי — נקודות ביומן, פסי כרטיס, אייקונים */
  color: string;
  /** משטח רך באותו גוון, לרקע מדליון האייקון */
  surface: string;
  /** הגוון המלא — נקודות ביומן, עמודות בגרף, משטח אריח צבעוני */
  tint: string;
  icon: MCIcon;
}

export const ACTIVITY: Record<BabyLog['type'], ActivityMeta> = {
  feeding: {
    label: 'האכלה',
    color: colors.terracottaDeep,
    surface: colors.terracottaSoft,
    tint: colors.terracotta,
    icon: 'baby-bottle-outline',
  },
  sleep: {
    label: 'שינה',
    color: colors.skyDeep,
    surface: colors.skySoft,
    tint: colors.sky,
    // ירח ולא האייקון 'sleep' של הספרייה: האחרון מצייר את האותיות zZz,
    // שנקראות כטקסט זעיר ולא כאייקון
    icon: 'weather-night',
  },
  diaper: {
    label: 'חיתול',
    color: '#40705A',
    surface: colors.mossSoft,
    tint: colors.moss,
    icon: 'human-baby-changing-table',
  },
  medication: {
    label: 'תרופה',
    color: colors.honeyDeep,
    surface: colors.honeySoft,
    tint: colors.honey,
    icon: 'pill',
  },
  note: {
    label: 'הערה',
    color: colors.lilacDeep,
    surface: colors.lilacSoft,
    tint: colors.lilac,
    icon: 'note-text-outline',
  },
  // המבנה הישן. רישומים שנכתבו לפני המעבר לרשימת תרופות עדיין מוצגים,
  // ושייכים למשפחת הגוון של התרופות.
  vitamin: {
    label: 'ויטמין D',
    color: colors.honeyDeep,
    surface: colors.honeySoft,
    tint: colors.honey,
    icon: 'white-balance-sunny',
  },
  iron: {
    label: 'ברזל',
    color: colors.honeyDeep,
    surface: colors.honeySoft,
    tint: colors.honey,
    icon: 'water',
  },
};

export const activityMeta = (t: BabyLog['type']): ActivityMeta => ACTIVITY[t] ?? ACTIVITY.note;

/**
 * אייקון לתרופה לפי האימוג'י השמור בה.
 *
 * שדה ה-emoji הוא נתון שכבר נשמר אצל ארבע משפחות, ולכן הוא נשאר בדיוק
 * כפי שהוא. מה שהשתנה הוא התצוגה: במקום לצייר את האימוג'י עצמו — שנראה
 * שונה בכל מערכת הפעלה — הוא משמש כמפתח לאייקון מקצועי. אימוג'י שלא
 * ברשימה מקבל גלולה, ושום נתון לא נפסל.
 */
const MED_ICONS: Record<string, MCIcon> = {
  '💊': 'pill',
  '☀️': 'white-balance-sunny',
  '💧': 'water',
  '🍼': 'baby-bottle-outline',
  '🧴': 'bottle-tonic-outline',
  '🌿': 'leaf',
  '💉': 'needle',
  '🩹': 'bandage',
};

/** סדר הבחירה בטופס התרופה. המפתח הוא מה שנשמר, האייקון הוא מה שנראה. */
export const MED_ICON_CHOICES: { key: string; icon: MCIcon }[] = Object.entries(MED_ICONS).map(
  ([key, icon]) => ({ key, icon }),
);

export const medIcon = (emoji?: string): MCIcon => (emoji && MED_ICONS[emoji]) || 'pill';
