import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, deleteField } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from './useCollection';

export interface BabyProfile {
  name: string;
  birthDate: string; // 'YYYY-MM-DD'
  photoUrl?: string; // compact JPEG data-URL, stored inside the profile doc
}

// Shown until the Firestore doc loads (or if it was never saved)
export const DEFAULT_PROFILE: BabyProfile = { name: 'ליבי', birthDate: '2026-01-30' };

// Age calculation lives in utils/dates (pure + unit-tested); re-exported here
// so existing imports keep working.
export { getAgeText } from '../utils/dates';

// Demo mode keeps the profile in memory, shared across screens
let demoProfile: BabyProfile = { ...DEFAULT_PROFILE };
const demoListeners = new Set<(p: BabyProfile) => void>();

const profileDoc = () => doc(db, 'settings', 'babyProfile');

export function useBabyProfile() {
  const { user } = useAuth();
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
    if (!user) return;

    const unsub = onSnapshot(
      profileDoc(),
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
  }, [user]);

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
    await setDoc(profileDoc(), payload, { merge: true });
  };

  return { profile, loading, save };
}
