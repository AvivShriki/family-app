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

// Clamp to the month's actual last day (e.g. birth day 31 in a 30-day month)
function monthAnniversary(year: number, monthIndex: number, day: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, daysInMonth));
}

// Age text like "בת 5 חודשים ו-12 ימים", shared by the baby screens
export function getAgeText(birthDate: string, ref = new Date()) {
  const birth = new Date(birthDate);
  let months = (ref.getFullYear() - birth.getFullYear()) * 12 + (ref.getMonth() - birth.getMonth());
  // If the birth day-of-month hasn't been reached yet this month, that month isn't complete
  if (ref.getDate() < birth.getDate()) months -= 1;

  const anniversary = monthAnniversary(ref.getFullYear(), ref.getMonth() - (ref.getDate() < birth.getDate() ? 1 : 0), birth.getDate());
  const days = Math.max(0, Math.round((ref.getTime() - anniversary.getTime()) / 86400000));
  return `בת ${months} חודשים ו-${days} ימים`;
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
