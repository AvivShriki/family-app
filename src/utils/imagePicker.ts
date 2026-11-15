/**
 * בחירת תמונת פרופיל: פותח את בורר הקבצים של הדפדפן, מקטין את התמונה
 * על קנבס, ומחזיר JPEG קומפקטי כ-data-URL (בערך 20 עד 40 קילובייט).
 * קטן מספיק כדי לחיות בתוך מסמך הפרופיל ב-Firestore (תקרה של מגה),
 * וכך מתקבל סנכרון בין מכשירים בלי להקים Firebase Storage.
 */

export type PickResult =
  | { status: 'ok'; dataUrl: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/**
 * ספארי באייפון מתעלמת מ-click על שדה קובץ שאינו נמצא בעץ המסמך,
 * ובמיוחד כשהאפליקציה מותקנת ורצה במסך מלא. השדה נוצר קודם, מוצמד
 * למסמך מוסתר, ורק אז נלחץ — ומוסר אחרי שהסתיים.
 */
function createHiddenInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  // לא display:none — ספארי מתעלמת גם משדה מוסתר לגמרי
  input.style.position = 'fixed';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  return input;
}

export function pickProfileImage(maxSize = 256): Promise<PickResult> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve({ status: 'error', message: 'בחירת תמונה נתמכת רק בדפדפן' });
      return;
    }

    const input = createHiddenInput();
    let settled = false;

    const finish = (result: PickResult) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(result);
    };

    // ביטול הבורר חייב לסגור את ההבטחה. בלי זה היא נשארת תלויה לנצח,
    // והמסך לא מגיב גם ללחיצה הבאה.
    input.oncancel = () => finish({ status: 'cancelled' });

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return finish({ status: 'cancelled' });

      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return finish({ status: 'error', message: 'הדפדפן לא הצליח לעבד את התמונה' });
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          // ספארי מחזירה לעיתים מחרוזת ריקה על תמונות ענק במקום לזרוק
          // שגיאה. בדיקת אורך היא הדרך היחידה לתפוס את זה.
          if (!dataUrl || dataUrl.length < 1000) {
            return finish({
              status: 'error',
              message: 'התמונה גדולה מדי לעיבוד. נסו תמונה קטנה יותר',
            });
          }
          finish({ status: 'ok', dataUrl });
        } catch {
          finish({ status: 'error', message: 'עיבוד התמונה נכשל. נסו תמונה אחרת' });
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      // קובץ שהדפדפן לא יודע לפענח — למשל HEIC מאייפון שנפתח
      // באנדרואיד — נופל לכאן. קודם זה פשוט לא עשה כלום.
      img.onerror = () => {
        URL.revokeObjectURL(url);
        finish({
          status: 'error',
          message: 'לא הצלחנו לקרוא את הקובץ הזה. נסו תמונה בפורמט JPG או PNG',
        });
      };

      img.src = url;
    };

    input.click();
  });
}
