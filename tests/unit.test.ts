// Unit tests for the app's pure logic. Run with: npm test
// (node's built-in test runner via tsx — no heavy jest setup needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAgeText, fmtDuration, isSameDay } from '../src/utils/dates';
import { categoryEmoji } from '../src/utils/productImage';

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

// ---- categoryEmoji ---------------------------------------------------------
test('categoryEmoji: specific match wins over general (תפוח אדמה)', () => {
  assert.equal(categoryEmoji('תפוח אדמה'), '🥔');
  assert.equal(categoryEmoji('תפוח'), '🍎');
});

test('categoryEmoji: unknown item falls back to cart', () => {
  assert.equal(categoryEmoji('מוצר שלא קיים בכלל'), '🛒');
});
