import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDfV5c8sVv62kIIyk7fyzPZjNuZMpGkFW8',
  authDomain: 'family-app-aviv-noy.firebaseapp.com',
  projectId: 'family-app-aviv-noy',
  storageBucket: 'family-app-aviv-noy.firebasestorage.app',
  messagingSenderId: '1088328192594',
  appId: '1:1088328192594:web:c56a04edc9b6070a05858b',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * מטמון מקומי קבוע (IndexedDB) במקום ברירת המחדל שחיה בזיכרון בלבד.
 *
 * בלעדיו כל פתיחה של האפליקציה קוראת מחדש את כל רישומי התינוקת מהשרת —
 * 1,171 מסמכים ומטפס — ו-Firestore מחייב על כל מסמך. ככה נגמרה המכסה
 * היומית החינמית. עם המטמון, הפתיחה נענית מהדיסק והשרת שולח רק את מה
 * שהשתנה מאז, כך שהעלות בפתיחה חוזרת קרובה לאפס.
 *
 * persistentMultipleTabManager נחוץ כי זו אפליקציית ווב: בלעדיו לשונית
 * שנייה נכשלת בהפעלת המטמון וחוזרת לקרוא הכול מהשרת.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
