import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { DEMO_MODE } from '../config/demo';

/**
 * משק בית = תא נתונים מבודד של משפחה אחת.
 * כל הנתונים (תיעוד התינוקת והפרופיל שלה) חיים תחת
 * households/{householdId}, והשיוך נשמר במסמך users/{uid}.
 *
 * המפתח הוא מזהה המשתמש ולא האימייל: אימייל אפשר לכתוב בכמה צורות
 * שמגיעות לאותה תיבה (ב-Gmail נקודות נבלעות), ומזהה המשתמש יציב,
 * ייחודי, ולא ניתן לזיוף — וזה מה שההרשמה העצמית תישען עליו.
 */
interface HouseholdContextType {
  householdId: string | null;
  loading: boolean;
  /** 'missing' = המשתמש מחובר אך לא משויך למשק בית; אחרת הודעת שגיאה מ-Firestore */
  error: 'missing' | string | null;
}

const HouseholdContext = createContext<HouseholdContextType>({
  householdId: null,
  loading: true,
  error: null,
});

const DEMO_HOUSEHOLD = 'demo';

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(
    DEMO_MODE ? DEMO_HOUSEHOLD : null,
  );
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [error, setError] = useState<HouseholdContextType['error']>(null);

  useEffect(() => {
    if (DEMO_MODE) return;

    if (!user) {
      setHouseholdId(null);
      setLoading(false);
      setError(null);
      return;
    }

    // השיוך נקרא פעם אחת בכניסה — הוא כמעט לעולם לא משתנה, ומנוי חי עליו
    // היה עולה קריאות מיותרות מהמכסה החינמית.
    let cancelled = false;
    setLoading(true);
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (cancelled) return;
        const id = snap.exists() ? (snap.data().householdId as string | undefined) : undefined;
        setHouseholdId(id ?? null);
        setError(id ? null : 'missing');
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Household lookup failed:', err);
        setHouseholdId(null);
        setError(err.message ?? 'lookup-failed');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <HouseholdContext.Provider value={{ householdId, loading, error }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export const useHousehold = () => useContext(HouseholdContext);
