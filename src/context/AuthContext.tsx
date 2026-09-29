import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { DEMO_MODE } from '../config/demo';

// Fake user object used in demo mode
const DEMO_USER = { email: 'aviv@demo', uid: 'demo' } as unknown as User;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_MODE ? DEMO_USER : null);
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
