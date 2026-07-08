import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from './useCollection';

export interface BabyProfile {
  name: string;
  birthDate: string; // 'YYYY-MM-DD'
}

// Shown until the Firestore doc loads (or if it was never saved)
export const DEFAULT_PROFILE: BabyProfile = { name: 'ליבי', birthDate: '2026-01-30' };

// Age text like "בת 5 חודשים ו-12 ימים", shared by the baby screens
export function getAgeText(birthDate: string, ref = new Date()) {
  const birth = new Date(birthDate);
  const months =
    (ref.getFullYear() - birth.getFullYear()) * 12 +
    (ref.getMonth() - birth.getMonth());
  const days = Math.floor((ref.getTime() - birth.getTime()) / 86400000);
  return `בת ${months} חודשים ו-${days % 30} ימים`;
}

// Demo mode keeps the profile in memory, shared across screens
let demoProfile: BabyProfile = { ...DEFAULT_PROFILE };
const demoListeners = new Set<(p: BabyProfile) => void>();

const profileDoc = () => doc(db, 'settings', 'babyProfile');

export function useBabyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BabyProfile>(DEMO_MODE ? demoProfile : DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      demoListeners.add(setProfile);
      setLoading(false);
      return () => { demoListeners.delete(setProfile); };
    }

    // Firestore rules require auth — don't subscribe from the login screen
    if (!user) return;

    const unsub = onSnapshot(
      profileDoc(),
      (snap) => {
        if (snap.exists()) setProfile({ ...DEFAULT_PROFILE, ...(snap.data() as Partial<BabyProfile>) });
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
    await setDoc(profileDoc(), data, { merge: true });
  };

  return { profile, loading, save };
}
