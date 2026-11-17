import type { BabyGender } from '../hooks/useBabyProfile';

/**
 * גוון האפליקציה, לפי מין התינוק/ת.
 *
 * רק שלושה ערכים משתנים — משטח פסטל, גוון ביניים, וצבע ההדגשה —
 * וכל שאר הפלטה (קרם, חום, גבולות) נשארת כפי שהיא. זה מה שהופך את
 * ההחלפה לכירורגית: 73 הפניות ב-28 קבצים, ולא 488.
 *
 * במכוון לא משתני CSS: הם היו פותרים את זה בלי לגעת בקוד, אבל
 * שוברים בנייה ל-iOS ו-Android — והאפליקציה מיועדת לחנויות.
 */
export interface Accent {
  /** רקע פסטל: עיגולי רישום, שבבים, מצב נבחר */
  soft: string;
  /** גוון ביניים: גבולות ומצבים מודגשים קלות */
  medium: string;
  /** צבע הפעולה: כפתור ראשי, לשונית פעילה, מספרים מודגשים */
  strong: string;
}

/**
 * ניגודיות נבדקה מול הרקעים שבהם הצבעים באמת מופיעים:
 * strong על לבן — ורוד 4.6:1, כחול 6.7:1; לבן על strong — אותו דבר;
 * והטקסט החום על soft — 8.9:1 בשניהם. כולם עוברים AA לטקסט רגיל.
 */
export const ACCENTS: Record<BabyGender, Accent> = {
  girl: { soft: '#FADADD', medium: '#F4A7B9', strong: '#C9456B' },
  boy: { soft: '#D6E6FA', medium: '#A7C4E8', strong: '#2A5E96' },
};

export const accentFor = (gender?: BabyGender): Accent => ACCENTS[gender ?? 'girl'];
