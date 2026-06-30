# הגדרת Firebase לאפליקציה המשפחתית

## שלב 1 — יצירת פרויקט Firebase

1. כנס ל-https://console.firebase.google.com
2. לחץ "Add project" → תן שם (למשל: `family-app-aviv-noy`)
3. השבת Google Analytics (לא צריך)
4. המתן שהפרויקט ייוצר

## שלב 2 — הגדרת Authentication

1. בתפריט השמאלי → Build → Authentication
2. לחץ "Get started"
3. בכרטיסיית "Sign-in method" → הפעל **Email/Password**
4. לחץ "Save"
5. עבור ל"Users" → "Add user":
   - הוסף משתמש לאביב (האימייל וסיסמה שלך)
   - הוסף משתמש לנוי (האימייל וסיסמה שלה)

## שלב 3 — הגדרת Firestore

1. בתפריט → Build → Firestore Database
2. לחץ "Create database"
3. בחר **"Start in test mode"** (מאפשר גישה ל-30 יום, נשנה אחר כך)
4. בחר את האזור הקרוב ביותר (europe-west1 מומלץ לישראל)

## שלב 4 — קבלת הקונפיגורציה

1. בתפריט → Project Settings (גלגל השיניים)
2. מטה עד "Your apps" → לחץ על אייקון **</>** (Web app)
3. שם האפליקציה: `family-app-web`
4. אל תסמן Firebase Hosting
5. לחץ "Register app"
6. תראה אובייקט firebaseConfig עם כל הערכים

## שלב 5 — עדכון הקוד

פתח את הקובץ `src/config/firebase.ts` והחלף את הערכים:

```typescript
const firebaseConfig = {
  apiKey: "הכנס-כאן",
  authDomain: "הכנס-כאן",
  projectId: "הכנס-כאן",
  storageBucket: "הכנס-כאן",
  messagingSenderId: "הכנס-כאן",
  appId: "הכנס-כאן",
};
```

## שלב 6 — הרצת האפליקציה

```bash
cd /Users/avivshriki/Projects/family-app
npx expo start
```

סרוק את ה-QR code עם אפליקציית **Expo Go** בטלפון.

## Firestore Rules (לאחר בדיקה ראשונית)

כדי לאבטח את הנתונים, עדכן את החוקים ב-Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

זה מגביל גישה למשתמשים מחוברים בלבד (אביב ונוי).
