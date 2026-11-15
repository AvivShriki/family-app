import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBabyLogs } from '../context/BabyLogsContext';
import { useMessages } from '../context/MessagesContext';
import { useMedications } from '../context/MedicationsContext';
import { useBabyProfile, DEFAULT_PROFILE } from '../hooks/useBabyProfile';
import { BabyLog } from '../types';
import { getAgeText, isSameDay, fmtTime } from '../utils/dates';

import { c, t, r, space, shadow, MAX_W } from './home/theme';
import { useHebrewFont } from './home/useHebrewFont';
import { Reveal, Press } from './home/motion';
import HomeSkeleton from './home/Skeleton';
import HomeHeader from './home/HomeHeader';
import SummaryCards, { CardDef } from './home/SummaryCards';
import RecentActivity from './home/RecentActivity';
import InsightCards from './home/InsightCards';
import SoftIcon from './home/SoftIcon';
import { shortDuration } from './home/activity';
import { Day } from './home/MiniBars';

interface Props {
  navigation: any;
}

const DAY_MS = 86400000;
/** כמה פעילויות אחרונות להציג. מעבר לזה המסך הופך ליומן שני. */
const RECENT = 5;
/** אורך חלון ההשוואה בכרטיס "מצב כללי" */
const AVG_DAYS = 7;
/** כמה ימים בגרף "מבט חודשי" */
const MONTH_DAYS = 30;
/** מתחת לזה אין באמת ממוצע, רק רעש */
const MIN_DAYS_FOR_AVG = 3;

