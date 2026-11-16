import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { DEMO_MODE } from '../config/demo';
import { sendVerificationEmail } from '../services/verificationEmail';

// Fake user object used in demo mode
const DEMO_USER = { email: 'aviv@demo', uid: 'demo' } as unknown as User;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** האם הכתובת אומתה. במצב דמו תמיד אמת, אחרת הדמו היה נחסם. */
  emailVerified: boolean;
  /** שולח שוב את מייל האימות לכתובת של המשתמש המחובר */
  resendVerification: () => Promise<void>;
  /**
   * מושך מחדש את מצב החשבון מהשרת ומחזיר אם הוא אומת.
   *
   * Firebase לא מעדכן את emailVerified מעצמו — הוא נקבע ברגע
   * ההתחברות ונשאר. בלי רענון מפורש, מי שלחץ על הקישור במייל היה
   * רואה את מסך החסימה גם אחרי שאימת.
   */
  refreshVerification: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  /** יוצר חשבון ומחזיר את המזהה שלו — הוא גם המזהה של המשפחה החדשה */
  signUp: (email: string, password: string) => Promise<string>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** אימות מחדש עם הסיסמה. Firebase דורש התחברות טרייה לפני מחיקה. */
  reauthenticate: (password: string) => Promise<void>;
  /**
   * מוחק את חשבון ההתחברות.
   *
   * נקרא אחרון, אחרי שהנתונים ב-Firestore כבר נוקו: אם סדר הפעולות
   * מתהפך, המשתמש מאבד את ההרשאה לנקות ומשאיר נתונים יתומים.
   */
  deleteAuthAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_MODE ? DEMO_USER : null);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [emailVerified, setEmailVerified] = useState(DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setEmailVerified(!!u?.emailVerified);
      setLoading(false);
    });
    return unsub;
  }, []);

  const resendVerification = async () => {
    if (DEMO_MODE) return;
    const current = auth.currentUser;
    if (!current) throw new Error('auth/no-user');
    await sendVerificationEmail(current);
  };

  const refreshVerification = async (): Promise<boolean> => {
    if (DEMO_MODE) {
      setEmailVerified(true);
      return true;
    }
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    const verified = !!auth.currentUser?.emailVerified;
    // רענון כפוי של הטוקן. חוקי Firestore קוראים את email_verified
    // מתוך הטוקן ולא מהחשבון, והטוקן הקיים עדיין נושא את הערך הישן —
    // בלי השורה הזו מי שאימת היה עובר את המסך ונחסם על ידי החוקים,
    // עד שעה, בלי שום הסבר.
    if (verified) await current.getIdToken(true);
    setEmailVerified(verified);
    return verified;
  };

  const login = async (email: string, password: string) => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string): Promise<string> => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      return DEMO_USER.uid;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // המייל נשלח ברקע ואינו עוצר את ההרשמה: החשבון כבר נוצר, ואין
    // טעם להפיל את התהליך כי השליחה נכשלה. מי שלא קיבל אותו מגיע
    // למסך האישור וממנו יש כפתור שליחה חוזרת.
    //
    // האימות עצמו כן חוסם מכאן והלאה — גם במסך וגם בחוקי Firestore.
    sendVerificationEmail(cred.user).catch((e) => console.error('שליחת מייל האימות נכשלה:', e));
    return cred.user.uid;
  };

  const resetPassword = async (email: string) => {
    if (DEMO_MODE) return;
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    if (DEMO_MODE) {
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  // Firebase דורש התחברות טרייה לפני החלפת סיסמה. אימות מחדש עם הסיסמה
  // הנוכחית עונה על הדרישה, וגם מוודא שמי שמחליף הוא בעל החשבון.
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (DEMO_MODE) return;
    const current = auth.currentUser;
    if (!current?.email) throw new Error('auth/no-user');
    const credential = EmailAuthProvider.credential(current.email, currentPassword);
    await reauthenticateWithCredential(current, credential);
    await updatePassword(current, newPassword);
  };

  const reauthenticate = async (password: string) => {
    if (DEMO_MODE) return;
    const current = auth.currentUser;
    if (!current?.email) throw new Error('auth/no-user');
    const credential = EmailAuthProvider.credential(current.email, password);
    await reauthenticateWithCredential(current, credential);
  };

  const deleteAuthAccount = async () => {
    if (DEMO_MODE) {
      setUser(null);
      return;
    }
    const current = auth.currentUser;
    if (!current) throw new Error('auth/no-user');
    await deleteUser(current);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        emailVerified,
        resendVerification,
        refreshVerification,
        login,
        signUp,
        resetPassword,
        logout,
        changePassword,
        reauthenticate,
        deleteAuthAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
