import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBabyLogs } from '../../context/BabyLogsContext';
import { useBabyProfile } from '../../hooks/useBabyProfile';
import { useMedications } from '../../context/MedicationsContext';
import { BabyLog } from '../../types';
import { activityMeta, medIcon } from '../../config/activity';
import { colors, spacing, radius, shadow, type, TOUCH, CONTENT_MAX } from '../../config/theme';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import ScreenHeader from '../../components/ScreenHeader';
import BlobBackdrop from '../../components/BlobBackdrop';
import ActivityIcon from '../../components/ActivityIcon';
import PressScale from '../../components/PressScale';
import { useBabyDate } from './BabyDateContext';
import { fmtTime, fmtDuration, isSameDay } from '../../utils/dates';

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

// הסוגים שמופיעים במקרא, בסדר שבו הם מעניינים הורה
const LEGEND: BabyLog['type'][] = ['feeding', 'sleep', 'diaper', 'medication', 'note'];

interface Props {
  onSelectDay: (date: Date) => void; // פתיחת היומן ליום הזה
}

export default function BabyCalendarScreen({ onSelectDay }: Props) {
  const { items: allLogs } = useBabyLogs();
  const { medications } = useMedications();
  const { profile } = useBabyProfile();
  const insets = useSafeAreaInsets();
  // היום הנבחר משותף עם היומן והסיכום
  const { date: selected, setDate: setSelected } = useBabyDate();
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // מפה: "שנה-חודש-יום" → הסוגים שתועדו בו
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

  const typesForDay = (y: number, m: number, d: number): string[] =>
    Array.from(logsByDay[`${y}-${m}-${d}`] ?? []).slice(0, 4); // עד ארבע נקודות

  const firstDow = new Date(year, month, 1).getDay(); // 0 = ראשון
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));
  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSelectedDay = (d: number) => isSameDay(new Date(year, month, d).getTime(), selected);
  const isFuture = (d: number) => new Date(year, month, d) > today;

  // ---- אירועי היום הנבחר, מתחת ללוח ----
  const dayLogs = useMemo(
    () => allLogs.filter((l) => isSameDay(l.timestamp, selected)),
    [allLogs, selected],
  );
  const dayFeedings = dayLogs.filter((l) => l.type === 'feeding').length;
  const dayDiapers = dayLogs.filter((l) => l.type === 'diaper').length;
  const daySleepMs = dayLogs
    .filter((l) => l.type === 'sleep' && l.endTimestamp)
    .reduce((s, l) => s + (l.endTimestamp! - l.timestamp), 0);

  const selectedIsInView = selected.getFullYear() === year && selected.getMonth() === month;

  return (
    <View style={styles.root}>
      <BlobBackdrop />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scroll, { paddingBottom: 108 + insets.bottom }]}
      >
        <ScreenHeader
          title="היומן של המשפחה"
          subtitle={`כל מה שתועד ל${profile.name}, יום אחרי יום`}
          icon="calendar-month-outline"
        />

        {/* ---- ניווט בין חודשים. אין מה לראות בעתיד, ולכן רק קדימה ננעל. ---- */}
        <View style={styles.monthBar}>
          <TouchableOpacity
            onPress={() => goMonth(1)}
            disabled={atCurrentMonth}
            style={styles.arrowBtn}
            accessibilityRole="button"
            accessibilityLabel="החודש הבא"
            accessibilityState={{ disabled: atCurrentMonth }}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={atCurrentMonth ? colors.border : colors.sage}
            />
          </TouchableOpacity>

          <View style={styles.monthTitleWrap}>
            <Text style={type.h2} numberOfLines={1}>
              {HE_MONTHS[month]} {year}
            </Text>
          </View>

          {/* חזרה לחודש הנוכחי אחרי גלישה אחורה */}
          {!atCurrentMonth ? (
            <TouchableOpacity
              style={styles.nowBtn}
              onPress={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              accessibilityRole="button"
              accessibilityLabel="חזרה לחודש הנוכחי"
            >
              <Text style={styles.nowText}>עכשיו</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => goMonth(-1)}
            style={styles.arrowBtn}
            accessibilityRole="button"
            accessibilityLabel="החודש הקודם"
          >
            <Ionicons name="chevron-forward" size={22} color={colors.sage} />
          </TouchableOpacity>
        </View>

        <Card style={styles.gridCard}>
          {/* row-reverse: יום ראשון בימין, כמו בכל לוח שנה עברי */}
          <View style={styles.dowRow}>
            {HE_DAYS.map((d) => (
              <Text key={d} style={[type.caption, styles.dowText]}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
              const types = typesForDay(year, month, day);
              const future = isFuture(day);
              const sel = isSelectedDay(day);
              const names = types.map((t) => activityMeta(t as BabyLog['type']).label).join(', ');
              return (
                <View key={day} style={styles.cell}>
                  <TouchableOpacity
                    style={[styles.day, isToday(day) && styles.dayToday, sel && styles.daySelected]}
                    onPress={() => !future && setSelected(new Date(year, month, day))}
                    disabled={future}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel, disabled: future }}
                    accessibilityLabel={
                      `${day} ב${HE_MONTHS[month]}` + (names ? `, תועדו: ${names}` : ', ללא תיעוד')
                    }
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        sel && styles.dayNumSelected,
                        future && styles.dayNumFuture,
                      ]}
                    >
                      {day}
                    </Text>
                    <View style={styles.dots}>
                      {types.map((t, di) => (
                        <View
                          key={di}
                          style={[
                            styles.dot,
                            {
                              backgroundColor: sel
                                ? colors.white
                                : activityMeta(t as BabyLog['type']).tint,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ---- מקרא: נקודה, אייקון ושם. לא צבע בלבד. ---- */}
        <View style={styles.legend}>
          {LEGEND.map((t) => {
            const meta = activityMeta(t);
            return (
              <View key={t} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: meta.tint }]} />
                <Text style={type.caption}>{meta.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ---- סיכום היום הנבחר ואירועיו ---- */}
        {selectedIsInView ? (
          <View style={styles.section}>
            <SectionHeader
              title={
                isSameDay(selected.getTime(), today)
                  ? 'היום'
                  : selected.toLocaleDateString('he-IL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
              }
              actionLabel="פתיחת היומן"
              onAction={() => onSelectDay(selected)}
            />

            {dayLogs.length === 0 ? (
              <Card flat>
                <Text style={[type.small, { textAlign: 'center' }]}>לא תועד כלום ביום הזה</Text>
              </Card>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <Mini label="ארוחות" value={String(dayFeedings)} type="feeding" />
                  <Mini
                    label="שינה"
                    value={daySleepMs > 0 ? fmtDuration(daySleepMs) : '—'}
                    type="sleep"
                  />
                  <Mini label="חיתולים" value={String(dayDiapers)} type="diaper" />
                </View>

                <Card flush style={{ marginTop: spacing.sm }}>
                  {dayLogs.map((log, i) => {
                    const base = activityMeta(log.type);
                    const medName = medications.find((m) => m.id === log.medicationId)?.name;
                    const medEmoji = medications.find((m) => m.id === log.medicationId)?.emoji;
                    return (
                      <PressScale
                        key={log.id}
                        to={0.995}
                        onPress={() => onSelectDay(selected)}
                        accessibilityRole="button"
                        accessibilityLabel={`${medName ?? base.label} ב-${fmtTime(log.timestamp)}. פתיחת היומן`}
                      >
                        <View style={[styles.eventRow, i > 0 && styles.eventDivider]}>
                          <ActivityIcon
                            icon={medName ? medIcon(medEmoji) : base.icon}
                            color={base.color}
                            surface={base.surface}
                            size={30}
                          />
                          <Text style={[type.body, { flex: 1 }]} numberOfLines={1}>
                            {medName ?? base.label}
                          </Text>
                          <Text style={styles.eventTime}>{fmtTime(log.timestamp)}</Text>
                        </View>
                      </PressScale>
                    );
                  })}
                </Card>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Mini({ label, value, type: t }: { label: string; value: string; type: BabyLog['type'] }) {
  const meta = activityMeta(t);
  return (
    <View style={styles.mini} accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.miniDot, { backgroundColor: meta.tint }]} />
      <Text style={[type.smallStrong, styles.miniValue]}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  container: { flex: 1 },
  scroll: {
    padding: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },

  monthBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  arrowBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  monthTitleWrap: { flex: 1, alignItems: 'center' },
  nowBtn: {
    minHeight: TOUCH - 12,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowText: { ...type.caption, color: colors.sage, fontWeight: '700' },

  gridCard: { padding: spacing.sm },
  dowRow: { flexDirection: 'row-reverse', marginBottom: spacing.xs },
  dowText: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.92, padding: 2 },
  day: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayToday: { backgroundColor: colors.sageSoft },
  daySelected: { backgroundColor: colors.sage },
  dayNum: { ...type.smallStrong, textAlign: 'center' },
  dayNumSelected: { color: colors.white },
  dayNumFuture: { color: colors.borderStrong },
  dots: { flexDirection: 'row', gap: 2, height: 5, alignItems: 'center' },
  dot: { width: 4.5, height: 4.5, borderRadius: 3 },

  legend: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  legendItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },

  section: { marginTop: spacing.lg },
  summaryRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  mini: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    ...shadow.soft,
  },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  miniValue: { textAlign: 'center' },

  eventRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: TOUCH,
  },
  eventDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  eventTime: { ...type.caption, fontVariant: ['tabular-nums'] },
});
