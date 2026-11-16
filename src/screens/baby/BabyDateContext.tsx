import React, { createContext, useCallback, useContext, useState } from 'react';
import { useBabyLogs } from '../../context/BabyLogsContext';

// תאריך אחד משותף לכל מדור התינוקת (יומן + סיכום), כדי שמעבר בין
// טאבים יישאר על היום שצפינו בו.
interface BabyDateCtx {
  date: Date;
  setDate: (d: Date) => void;
}

const Ctx = createContext<BabyDateCtx>({ date: new Date(), setDate: () => {} });

export function BabyDateProvider({ children }: { children: React.ReactNode }) {
  const [date, setDateState] = useState(new Date());
  const { ensureLoadedSince } = useBabyLogs();

  /**
   * כל מעבר תאריך מוודא קודם שהיום הזה בכלל נטען.
   *
   * הרישומים נטענים בחלון של שישים יום, ולכן חזרה רחוקה אחורה דורשת
   * להרחיב אותו. זה נעשה כאן ולא ב-effect בכוונה: ההרחבה היא תוצאה
   * ישירה של פעולת משתמש, והיא שייכת לאותו מקום שבו היא נגרמת.
   */
  const setDate = useCallback(
    (d: Date) => {
      ensureLoadedSince(d.getTime());
      setDateState(d);
    },
    [ensureLoadedSince],
  );

  return <Ctx.Provider value={{ date, setDate }}>{children}</Ctx.Provider>;
}

export const useBabyDate = () => useContext(Ctx);
