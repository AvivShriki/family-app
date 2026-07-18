// Shared date/time helpers for the baby screens. Pure functions — covered
// by the unit tests in tests/unit.test.ts.

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

// Duration in ms → "1:15 שעות" for an hour or more, otherwise "45 דק'"
export function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')} שעות` : `${m} דק'`;
}

export function isSameDay(ts: number, date: Date): boolean {
  const d = new Date(ts);
  return d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate();
}

// Clamp to the month's actual last day (e.g. birth day 31 in a 30-day month)
function monthAnniversary(year: number, monthIndex: number, day: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, daysInMonth));
}

// Age text like "בת 5 חודשים ו-12 ימים", shared by the baby screens
export function getAgeText(birthDate: string, ref = new Date()) {
  const birth = new Date(birthDate);
  let months = (ref.getFullYear() - birth.getFullYear()) * 12 + (ref.getMonth() - birth.getMonth());
  // If the birth day-of-month hasn't been reached yet this month, that month isn't complete
  if (ref.getDate() < birth.getDate()) months -= 1;

  const anniversary = monthAnniversary(ref.getFullYear(), ref.getMonth() - (ref.getDate() < birth.getDate() ? 1 : 0), birth.getDate());
  // floor, not round — mid-day must not count as an extra day
  const days = Math.max(0, Math.floor((ref.getTime() - anniversary.getTime()) / 86400000));
  return `בת ${months} חודשים ו-${days} ימים`;
}
