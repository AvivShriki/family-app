import { Platform, TextStyle } from 'react-native';

/**
 * מערכת העיצוב של האפליקציה.
 *
 * כל צבע, מרווח, רדיוס, צל וסגנון טקסט מגיע מכאן. מסך שמגדיר לעצמו
 * גודל פונט או צבע ישירות הוא חריגה, ולא תוספת.
 *
 * השפה: רקע חמים, משטחים לבנים מרחפים, ירוק עמוק כצבע המותג, וחמש
 * משפחות גוון פסטל — אפרסק, תכלת, ירוק בהיר, צהוב ולילך — שכל אחת
 * שייכת לסוג פעילות אחד. ככה אפשר לזהות פעילות לפי הגוון שלה בלי
 * לקרוא מילה.
 */

// ---------------------------------------------------------------------------
// צבעים
// ---------------------------------------------------------------------------
// לכל גוון פסטל יש כאן שלוש דרגות: הגוון עצמו (משטח מלא), גרסה רכה
// (רקע מדליון), וגרסה עמוקה שקריאה כטקסט. הפסטלים המקוריים הם
// משטחים בלבד — אפרסק הוא 2.05 מול לבן, כלומר בלתי קריא כטקסט.
export const colors = {
  // משטחים
  cream: '#FAF7F4', // רקע ראשי
  creamDeep: '#F1EBE5', // שקע, שדה קלט, מצב נלחץ
  white: '#FFFFFF',

  // מותג
  sage: '#557968', // הירוק המרכזי — כפתורים, טאב פעיל, כרטיס ההדגשה
  sageDeep: '#3F5C4C',
  sageSoft: '#E8F0EB',

  // ירוק בהיר
  moss: '#B8D3C5',
  mossSoft: '#E7F0EA',

  // אפרסק / קורל — האכלה
  terracotta: '#F2A18B',
  terracottaDeep: '#B35A3E',
  terracottaSoft: '#FDEEE9',

  // תכלת — שינה
  sky: '#C9DDEB',
  skyDeep: '#2F6C96',
  skySoft: '#EAF3F8',

  // לילך — הערות
  lilac: '#DCD2EA',
  lilacDeep: '#6B5A94',
  lilacSoft: '#F1EDF7',

  // צהוב עדין — תרופות
  honey: '#F4D99B',
  honeyDeep: '#8A6A1F',
  honeySoft: '#FDF4E2',

  // טקסט — שלוש דרגות, כולן עומדות ב-AA על הרקע ועל לבן
  text: '#263832', // 11.6 מול הרקע
  textSecondary: '#5C6661', // 5.6
  textMuted: '#697370', // 4.6

  /**
   * הגוון האפור-ירקרק מהפלטה. 3.26 מול הרקע, כלומר לא עומד בתקן
   * לטקסט רץ — ולכן הוא משמש לקווים, לאייקונים דקורטיביים ולמצבים
   * מושבתים בלבד, ואילו הטקסט המשני משתמש באותו גוון בדרגה כהה יותר.
   */
  tone: '#858B87',

  // מצבים פונקציונליים
  success: '#3F7A52',
  successSoft: '#E8F2EB',
  danger: '#B3382B',
  dangerSoft: '#FAECEA',
  warning: '#8A6A1F',
  warningSoft: '#FDF4E2',

  // קווים וכיסויים
  border: '#ECE6E0',
  borderStrong: '#D8D1C9',
  overlay: 'rgba(38, 56, 50, 0.45)',
} as const;

// ---------------------------------------------------------------------------
// מרווחים — סולם של 4
// ---------------------------------------------------------------------------
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ---------------------------------------------------------------------------
// רדיוסים
// ---------------------------------------------------------------------------
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  card: 20,
  lg: 24,
  sheet: 28,
  full: 999,
} as const;

