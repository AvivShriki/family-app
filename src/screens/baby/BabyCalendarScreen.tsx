import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useBabyLogs } from '../../context/BabyLogsContext';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import BabyAvatar from '../../components/BabyAvatar';
import { BabyLog } from '../../types';
import { colors, spacing, radius, shadow } from '../../config/theme';

// Dot color per log type
const DOT_COLOR: Record<string, string> = {
  feeding: '#F4A7B9',
  sleep: '#90CAF9',
  diaper: '#FFD54F',
  medication: '#FFF176',
  note: '#A5D6A7',
};

const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const HE_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

interface Props {
  onSelectDay: (date: Date) => void; // navigate to journal for this day
}

export default function BabyCalendarScreen({ onSelectDay }: Props) {
  const { items: allLogs } = useBabyLogs();
  const { profile } = useBabyProfile();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Map: "YYYY-MM-DD" → set of log types that occurred
  const logsByDay = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    allLogs.forEach((l) => {
      const d = new Date(l.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = new Set();
      map[key].add(l.type);
    });
    return map;
  }, [allLogs]);

  const dotsForDay = (y: number, m: number, d: number): string[] => {
    const types = logsByDay[`${y}-${m}-${d}`];
    if (!types) return [];
    return Array.from(types).slice(0, 4); // max 4 dots
  };

  // Build calendar grid
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // We render Sun–Sat (0–6), but the header shows א–ש RTL style
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isFuture = (d: number) => new Date(year, month, d) > today;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* ניווט בין חודשים. אין מה לראות בעתיד, ולכן רק החץ קדימה ננעל
          בחודש הנוכחי — אחורה תמיד פתוח, עד תחילת התיעוד. */}
      <View style={styles.monthBar}>
        <TouchableOpacity
          onPress={() => goMonth(1)}
          disabled={atCurrentMonth}
          style={styles.arrowBtn}
          accessibilityLabel="החודש הבא"
        >
          <Text style={[styles.arrow, atCurrentMonth && styles.arrowDisabled]}>‹</Text>
        </TouchableOpacity>

        {/* לחיצה על הכותרת חוזרת לחודש הנוכחי אחרי גלישה אחורה */}
        <TouchableOpacity onPress={() => goToday()} disabled={atCurrentMonth}>
          <Text style={styles.monthTitle}>
            {HE_MONTHS[month]} {year}
          </Text>
          {!atCurrentMonth ? <Text style={styles.backToToday}>חזרה לחודש הנוכחי</Text> : null}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => goMonth(-1)}
          style={styles.arrowBtn}
          accessibilityLabel="החודש הקודם"
        >
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week header */}
      <View style={styles.dowRow}>
        {HE_DAYS.map((d) => (
          <Text key={d} style={styles.dowText}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
          const dots = dotsForDay(year, month, day);
          const future = isFuture(day);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.cell, isToday(day) && styles.todayCell]}
              onPress={() => !future && onSelectDay(new Date(year, month, day))}
              disabled={future}
            >
              <Text
                style={[styles.dayNum, isToday(day) && styles.todayNum, future && styles.futureNum]}
              >
                {day}
              </Text>
              <View style={styles.dotsRow}>
                {dots.map((type, di) => (
                  <View
                    key={di}
                    style={[styles.dot, { backgroundColor: DOT_COLOR[type] ?? '#ccc' }]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dot legend */}
      <View style={styles.legend}>
        {Object.entries(DOT_COLOR).map(([type, color]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>
              {
                {
                  feeding: 'ארוחות',
                  sleep: 'שינה',
                  diaper: 'חיתול',
                  medication: 'תרופה',
                  note: 'הערה',
                }[type]
              }
            </Text>
          </View>
        ))}
      </View>

      {/* Baby card */}
      <View style={styles.babyCard}>
        <BabyAvatar size={52} />
        <View>
          {/* בלי השם — הוא כבר בכותרת המסך */}
          <Text style={styles.babyAge}>{getAgeText(profile.birthDate, today)}</Text>
          <Text style={styles.babyDate}>
            {today.toLocaleDateString('he-IL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: spacing.md, paddingBottom: 40 },

  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  arrowBtn: { padding: spacing.sm },
  arrow: { fontSize: 28, color: colors.pinkAccent, fontWeight: '300' },
  arrowDisabled: { color: colors.border },
  monthTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  backToToday: {
    fontSize: 11,
    color: colors.pinkAccent,
    textAlign: 'center',
    marginTop: 2,
  },

  dowRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dowText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  todayCell: {
    backgroundColor: colors.pinkAccent,
    borderRadius: radius.md,
  },
  dayNum: { fontSize: 14, fontWeight: '500', color: colors.text },
  todayNum: { color: colors.white, fontWeight: '700' },
  futureNum: { color: '#9A8070' }, // היה colors.border — 1.23, בלתי קריא
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: 3 },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.textLight },

  babyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.pink,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  babyEmoji: { fontSize: 44 },
  babyAge: { fontSize: 13, color: colors.text, marginTop: 2 },
  babyDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
