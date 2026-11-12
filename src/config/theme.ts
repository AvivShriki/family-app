import { Platform, TextStyle } from 'react-native';

/**
 * Organic Parenthood 2.0 — מערכת העיצוב של האפליקציה.
 *
 * כל צבע, מרווח, רדיוס, צל וסגנון טקסט באפליקציה מגיע מכאן. מסך שמגדיר
 * לעצמו גודל פונט או צבע ישירות הוא חריגה, ולא תוספת.
 *
 * הפלטה אורגנית וחמימה: קרם, מרווה, מוס, טרקוטה ודבש. הוורוד והתכלת
 * של הגרסה הקודמת ירדו לגמרי — הם היו שפת "אפליקציית תינוקות", וזו
 * אפליקציית הורות.
 */

// ---------------------------------------------------------------------------
// צבעים
// ---------------------------------------------------------------------------
// שבעת הצבעים המחייבים, ולצידם גרסאות כהות לטקסט ולאייקונים. טרקוטה
// ודבש בגרסתם המקורית הם משטחים בלבד: 2.46 ו-1.8 מול לבן, כלומר בלתי
// קריאים כטקסט. לכל אחד יש כאן תאום כהה שעומד על 4.5 ומעלה.
export const colors = {
  // משטחים
  cream: '#F5F2E9', // Natural Cream — רקע ראשי
  creamDeep: '#EDE8DA', // שקע, שדה קלט, מצב נלחץ
  white: '#FFFFFF', // Pure White — כרטיסים

  // מותג
  sage: '#526B59', // Forest Sage — צבע הפעולה הראשי (5.82 מול לבן)
  sageDeep: '#3E5244', // מצב נלחץ, כותרות על משטח מרווה
  sageSoft: '#E9EEE8', // משטח רמז בגוון המותג

  moss: '#B9C9AE', // Soft Moss — רקעים משניים
  mossSoft: '#E6ECE0',

  terracotta: '#D99578', // Soft Terracotta — הדגשות ומשטחים
  terracottaDeep: '#B05A33', // אותו גוון, קריא כטקסט (4.82 מול לבן)
  terracottaSoft: '#F7E8E0',

  honey: '#E9C982', // Warm Honey — פעילויות מיוחדות
  honeyDeep: '#8A6A1F', // קריא כטקסט (5.04 מול לבן)
  honeySoft: '#FBF2DE',

  // טקסט — שלוש דרגות, כולן עומדות ב-AA על קרם ועל לבן
  text: '#34443B', // Deep Olive — כותרות וטקסט ראשי (9.2 מול קרם)
  textSecondary: '#4E5C50', // טקסט משני, תיאורים (6.3)
  textMuted: '#637062', // מטא, placeholders, תוויות (4.7)

  // מצבים פונקציונליים
  success: '#3F7A52',
  successSoft: '#E7F0E8',
  danger: '#B3382B',
  dangerSoft: '#F8EAE8',
  warning: '#8A6A1F',
  warningSoft: '#FBF2DE',

  // קווים וכיסויים
  border: '#E3DECF',
  borderStrong: '#CFC8B6',
  overlay: 'rgba(52, 68, 59, 0.42)',
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
// רדיוסים — כרטיסים בטווח 16–24 כפי שהוגדר בקונספט
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
// צללים — עדינים מאוד. הצל בגוון הזית ולא שחור, אחרת הוא מאפיר את הקרם.
// ---------------------------------------------------------------------------
export const shadow = {
  soft: {
    shadowColor: '#34443B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.055,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#34443B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
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