// ---------------------------------------------------------------------------
// צללים — עדינים. הצל בגוון הטקסט ולא שחור, אחרת הוא מאפיר את הרקע החם.
// ---------------------------------------------------------------------------
export const shadow = {
  soft: {
    shadowColor: '#263832',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#263832',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// ---------------------------------------------------------------------------
// טיפוגרפיה
// ---------------------------------------------------------------------------
// Heebo היא הפונט העברי של המערכת. ברשת היא נטענת דרך utils/loadWebFont,
// ועל מסך נייטיב (שאין לנו כרגע) נופלים בשקט לפונט המערכת.
const FAMILY = Platform.OS === 'web' ? "'Heebo', 'Rubik', system-ui, sans-serif" : undefined;

export const font = {
  family: FAMILY,
  size: {
    caption: 11,
    small: 13,
    body: 15,
    bodyLg: 16,
    h3: 17,
    h2: 20,
    h1: 25,
    display: 30,
    metric: 26,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
} as const;

/**
 * סגנונות הטקסט המוכנים. היררכיה מוגדרת פעם אחת: כותרת, תיאור, נתון.
 * ברירת המחדל היא יישור לימין — האפליקציה כולה בעברית, וכל סגנון
 * שצריך מרכוז מוסיף זאת במקום להילחם בברירת מחדל שמאלית.
 */
const base = { fontFamily: FAMILY, textAlign: 'right' as const };

export const type = {
  display: {
    ...base,
    fontSize: font.size.display,
    lineHeight: 38,
    fontWeight: font.weight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  } as TextStyle,
  h1: {
    ...base,
    fontSize: font.size.h1,
    lineHeight: 33,
    fontWeight: font.weight.bold,
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,
  h2: {
    ...base,
    fontSize: font.size.h2,
    lineHeight: 27,
    fontWeight: font.weight.bold,
    color: colors.text,
  } as TextStyle,
  h3: {
    ...base,
    fontSize: font.size.h3,
    lineHeight: 23,
    fontWeight: font.weight.semibold,
    color: colors.text,
  } as TextStyle,
  body: {
    ...base,
    fontSize: font.size.body,
    lineHeight: 22,
    fontWeight: font.weight.regular,
    color: colors.textSecondary,
  } as TextStyle,
  bodyStrong: {
    ...base,
    fontSize: font.size.body,
    lineHeight: 22,
    fontWeight: font.weight.semibold,
    color: colors.text,
  } as TextStyle,
  small: {
    ...base,
    fontSize: font.size.small,
    lineHeight: 19,
    fontWeight: font.weight.regular,
    color: colors.textMuted,
  } as TextStyle,
  smallStrong: {
    ...base,
    fontSize: font.size.small,
    lineHeight: 19,
    fontWeight: font.weight.semibold,
    color: colors.text,
  } as TextStyle,
  /** תווית שדה או כותרת קטנה מעל תוכן */
  label: {
    ...base,
    fontSize: font.size.small,
    lineHeight: 18,
    fontWeight: font.weight.semibold,
    color: colors.textMuted,
  } as TextStyle,
  caption: {
    ...base,
    fontSize: font.size.caption,
    lineHeight: 15,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
  } as TextStyle,
  /** מספרים גדולים בכרטיסי נתונים */
  metric: {
    fontFamily: FAMILY,
    textAlign: 'center' as const,
    fontSize: font.size.metric,
    lineHeight: 30,
    fontWeight: font.weight.heavy,
    color: colors.text,
    letterSpacing: -0.5,
  } as TextStyle,
  /** טקסט בתוך כפתור */
  button: {
    fontFamily: FAMILY,
    textAlign: 'center' as const,
    fontSize: font.size.bodyLg,
    lineHeight: 22,
    fontWeight: font.weight.semibold,
  } as TextStyle,
} as const;

// ---------------------------------------------------------------------------
// תנועה — קצרה וטבעית. כל אנימציה מכבדת את הגדרת "צמצום תנועה" של
// מערכת ההפעלה דרך hooks/useReducedMotion.
// ---------------------------------------------------------------------------
export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

/** יעד המגע המינימלי. כל דבר שנלחץ חייב להגיע אליו. */
export const TOUCH = 44;

/**
 * רוחב התוכן המרבי.
 *
 * האפליקציה מיועדת לטלפון, אבל נפתחת גם בטאבלט ובדפדפן שולחני. בלי
 * תקרה, כרטיס נמתח לרוחב 1200 פיקסל ושורת טקסט אחת חוצה את כל המסך —
 * מה שהופך אותה לבלתי קריאה. התקרה שומרת על אותה פריסה, ממורכזת.
 */
export const CONTENT_MAX = 560;
