import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBabyLogs } from '../../context/BabyLogsContext';
import { useMedications } from '../../context/MedicationsContext';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import { useNow } from '../../hooks/useNow';
import { BabyLog } from '../../types';
import { activityMeta, medIcon } from '../../config/activity';
import { colors, spacing, radius, shadow, type, TOUCH, CONTENT_MAX } from '../../config/theme';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import SectionHeader from '../../components/SectionHeader';
import Segmented from '../../components/Segmented';
import ActivityIcon from '../../components/ActivityIcon';
import BarChart, { Bar } from '../../components/BarChart';
import TrendLine, { Point } from '../../components/TrendLine';
import DonutRing from '../../components/DonutRing';
import ScreenHeader from '../../components/ScreenHeader';
import BlobBackdrop from '../../components/BlobBackdrop';
import EmptyState from '../../components/EmptyState';
import { useBabyDate } from './BabyDateContext';
import { fmtTime, fmtDuration, isSameDay } from '../../utils/dates';

type Range = 'day' | 'week' | 'month';

const HE_DOW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
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

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const DAY_MS = 86400000;

/** גבולות התקופה שהטווח הנבחר מגדיר סביב התאריך העוגן */
function bounds(date: Date, range: Range): { from: Date; to: Date } {
  if (range === 'day') {
    const from = startOfDay(date);
    return { from, to: new Date(from.getTime() + DAY_MS) };
  }
  if (range === 'week') {
    // שבוע עברי: ראשון עד שבת
    const from = startOfDay(date);
    from.setDate(from.getDate() - from.getDay());
    return { from, to: new Date(from.getTime() + 7 * DAY_MS) };
  }
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  return { from, to: new Date(date.getFullYear(), date.getMonth() + 1, 1) };
}

/** התקופה שלפני הנתונה, באותו אורך — בסיס ההשוואה */
function previous(date: Date, range: Range): Date {
  const d = new Date(date);
  if (range === 'day') d.setDate(d.getDate() - 1);
  else if (range === 'week') d.setDate(d.getDate() - 7);
  else d.setMonth(d.getMonth() - 1);
  return d;
}

interface Totals {
  logs: BabyLog[];
  feedings: number;
  ml: number;
  sleepMs: number;
  naps: number;
  diapers: number;
  /** ימים שכבר חלפו בתקופה — אחרת שבוע שהתחיל אתמול מחולק ב-7 */
  elapsedDays: number;
}

function totalsFor(all: BabyLog[], from: Date, to: Date, now: number): Totals {
  const logs = all.filter((l) => l.timestamp >= from.getTime() && l.timestamp < to.getTime());
  const sleeps = logs.filter((l) => l.type === 'sleep' && l.endTimestamp);
  const end = Math.min(to.getTime(), now);
  const elapsedDays = Math.max(1, Math.ceil((end - from.getTime()) / DAY_MS));
  return {
    logs,
    feedings: logs.filter((l) => l.type === 'feeding').length,
    ml: logs.reduce((s, l) => s + (l.type === 'feeding' ? (l.amountMl ?? 0) : 0), 0),
    sleepMs: sleeps.reduce((s, l) => s + ((l.endTimestamp ?? 0) - l.timestamp), 0),
    naps: sleeps.length,
    diapers: logs.filter((l) => l.type === 'diaper').length,
    elapsedDays,
  };
}

/** "+18% מהשבוע הקודם" — או כלום, כשאין למה להשוות */
function deltaText(now: number, before: number, unit: string): string | undefined {
  if (before <= 0) return undefined;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return `כמו ${unit}`;
  return `${pct > 0 ? '+' : ''}${pct}% מ${unit}`;
}

const hoursText = (ms: number) => {
  const h = ms / 3600000;
  return h >= 1 ? `${h.toFixed(1)} ש׳` : `${Math.round(ms / 60000)} דק׳`;
};

