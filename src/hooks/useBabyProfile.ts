import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, deleteField } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useHousehold } from '../context/HouseholdContext';
import { DEMO_MODE } from '../config/demo';

export interface BabyProfile {
  name: string;
  birthDate: string; // 'YYYY-MM-DD'
  photoUrl?: string; // compact JPEG data-URL, stored inside the profile doc
}

// מוצג עד שהמסמך נטען, וגם למשפחה חדשה שעדיין לא מילאה את הפרטים —
// לכן ניטרלי, בלי שם או תאריך של משפחה מסוימת
export const DEFAULT_PROFILE: BabyProfile = { name: 'התינוקת', birthDate: '' };

// Age calculation lives in utils/dates (pure + unit-tested); re-exported here
// so existing imports keep working.
export { getAgeText } from '../utils/dates';

// Demo mode keeps the profile in memory, shared across screens
let demoProfile: BabyProfile = { ...DEFAULT_PROFILE };
const demoListeners = new Set<(p: BabyProfile) => void>();

const profileDoc = (householdId: string) =>
  doc(db, 'households', householdId, 'settings', 'babyProfile');

export function useBabyProfile() {
  const { householdId } = useHousehold();
  const [profile, setProfile] = useState<BabyProfile>(DEMO_MODE ? demoProfile : DEFAULT_PROFILE);
  // בדמו אין טעינה מרחוק — מתחילים לא-בטעינה במקום לעדכן state בתוך effect
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) {
      demoListeners.add(setProfile);
      return () => {
        demoListeners.delete(setProfile);
      };
    }

    // Firestore rules require auth — don't subscribe from the login screen
    if (!householdId) return;

    const unsub = onSnapshot(
      profileDoc(householdId),
      (snap) => {
        if (snap.exists())
          setProfile({ ...DEFAULT_PROFILE, ...(snap.data() as Partial<BabyProfile>) });
        setLoading(false);
      },
      (err) => {
        // Keep the defaults on failure so the baby screens still render
        console.error('Firestore error on "settings/babyProfile":', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [householdId]);

  const save = async (data: BabyProfile) => {
    if (DEMO_MODE) {
      demoProfile = { ...data };
      demoListeners.forEach((l) => l(demoProfile));
      return;
    }
    // Firestore rejects undefined values — removing the photo needs deleteField()
    const payload = {
      name: data.name,
      birthDate: data.birthDate,
      photoUrl: data.photoUrl ?? deleteField(),
    };
    if (!householdId) throw new Error('אין משק בית משויך למשתמש הזה');
    await setDoc(profileDoc(householdId), payload, { merge: true });
  };

  return { profile, loading, save };
}
