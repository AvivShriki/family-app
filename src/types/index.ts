export interface BabyLog {
  id: string;
  // 'vitamin' ו-'iron' הם המבנה הישן. הרישומים ההיסטוריים הומרו
  // ל-'medication', והם נשארים כאן רק כדי שרישום חריג שנכתב מגרסה
  // ישנה עדיין יוצג ולא ייעלם מהיומן.
  type: 'feeding' | 'sleep' | 'diaper' | 'note' | 'medication' | 'vitamin' | 'iron';
  timestamp: number; // start time (ms)
  endTimestamp?: number; // sleep end time (ms)
  details?: string;
  // feeding
  amountMl?: number;
  // sleep — duration derived from endTimestamp - timestamp
  // diaper
  diaperType?: 'wet' | 'dirty' | 'both';
  // medication
  medicationId?: string;
  loggedBy: string;
}

export interface FamilyMessage {
  id: string;
  text: string;
  senderUid: string;
  senderEmail: string;
  createdAt: number;
}

/**
 * תרופה או תוסף שהמשפחה הגדירה לעצמה.
 * מחליף את "ויטמין D" ו"ברזל" שהיו כתובים קשיח — כל משפחה והצרכים שלה.
 */
export interface Medication {
  id: string;
  name: string;
  emoji: string;
  dose?: string; // "0.5 מ\"ל", "טיפה אחת"
  /** שעות קבועות ביום. נשמרות ומוצגות; ההתראה עצמה עוד לא קיימת. */
  times?: string[];
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD', ריק = ללא סיום
  active: boolean;
  createdAt: number;
}
