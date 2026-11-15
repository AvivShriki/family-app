import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBabyLogs } from '../context/BabyLogsContext';
import { useMessages } from '../context/MessagesContext';
import { useMedications } from '../context/MedicationsContext';
import { useBabyProfile } from '../hooks/useBabyProfile';
import { BabyLog } from '../types';
import { getAgeText, isSameDay, fmtTime } from '../utils/dates';

import { c, t, r, space, shadow, MAX_W } from './home/theme';
import { useHebrewFont } from './home/useHebrewFont';
import { Reveal, Press } from './home/motion';
import HomeSkeleton from './home/Skeleton';
import HomeHeader from './home/HomeHeader';
import SummaryCards, { CardDef } from './home/SummaryCards';
import RecentActivity from './home/RecentActivity';
import ComingSoon from './home/ComingSoon';
import SoftIcon from './home/SoftIcon';
import { shortDuration } from './home/activity';
import HomeTabBar, { TAB_BAR_HEIGHT } from './home/HomeTabBar';

interface Props {
  navigation: any;
}

/** כמה פעילויות אחרונות להציג. מעבר לזה המסך הופך ליומן שני. */
const RECENT = 5;

function greeting(h: number): string {
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

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

  // ---- ניווט: אותם יעדים שהיו, בלי שינוי ----
  const goJournal = () => navigation.navigate('Baby', { screen: 'BabyDay' });
  const goSummary = () => navigation.navigate('Baby', { screen: 'BabySummary' });
  const goSettings = () => navigation.navigate('Baby', { screen: 'BabySettings' });
  const goMonth = () => navigation.navigate('Baby', { screen: 'BabyCalendar' });
  // פתיחת חלון התיעוד ישירות, דרך הציר היומי שמחזיק אותו
  const goAdd = () => navigation.navigate('Baby', { screen: 'BabyDay', params: { openAdd: true } });

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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
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

            <ComingSoon delay={620} />

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
          </>
        )}
      </ScrollView>

      <HomeTabBar
        onMonth={goMonth}
        onJournal={goJournal}
        onAdd={goAdd}
        onSummary={goSummary}
        onSettings={goSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  content: {
    padding: space.lg,
    paddingTop: space.xl,
    // מרווח תחתון בגובה הסרגל: בלעדיו הכרטיס האחרון מסתתר מתחתיו
    paddingBottom: TAB_BAR_HEIGHT + space.xl,
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
