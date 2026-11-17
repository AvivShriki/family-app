import React, { createContext, useContext } from 'react';
import { useBabyProfile, BabyProfile, DEFAULT_PROFILE } from '../hooks/useBabyProfile';
import { accentFor, Accent } from '../config/accent';
import { wordsFor, GenderWords } from '../utils/gender';

/**
 * פרופיל התינוק/ת, ומה שנגזר ממנו: גוון האפליקציה ולשון הטקסטים.
 *
 * הסיבה שזה ספק ולא hook שכל אחד קורא לו: useBabyProfile פותח
 * onSnapshot משלו בכל קריאה, ותשעה מסכים כבר קראו לו — כלומר תשעה
 * מנויים על אותו מסמך בכל פתיחה של האפליקציה. זה אותו דפוס שהפיל
 * את מכסת הקריאות בעבר. כאן יש מנוי אחד, וכולם קוראים ממנו.
 */
interface ProfileValue {
  profile: BabyProfile;
  loading: boolean;
  save: (data: BabyProfile) => Promise<void>;
  accent: Accent;
  words: GenderWords;
}

const Ctx = createContext<ProfileValue>({
  profile: DEFAULT_PROFILE,
  loading: true,
  save: async () => {},
  accent: accentFor(),
  words: wordsFor(),
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading, save } = useBabyProfile();
  return (
    <Ctx.Provider
      value={{
        profile,
        loading,
        save,
        accent: accentFor(profile.gender),
        words: wordsFor(profile.gender),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useProfile = () => useContext(Ctx);
/** גוון האפליקציה לפי מין. לשימוש כסגנון inline מעל סגנון סטטי. */
export const useAccent = () => useContext(Ctx).accent;
/** הטקסטים שמשתנים לפי מין */
export const useWords = () => useContext(Ctx).words;
