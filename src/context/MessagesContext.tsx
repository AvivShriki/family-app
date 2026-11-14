import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useHousehold } from './HouseholdContext';
import { DEMO_MODE } from '../config/demo';
import { FamilyMessage } from '../types';

/**
 * הצ'אט המשפחתי. ההודעות חיות תחת households/{hid}/messages, ולכן
 * חוקי האבטחה הקיימים כבר מכסים אותן — רק חברי אותה משפחה רואים אותן.
 *
 * המנוי מוגבל ל-50 ההודעות האחרונות בכוונה. זה מה שהיינו צריכים לעשות
 * מלכתחילה גם לתיעוד התינוקת, שטעינת כל ההיסטוריה שלו הפילה את
 * האפליקציה כשנגמרה מכסת הקריאות.
 */
const WINDOW = 50;

interface MessagesValue {
  messages: FamilyMessage[];
  loading: boolean;
  send: (text: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesValue>({
  messages: [],
  loading: true,
  send: async () => {},
});

let demoMessages: FamilyMessage[] = [];

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const [messages, setMessages] = useState<FamilyMessage[]>(DEMO_MODE ? demoMessages : []);
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE || !householdId) return;
    const q = query(
      collection(db, 'households', householdId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(WINDOW),
    );
    return onSnapshot(
      q,
      (snap) => {
        // המנוי יורד כדי לקחת את האחרונות; התצוגה עולה, כמו בכל צ'אט
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FamilyMessage).reverse());
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error on "messages":', err);
        setLoading(false);
      },
    );
  }, [householdId]);

  const send = async (text: string) => {
    const body = text.trim();
    if (!body || !user) return;
    const message = {
      text: body,
      senderUid: user.uid,
      senderEmail: user.email ?? '',
      createdAt: Date.now(),
    };
    if (DEMO_MODE) {
      demoMessages = [...demoMessages, { id: String(Date.now()), ...message }];
      setMessages(demoMessages);
      return;
    }
    if (!householdId) return;
    await addDoc(collection(db, 'households', householdId, 'messages'), message);
  };

  return (
    <MessagesContext.Provider value={{ messages, loading, send }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => useContext(MessagesContext);
