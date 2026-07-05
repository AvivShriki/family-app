import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDfV5c8sVv62kIIyk7fyzPZjNuZMpGkFW8",
  authDomain: "family-app-aviv-noy.firebaseapp.com",
  projectId: "family-app-aviv-noy",
  storageBucket: "family-app-aviv-noy.firebasestorage.app",
  messagingSenderId: "1088328192594",
  appId: "1:1088328192594:web:c56a04edc9b6070a05858b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