function greeting(h: number): string {
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** שם השולח לפי האימייל — אין לנו שמות משתמשים */
const senderName = (email: string) => email.split('@')[0] || 'בן משפחה';

export default function HomeScreen({ navigation }: Props) {
  useHebrewFont();

  const { items: babyLogs, loading } = useBabyLogs();
  const { messages } = useMessages();
  const { medications } = useMedications();
  const { profile } = useBabyProfile();

  const now = new Date();

  // ---- כל החישובים נגזרים מהרישומים האמיתיים של המשפחה ----
  const stats = useMemo(() => {
    const today = babyLogs.filter((l) => isSameDay(l.timestamp, now));
    const feedings = today.filter((l) => l.type === 'feeding');
    const totalMl = feedings.reduce((s, l) => s + (l.amountMl ?? 0), 0);
    const sleepMs = today
      .filter((l) => l.type === 'sleep' && l.endTimestamp)
      .reduce((s, l) => s + (l.endTimestamp! - l.timestamp), 0);

    return {
      feedings: feedings.length,
      totalMl,
      sleepMinutes: Math.round(sleepMs / 60000),
      diapers: today.filter((l) => l.type === 'diaper').length,
    };
    // now נוצר בכל רינדור; התלות האמיתית היא ברישומים
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyLogs]);

  const recent = useMemo(() => babyLogs.slice(-RECENT).reverse(), [babyLogs]);

  /** ממוצע הארוחות ביום בשבוע שקדם להיום — רק אם יש מספיק ימים מתועדים */
  const average = useMemo(() => {
    const todayStart = startOfDay(now);
    const buckets: number[] = [];
    for (let i = 1; i <= AVG_DAYS; i++) {
      const from = todayStart - i * DAY_MS;
      const dayLogs = babyLogs.filter((l) => l.timestamp >= from && l.timestamp < from + DAY_MS);
      if (dayLogs.length > 0) buckets.push(dayLogs.filter((l) => l.type === 'feeding').length);
    }
    if (buckets.length < MIN_DAYS_FOR_AVG) return null;
    const avg = buckets.reduce((a, b) => a + b, 0) / buckets.length;
    return Math.round(avg * 10) / 10;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyLogs]);

  /** ארוחות ליום לאורך החודש האחרון */
  const month = useMemo<Day[]>(() => {
    const todayStart = startOfDay(now);
    const days: Day[] = [];
    for (let i = MONTH_DAYS - 1; i >= 0; i--) {
      const from = todayStart - i * DAY_MS;
      const d = new Date(from);
      days.push({
        label: d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' }),
        value: babyLogs.filter(
          (l) => l.type === 'feeding' && l.timestamp >= from && l.timestamp < from + DAY_MS,
        ).length,
        today: i === 0,
      });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyLogs]);

  const hasMonth = useMemo(
    () => babyLogs.some((l) => l.timestamp < startOfDay(now)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [babyLogs],
  );

  // ---- ניווט: אותם יעדים שהיו, בלי שינוי ----
  const goJournal = () => navigation.navigate('Baby', { screen: 'BabyDay' });
  const goSummary = () => navigation.navigate('Baby', { screen: 'BabySummary' });
  const goSettings = () => navigation.navigate('Baby', { screen: 'BabySettings' });

  const medName = (id?: string) => medications.find((m) => m.id === id)?.name;
  const lastMessage = messages[messages.length - 1];

  /**
   * כרטיס ההאכלה מציג מ"ל כשיש מה למדוד, ומספר ארוחות כשהיום היה
   * כולו הנקה — "0 מ"ל" אחרי ארבע הנקות הוא מספר נכון שמשקר.
   */
  const cards: CardDef[] = [
    stats.totalMl > 0
      ? {
          key: 'feeding',
          icon: 'baby-bottle-outline',
          tint: c.roseDeep,
          surface: c.roseSoft,
          value: stats.totalMl,
          suffix: 'מ"ל',
          label: 'האכלה היום',
          onPress: goJournal,
        }
      : {
          key: 'feeding',
          icon: 'baby-bottle-outline',
          tint: c.roseDeep,
          surface: c.roseSoft,
          value: stats.feedings,
          label: 'האכלות היום',
          onPress: goJournal,
        },
    {
      key: 'sleep',
      icon: 'weather-night',
      tint: c.blueDeep,
      surface: c.blue,
      value: stats.sleepMinutes,
      display: (m) => (m > 0 ? shortDuration(m * 60000) : '—'),
      label: 'שינה היום',
      onPress: goJournal,
    },
    {
      key: 'diaper',
      icon: 'human-baby-changing-table',
      tint: c.greenDeep,
      surface: c.green,
      value: stats.diapers,
      label: 'חיתולים היום',
      onPress: goJournal,
    },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <>
          <HomeHeader
            name={profile.name}
            greeting={greeting(now.getHours())}
            familyName={profile.familyName?.trim() || undefined}
            ageText={getAgeText(profile.birthDate)}
            dateText={now.toLocaleDateString('he-IL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            photoUrl={profile.photoUrl}
            onPressProfile={goSettings}
            onPressSettings={goSettings}
          />

          <SummaryCards cards={cards} />

          <RecentActivity
            logs={recent}
            medName={medName}
            onPressAll={goJournal}
            onPressLog={(_log: BabyLog) => goJournal()}
          />

          <InsightCards
            todayCount={stats.feedings}
            average={average}
            month={month}
            hasMonth={hasMonth}
            onPressSummary={goSummary}
          />

          {/* ---- הודעות המשפחה — פיצ'ר קיים, נשאר במקומו ---- */}
          <Reveal delay={760}>
            <Press
              onPress={() => navigation.navigate('Chat')}
              accessibilityRole="button"
              accessibilityLabel="הודעות למשפחה"
              to={0.99}
            >
              <View style={styles.chat}>
                <SoftIcon
                  icon="message-text-outline"
                  tint={c.lavenderDeep}
                  surface={c.lavender}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <Text style={t.cardTitle}>הודעות למשפחה</Text>
                  {lastMessage ? (
                    <>
                      <Text style={t.body} numberOfLines={2}>
                        {lastMessage.text}
                      </Text>
                      <Text style={t.caption}>
                        {senderName(lastMessage.senderEmail)} · {fmtTime(lastMessage.createdAt)}
                      </Text>
                    </>
                  ) : (
                    <Text style={t.body} numberOfLines={2}>
                      עוד אין הודעות — אפשר להשאיר אחת
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-back" size={18} color={c.textMuted} />
              </View>
            </Press>
          </Reveal>

          {/* שירותים עתידיים — שורת טקסט, ולא כפתורים שלא מובילים לשום מקום */}
          <Reveal delay={820}>
            <Text style={[t.caption, styles.soon]}>
              בקרוב: {profile.name !== DEFAULT_PROFILE.name ? `שאלה על ${profile.name}` : 'שאלות'}{' '}
              ושיחה עם רופא
            </Text>
          </Reveal>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  content: {
    padding: space.lg,
    paddingTop: space.xl,
    // מרווח תחתון נדיב: המסך נגלל מתחת לשוליים הבטוחים של הטלפון
    paddingBottom: 56,
    width: '100%',
    maxWidth: MAX_W,
    alignSelf: 'center',
  },

  chat: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: c.white,
    borderRadius: r.xxl,
    padding: space.lg,
    ...shadow.card,
  },
  soon: { textAlign: 'center', marginTop: space.xl },
});