export default function BabySummaryScreen() {
  const { items: allLogs } = useBabyLogs();
  const { activeToday } = useMedications();
  const { profile } = useBabyProfile();
  const insets = useSafeAreaInsets();
  // התאריך משותף עם היומן — "סיכום" נפתח על היום שצפינו בו
  const { date: anchor, setDate: setAnchor } = useBabyDate();
  const now = useNow();
  const [range, setRange] = useState<Range>('day');

  const { from, to } = useMemo(() => bounds(anchor, range), [anchor, range]);
  const prevBounds = useMemo(() => bounds(previous(anchor, range), range), [anchor, range]);

  const cur = useMemo(() => totalsFor(allLogs, from, to, now), [allLogs, from, to, now]);
  const prev = useMemo(
    () => totalsFor(allLogs, prevBounds.from, prevBounds.to, now),
    [allLogs, prevBounds, now],
  );

  // קדימה נחסם בתקופה הנוכחית — אין נתונים בעתיד
  const atCurrent = to.getTime() > now;
  const shift = (dir: 1 | -1) => {
    const d = new Date(anchor);
    if (range === 'day') d.setDate(d.getDate() + dir);
    else if (range === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d);
  };

  const unitName = range === 'day' ? 'אתמול' : range === 'week' ? 'השבוע הקודם' : 'החודש הקודם';
  const periodLabel =
    range === 'day'
      ? isSameDay(anchor.getTime(), new Date(now))
        ? 'היום'
        : anchor.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
      : range === 'week'
        ? `${from.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })} – ${new Date(to.getTime() - DAY_MS).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}`
        : `${HE_MONTHS[from.getMonth()]} ${from.getFullYear()}`;

  // ---- חלוקה ליממות בתוך התקופה: בסיס לגרפי העמודות ולגרף המגמה ----
  const byDay = useMemo(() => {
    const total = Math.round((to.getTime() - from.getTime()) / DAY_MS);
    const days: { key: number; label: string; highlight: boolean }[] = [];
    for (let i = 0; i < total; i++) {
      const d = new Date(from.getTime() + i * DAY_MS);
      days.push({
        key: d.getTime(),
        label: range === 'week' ? HE_DOW[d.getDay()] : String(d.getDate()),
        highlight: isSameDay(d.getTime(), new Date(now)),
      });
    }
    const sum = (dayStart: number, fn: (l: BabyLog) => number) =>
      cur.logs
        .filter((l) => l.timestamp >= dayStart && l.timestamp < dayStart + DAY_MS)
        .reduce((s, l) => s + fn(l), 0);

    const build = (fn: (l: BabyLog) => number): Bar[] =>
      days.map((d) => ({ label: d.label, value: sum(d.key, fn), highlight: d.highlight }));

    const feedings = build((l) => (l.type === 'feeding' ? 1 : 0));
    // המגמה מוצגת רק על ימים שכבר חלפו — יום עתידי בחודש הנוכחי הוא
    // אפס טכני, לא ירידה
    const elapsed = feedings.filter((_, i) => days[i].key <= now);
    // סדר כרונולוגי: הגרף מציב את הנקודה הראשונה בימין, בדיוק כמו
    // עמודות הימים — הזמן בעברית זורם שמאלה
    const trend: Point[] = elapsed.map((b) => ({ label: b.label, value: b.value }));

    return {
      feedings,
      sleepHours: build((l) =>
        l.type === 'sleep' && l.endTimestamp ? (l.endTimestamp - l.timestamp) / 3600000 : 0,
      ),
      diapers: build((l) => (l.type === 'diaper' ? 1 : 0)),
      labelEvery: range === 'month' ? 5 : 1,
      trend,
    };
  }, [cur.logs, from, to, range, now]);

  // ---- פיזור לפי שעה ביום: דפוס שינה ותדירות האכלות ----
  const hourly = useMemo(() => {
    const sleep = Array(24).fill(0);
    const feed = Array(24).fill(0);
    cur.logs.forEach((l) => {
      const h = new Date(l.timestamp).getHours();
      if (l.type === 'sleep') sleep[h] += 1;
      if (l.type === 'feeding') feed[h] += 1;
    });
    const toBars = (arr: number[]): Bar[] =>
      arr.map((v, h) => ({ label: String(h).padStart(2, '0'), value: v }));
    return { sleep: toBars(sleep), feed: toBars(feed) };
  }, [cur.logs]);

  const sleeps = cur.logs.filter((l) => l.type === 'sleep' && l.endTimestamp);
  const perDay = (n: number) => (n / cur.elapsedDays).toFixed(1).replace('.0', '');

  // חלקה של השינה מתוך הזמן שחלף בתקופה — זה מה שהטבעת מראה
  const sleepShare = cur.sleepMs / (cur.elapsedDays * 24 * 3600000);

  // משימות היום לפי התרופות שהמשפחה הגדירה
  const missions = activeToday.map((m) => ({
    id: m.id,
    icon: medIcon(m.emoji),
    label: m.name,
    done: cur.logs.some((l) => l.type === 'medication' && l.medicationId === m.id),
  }));

  const feedMeta = activityMeta('feeding');
  const sleepMeta = activityMeta('sleep');
  const diaperMeta = activityMeta('diaper');

  return (
    <View style={styles.root}>
      <BlobBackdrop />

      {/* ---- בורר הטווח וניווט התקופה ---- */}
      <View style={styles.head}>
        <ScreenHeader
          title="סיכומים וסטטיסטיקות"
          subtitle={`הדפוסים של ${profile.name} לאורך זמן`}
          icon="chart-box-outline"
        />
        <Segmented
          label="טווח הסיכום"
          value={range}
          onChange={setRange}
          options={[
            { value: 'day', label: 'יום' },
            { value: 'week', label: 'שבוע' },
            { value: 'month', label: 'חודש' },
          ]}
        />
        <View style={styles.periodBar}>
          <TouchableOpacity
            style={styles.arrow}
            onPress={() => shift(1)}
            disabled={atCurrent}
            accessibilityRole="button"
            accessibilityLabel="התקופה הבאה"
            accessibilityState={{ disabled: atCurrent }}
          >
            <Ionicons
              name="chevron-back"
              size={21}
              color={atCurrent ? colors.borderStrong : colors.sage}
            />
          </TouchableOpacity>
          <Text style={[type.bodyStrong, styles.period]} numberOfLines={1}>
            {periodLabel}
          </Text>
          <TouchableOpacity
            style={styles.arrow}
            onPress={() => shift(-1)}
            accessibilityRole="button"
            accessibilityLabel="התקופה הקודמת"
          >
            <Ionicons name="chevron-forward" size={21} color={colors.sage} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 108 + insets.bottom }]}>
        {cur.logs.length === 0 ? (
          <EmptyState
            icon="chart-timeline-variant"
            title="אין תיעוד בתקופה הזו"
            hint="אחרי כמה רישומים יופיעו כאן המונים, הגרפים וההשוואה לתקופה הקודמת"
          />
        ) : (
          <>
            {/* ---- כרטיס השינה: הטבעת מראה כמה מהזמן התינוקת ישנה ---- */}
            <Card style={styles.ringCard}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.ringTitleRow}>
                  <MaterialCommunityIcons name={sleepMeta.icon} size={17} color={sleepMeta.color} />
                  <Text style={type.h3}>שעות שינה</Text>
                </View>
                <Text style={styles.ringValue}>
                  {cur.sleepMs > 0 ? hoursText(cur.sleepMs) : '—'}
                </Text>
                <Text style={type.small}>{Math.round(sleepShare * 100)}% מהזמן שחלף בתקופה</Text>
                {deltaText(cur.sleepMs, prev.sleepMs, unitName) ? (
                  <Text style={[type.caption, styles.delta]}>
                    {deltaText(cur.sleepMs, prev.sleepMs, unitName)}
                  </Text>
                ) : null}
              </View>
              <DonutRing
                progress={sleepShare}
                size={96}
                width={11}
                color={sleepMeta.color}
                track={sleepMeta.surface}
              >
                <MaterialCommunityIcons name={sleepMeta.icon} size={26} color={sleepMeta.color} />
              </DonutRing>
            </Card>

            {/* ---- מונים ---- */}
            <View style={styles.statsRow}>
              <StatCard
                icon={feedMeta.icon}
                color={feedMeta.color}
                surface={feedMeta.surface}
                value={String(cur.feedings)}
                label={range === 'day' ? 'ארוחות' : `ארוחות · ${perDay(cur.feedings)} ליום`}
                delta={
                  range === 'day' ? undefined : deltaText(cur.feedings, prev.feedings, unitName)
                }
              />
              <StatCard
                icon="water-outline"
                color={feedMeta.color}
                surface={feedMeta.surface}
                value={String(cur.ml)}
                label={'מ"ל סה"כ'}
                delta={range === 'day' ? undefined : deltaText(cur.ml, prev.ml, unitName)}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon="moon-waning-crescent"
                color={sleepMeta.color}
                surface={sleepMeta.surface}
                value={String(cur.naps)}
                label={range === 'day' ? 'תנומות' : `תנומות · ${perDay(cur.naps)} ליום`}
              />
              <StatCard
                icon={diaperMeta.icon}
                color={diaperMeta.color}
                surface={diaperMeta.surface}
                value={String(cur.diapers)}
                label={range === 'day' ? 'חיתולים' : `חיתולים · ${perDay(cur.diapers)} ליום`}
                delta={range === 'day' ? undefined : deltaText(cur.diapers, prev.diapers, unitName)}
              />
            </View>

            {/* ---- משימות התרופות, רק בתצוגת יום ---- */}
            {range === 'day' && missions.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="משימות יומיות" />
                <View style={styles.missions}>
                  {missions.map((m) => (
                    <View
                      key={m.id}
                      style={[styles.mission, m.done && styles.missionDone]}
                      accessibilityLabel={`${m.label}: ${m.done ? 'בוצע' : 'טרם בוצע'}`}
                    >
                      <ActivityIcon
                        icon={m.done ? 'check' : m.icon}
                        color={m.done ? colors.success : activityMeta('medication').color}
                        surface={m.done ? colors.successSoft : activityMeta('medication').surface}
                        size={30}
                      />
                      <Text style={[type.smallStrong, { flex: 1 }]} numberOfLines={1}>
                        {m.label}
                      </Text>
                      <Text style={[type.caption, m.done && { color: colors.success }]}>
                        {m.done ? 'בוצע' : 'טרם'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* ---- מגמה וגרפים יומיים, בשבוע ובחודש ---- */}
            {range !== 'day' ? (
              <>
                <View style={styles.section}>
                  <SectionHeader title="ארוחות ליום — מגמה" />
                  <Card>
                    <View style={styles.trendHead}>
                      <Text style={styles.trendValue}>{perDay(cur.feedings)}</Text>
                      <Text style={type.small}>ממוצע ארוחות ביום</Text>
                    </View>
                    <TrendLine
                      data={byDay.trend}
                      color={feedMeta.color}
                      format={(v) => `${Math.round(v)} ארוחות`}
                    />
                  </Card>
                </View>

                <View style={styles.section}>
                  <SectionHeader title="שעות שינה לפי יום" />
                  <Card>
                    <BarChart
                      data={byDay.sleepHours}
                      color={sleepMeta.color}
                      labelEvery={byDay.labelEvery}
                      format={(v) => `${v.toFixed(1)} שעות`}
                    />
                  </Card>
                </View>

                <View style={styles.section}>
                  <SectionHeader title="חיתולים לפי יום" />
                  <Card>
                    <BarChart
                      data={byDay.diapers}
                      color={diaperMeta.color}
                      labelEvery={byDay.labelEvery}
                      format={(v) => `${Math.round(v)} חיתולים`}
                    />
                  </Card>
                </View>
              </>
            ) : null}

            {/* ---- דפוסים לפי שעה ---- */}
            <View style={styles.section}>
              <SectionHeader title="דפוס השינה — לפי שעת ההירדמות" />
              <Card>
                <BarChart
                  data={hourly.sleep}
                  color={sleepMeta.color}
                  labelEvery={3}
                  height={100}
                  format={(v) => `${Math.round(v)} הירדמויות`}
                />
              </Card>
            </View>

            <View style={styles.section}>
              <SectionHeader title="תדירות ההאכלות — לפי שעה" />
              <Card>
                <BarChart
                  data={hourly.feed}
                  color={feedMeta.color}
                  labelEvery={3}
                  height={100}
                  format={(v) => `${Math.round(v)} ארוחות`}
                />
              </Card>
            </View>

            {/* ---- פירוט התנומות, בתצוגת יום ---- */}
            {range === 'day' && sleeps.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="תנומות" />
                <Card flush>
                  {sleeps.map((s, i) => (
                    <View key={s.id} style={[styles.napRow, i > 0 && styles.napDivider]}>
                      <ActivityIcon
                        icon={sleepMeta.icon}
                        color={sleepMeta.color}
                        surface={sleepMeta.surface}
                        size={32}
                      />
                      <Text style={[type.body, { flex: 1 }]}>
                        {fmtTime(s.timestamp)} – {fmtTime(s.endTimestamp!)}
                      </Text>
                      <Text style={[type.smallStrong, { color: sleepMeta.color }]}>
                        {fmtDuration(s.endTimestamp! - s.timestamp)}
                      </Text>
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}

            {/* ---- שורת הקשר: הגיל בתקופה הנבחרת ---- */}
            <View style={styles.footer}>
              <MaterialCommunityIcons name="baby-face-outline" size={16} color={colors.textMuted} />
              <Text style={type.caption}>
                {profile.name} ·{' '}
                {getAgeText(
                  profile.birthDate,
                  range === 'day' ? anchor : new Date(Math.min(to.getTime() - DAY_MS, now)),
                )}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  head: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  periodBar: { flexDirection: 'row', alignItems: 'center' },
  arrow: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  period: { flex: 1, textAlign: 'center' },

  scroll: {
    padding: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },

  ringCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  ringTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs + 2 },
  ringValue: { ...type.display, color: colors.text },
  delta: { color: colors.success, fontWeight: '700' },

  statsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.sm },
  section: { marginTop: spacing.md },

  trendHead: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  trendValue: { ...type.h1, color: colors.text },

  missions: { gap: spacing.sm },
  mission: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: TOUCH + 4,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  missionDone: { backgroundColor: colors.successSoft, borderColor: colors.success },

  napRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  napDivider: { borderTopWidth: 1, borderTopColor: colors.border },

  footer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
});
