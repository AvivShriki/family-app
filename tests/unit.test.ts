// Unit tests for the app's pure logic. Run with: npm test
// (node's built-in test runner via tsx — no heavy jest setup needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAgeText, fmtDuration, isSameDay } from '../src/utils/dates';
import { windowStart, extendedWindow, startOfDay } from '../src/utils/logWindow';

// ---- getAgeText ------------------------------------------------------------
// The bug this guards against: month count must respect day-of-month.
// Born Jan 25 → on Jul 11 she is 5 months (not 6) and 16 days.
test('getAgeText: month not counted before day-of-month anniversary', () => {
  assert.equal(getAgeText('2026-01-25', new Date(2026, 6, 11)), 'בת 5 חודשים ו-16 ימים');
});

test('getAgeText: exactly on the monthly anniversary', () => {
  assert.equal(getAgeText('2026-01-30', new Date(2026, 6, 30)), 'בת 6 חודשים ו-0 ימים');
});

test('getAgeText: day after the monthly anniversary', () => {
  assert.equal(getAgeText('2026-01-30', new Date(2026, 6, 31)), 'בת 6 חודשים ו-1 ימים');
});

test('getAgeText: time of day must not add a day (18:00 still counts as same day)', () => {
  assert.equal(getAgeText('2026-01-30', new Date(2026, 6, 18, 18, 30)), 'בת 5 חודשים ו-18 ימים');
});

test('getAgeText: birth day 30 in a month without a 30th clamps (Feb)', () => {
  // Born Jan 30; on Mar 1 the "Feb 30" anniversary clamps to Feb 28
  assert.equal(getAgeText('2026-01-30', new Date(2026, 2, 1)), 'בת 1 חודשים ו-1 ימים');
});

test('getAgeText: no birth date yet (new family) instead of NaN', () => {
  assert.equal(getAgeText(''), 'תאריך לידה טרם הוגדר');
});

// מור מצאה "בת -4 חודשים" אחרי בחירת תאריך עתידי בטעות
test('getAgeText: a future birth date is a typo, not a negative age', () => {
  assert.equal(getAgeText('2027-01-01', new Date(2026, 10, 3)), 'תאריך הלידה עוד לא הגיע');
});

// ---- fmtDuration -----------------------------------------------------------
test('fmtDuration: under an hour uses minutes', () => {
  assert.equal(fmtDuration(45 * 60000), "45 דק'");
});

test('fmtDuration: an hour and a quarter', () => {
  assert.equal(fmtDuration(75 * 60000), '1:15 שעות');
});

test('fmtDuration: minutes are zero-padded', () => {
  assert.equal(fmtDuration(125 * 60000), '2:05 שעות');
});

// ---- isSameDay -------------------------------------------------------------
test('isSameDay: same calendar day, different hours', () => {
  const day = new Date(2026, 6, 11);
  assert.equal(isSameDay(new Date(2026, 6, 11, 23, 59).getTime(), day), true);
});

test('isSameDay: adjacent days are different', () => {
  const day = new Date(2026, 6, 11);
  assert.equal(isSameDay(new Date(2026, 6, 12, 0, 1).getTime(), day), false);
});


// ---- חלון טעינת הרישומים ----------------------------------------------
// הבאג שהבדיקות האלה שומרות מפניו: טעינת כל ההיסטוריה בכל פתיחה, שהעלתה
// את מחיר הפתיחה ככל שהמשפחה מתעדת יותר — עד שהמכסה היומית נגמרה.
const DAY = 86400000;
const daysBetween = (a: number, b: number) => Math.round((a - b) / DAY);

test('startOfDay: מאפס את השעה', () => {
  const end = new Date(2026, 10, 16, 23, 59, 59, 999).getTime();
  assert.equal(startOfDay(end), new Date(2026, 10, 16).getTime());
});

test('windowStart: חצות, בדיוק שישים יום אחורה', () => {
  const now = new Date(2026, 10, 16, 14, 30).getTime();
  const start = windowStart(now);
  assert.equal(new Date(start).getHours(), 0);
  assert.equal(daysBetween(startOfDay(now), start), 60);
});

test('extendedWindow: תאריך שכבר בתוך החלון לא משנה דבר', () => {
  const cur = windowStart(new Date(2026, 10, 16).getTime());
  const inside = new Date(2026, 10, 1).getTime();
  assert.equal(extendedWindow(cur, inside), cur);
});

test('extendedWindow: חזרה אל מעבר לקצה מרחיבה בצעד שלם', () => {
  const cur = new Date(2026, 8, 17).getTime();
  const needed = new Date(2026, 8, 10, 9, 0).getTime();
  const next = extendedWindow(cur, needed, 60);
  assert.ok(next < cur);
  assert.equal(daysBetween(startOfDay(needed), next), 60);
});

// בלי זה, חזרה קדימה בתאריך הייתה מכווצת את החלון ומוחקת נתונים
// שכבר שילמנו עליהם בקריאות
test('extendedWindow: החלון לעולם לא מצטמצם', () => {
  const cur = new Date(2026, 8, 17).getTime();
  const future = new Date(2026, 11, 1).getTime();
  assert.equal(extendedWindow(cur, future), cur);
});

test('extendedWindow: התוצאה תמיד נופלת על חצות', () => {
  const cur = new Date(2026, 8, 17).getTime();
  const next = extendedWindow(cur, new Date(2026, 7, 3, 23, 59).getTime());
  assert.equal(new Date(next).getHours(), 0);
});
