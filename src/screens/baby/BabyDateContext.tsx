import React, { createContext, useContext, useState } from 'react';

// One selected date shared by the whole baby section (journal + summary),
// so switching tabs keeps you on the day you were looking at.
interface BabyDateCtx {
  date: Date;
  setDate: (d: Date) => void;
}

const Ctx = createContext<BabyDateCtx>({ date: new Date(), setDate: () => {} });

export function BabyDateProvider({ children }: { children: React.ReactNode }) {
  const [date, setDate] = useState(new Date());
  return <Ctx.Provider value={{ date, setDate }}>{children}</Ctx.Provider>;
}

export const useBabyDate = () => useContext(Ctx);
