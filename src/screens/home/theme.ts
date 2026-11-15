import { Platform, TextStyle } from 'react-native';

/**
 * מערכת העיצוב של מסך הבית בלבד.
 *
 * היא יושבת כאן ולא ב-config/theme.ts בכוונה: הקובץ ההוא משותף לכל
 * המסכים, וכל שינוי בו היה מחלחל ליומן, ללוח ולהגדרות. כאן אפשר
 * לעצב בחופשיות בלי לגעת בשום מסך אחר.
 */

// ---------------------------------------------------------------------------
// צבעים
// ---------------------------------------------------------------------------
export const c = {
  bg: '#FFF8F1',
  /** שכבה שנייה של הרקע, לשקעים ולמצבי טעינה */
  bgDeep: '#F6EDE4',
  white: '#FFFFFF',

  /**
   * הוורוד של המותג. 4.18 מול לבן — מספיק לאייקונים, לכותרות גדולות
   * ולמשטחים, אבל לא לטקסט לבן על מילוי. לכן לכל כפתור מלא יש את
   * roseDeep, שהוא אותו גוון במדויק רק כהה ב-5 אחוז, ועומד על 5.38.
   */
  rose: '#C64D70',
  roseDeep: '#B5406A',
  roseSoft: '#F8DFE5',

  lavender: '#DCD5FA',
  lavenderDeep: '#5F4FA3',

  blue: '#DCEEFF',
  blueDeep: '#2E6A96',

  green: '#DDEFE0',
  greenDeep: '#3E7A54',

  // טקסט — שלוש דרגות, כולן עומדות ב-AA על רקע הקרם
  text: '#49372F', // 10.7
  textSoft: '#6B5C53', // 6.1
  textMuted: '#7F6F64', // 4.6

  border: 'rgba(73, 55, 47, 0.08)',
  hairline: 'rgba(73, 55, 47, 0.06)',
  /** משטח "זכוכית" — לבן שקוף למחצה מעל כתמי הצבע שברקע */
  glass: 'rgba(255, 255, 255, 0.72)',
  glassEdge: 'rgba(255, 255, 255, 0.9)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const r = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

// צללים רכים מאוד — העומק מגיע מהרדיוס ומהמרווח, לא מהכהות
export const shadow = {
  card: {
    shadowColor: '#49372F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  lift: {
    shadowColor: '#49372F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// ---------------------------------------------------------------------------
// טיפוגרפיה
// ---------------------------------------------------------------------------
// Heebo נטענת מהמסך הזה בלבד (ראו useHebrewFont). שאר המסכים ממשיכים
// עם פונט המערכת, כי ההנחיה הייתה לא לגעת בהם.
export const family =
  Platform.OS === 'web' ? "'Heebo', 'Assistant', system-ui, sans-serif" : undefined;

const base = { fontFamily: family, textAlign: 'right' as const, color: c.text };

export const t = {
  hero: { ...base, fontSize: 27, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { ...base, fontSize: 19, lineHeight: 26, fontWeight: '700' as const },
  cardTitle: { ...base, fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  body: { ...base, fontSize: 14, lineHeight: 20, fontWeight: '400' as const, color: c.textSoft },
  label: { ...base, fontSize: 12, lineHeight: 17, fontWeight: '600' as const, color: c.textMuted },
  caption: {
    ...base,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
    color: c.textMuted,
  },
  metric: {
    fontFamily: family,
    textAlign: 'center' as const,
    color: c.text,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  } as TextStyle,
} as const;

/** יעד המגע המינימלי */
export const TOUCH = 44;
/** רוחב התוכן המרבי — בדפדפן שולחני כרטיס לא נמתח מקצה לקצה */
export const MAX_W = 560;
