import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBabyLogs } from '../context/BabyLogsContext';
import { useMessages } from '../context/MessagesContext';
import { useMedications } from '../context/MedicationsContext';
import { useBabyProfile, DEFAULT_PROFILE } from '../hooks/useBabyProfile';
import { BabyLog } from '../types';
import { colors, spacing, radius, shadow, font } from '../config/theme';
import { getAgeText, isSameDay, fmtTime } from '../utils/dates';

interface Props {
  navigation: any;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

// "2ש׳ 30ד׳" ולא "2:30" — נקודתיים בתוך שורת מונים נקראות כשעון
function shortDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return m > 0 ? `${h}ש׳ ${m}ד׳` : `${h}ש׳`;
  return `${m}ד׳`;
}

function timeAgo(ts: number): string {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return 'ממש עכשיו';
  if (min < 60) return `לפני ${min} דק׳`;
  const h = Math.floor(min / 60);
  if (h < 24) return `לפני ${h} שע׳`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
}

function lastLogText(log: BabyLog | undefined, medName?: string): string {
  if (!log) return 'עוד אין תיעוד';
  const ago = timeAgo(log.timestamp);
  switch (log.type) {
    case 'feeding':
      return `אכלה ${ago}${log.amountMl ? ` · ${log.amountMl} מ"ל` : ''}`;
    case 'sleep':
      return log.endTimestamp && log.endTimestamp <= Date.now()
        ? `התעוררה ${timeAgo(log.endTimestamp)}`
        : `ישנה — נרדמה ${ago}`;
    case 'diaper':
      return `חיתול הוחלף ${ago}`;
    case 'medication':
      return `${medName ?? 'תרופה'} ניתנה ${ago}`;
    case 'vitamin':
      return `ויטמין D ניתן ${ago}`;
    case 'iron':
      return `ברזל ניתן ${ago}`;
    default:
      return `עדכון אחרון ${ago}`;
  }
}

/** שם השולח לפי האימייל — אין לנו שמות משתמשים */
const senderName = (email: string) => email.split('@')[0] || 'בן משפחה';

export default function HomeScreen({ navigation }: Props) {
  const { items: babyLogs } = useBabyLogs();
  const { messages } = useMessages();
  const { medications } = useMedications();
  const { profile } = useBabyProfile();

  const todayLogs = useMemo(
    () => babyLogs.filter((l) => isSameDay(l.timestamp, new Date())),
    [babyLogs],
  );

  const lastLog = babyLogs[babyLogs.length - 1];
  const statusText = lastLogText(
    lastLog,
    medications.find((m) => m.id === lastLog?.medicationId)?.name,
  );

  const meals = todayLogs.filter((l) => l.type === 'feeding').length;
  const diapers = todayLogs.filter((l) => l.type === 'diaper').length;
  const sleepMs = todayLogs
    .filter((l) => l.type === 'sleep' && l.endTimestamp)
    .reduce((sum, l) => sum + (l.endTimestamp! - l.timestamp), 0);

  const familyName = profile.familyName?.trim();
  const lastMessage = messages[messages.length - 1];

  const goSettings = () => navigation.navigate('Baby', { screen: 'BabySettings' });
  const goJournal = () => navigation.navigate('Baby', { screen: 'BabyDay' });
  // פתיחת חלון התיעוד ישירות, דרך הציר היומי שמחזיק אותו
  const goAdd = () => navigation.navigate('Baby', { screen: 'BabyDay', params: { openAdd: true } });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ---- כותרת: הברכה והתמונה, כל אחת בצד שלה ומרווח שווה ביניהן ---- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.gear}
          onPress={goSettings}
          accessibilityRole="button"
          accessibilityLabel="הגדרות"
        >
          <Ionicons name="settings-outline" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          {familyName ? (
            <>
              <Text style={styles.greetingSmall} numberOfLines={1}>
                {greeting()},
              </Text>
              <Text style={styles.familyName} numberOfLines={2}>
                משפחת {familyName}
              </Text>
            </>
          ) : (
            <Text style={styles.familyName} numberOfLines={1}>
              {greeting()}
            </Text>
          )}
          <Text style={styles.babyLine} numberOfLines={1}>
            {profile.name}
            {profile.birthDate ? ` · ${getAgeText(profile.birthDate)}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={goSettings}
          accessibilityRole="button"
          accessibilityLabel={`הפרופיל של ${profile.name}`}
          activeOpacity={0.85}
        >
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoEmoji}>👶</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ---- היומן — הסקשן הראשי של המסך ---- */}
      <Text style={styles.sectionTitle}>היומן</Text>
      <View style={styles.card}>
        {/* הכרטיס עצמו הוא שטח הלחיצה; כפתור התיעוד הוא אח שלו ולא
            ילד, כי כפתור בתוך כפתור הוא HTML לא תקין */}
        <TouchableOpacity
          onPress={goJournal}
          accessibilityRole="button"
          accessibilityLabel={`היומן של ${profile.name}. ${statusText}`}
          activeOpacity={0.85}
        >
          <View style={styles.cardHead}>
            <View style={styles.medallion}>
              <Ionicons name="book-outline" size={22} color={colors.pinkAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>היומן של {profile.name}</Text>
              <Text style={styles.cardStatus} numberOfLines={1}>
                {statusText}
              </Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <Stat value={String(meals)} label="ארוחות" />
            <View style={styles.statDivider} />
            <Stat value={sleepMs > 0 ? shortDuration(sleepMs) : '—'} label="שינה" />
            <View style={styles.statDivider} />
            <Stat value={String(diapers)} label="חיתולים" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={goAdd}
          accessibilityRole="button"
          accessibilityLabel="תיעוד חדש"
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>תיעוד חדש</Text>
        </TouchableOpacity>
      </View>

      {/* ---- המשפחה ---- */}
      <Text style={styles.sectionTitle}>המשפחה</Text>
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => navigation.navigate('Chat')}
        accessibilityRole="button"
        accessibilityLabel="הודעות למשפחה"
        activeOpacity={0.85}
      >
        <View style={[styles.medallion, styles.medallionBlue]}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.blueAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>הודעות למשפחה</Text>
          {lastMessage ? (
            <>
              <Text style={styles.chatPreview} numberOfLines={2}>
                {lastMessage.text}
              </Text>
              <Text style={styles.chatMeta}>
                {senderName(lastMessage.senderEmail)} · {fmtTime(lastMessage.createdAt)}
              </Text>
            </>
          ) : (
            <Text style={styles.chatPreview} numberOfLines={2}>
              עוד אין הודעות — אפשר להשאיר אחת
            </Text>
          )}
        </View>
        <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* שירותים עתידיים — שורת טקסט, במקום שני כפתורים מתים ברבע מהמסך */}
      <Text style={styles.soon}>
        בקרוב: {profile.name !== DEFAULT_PROFILE.name ? `שאלה על ${profile.name}` : 'שאלות'} ושיחה
        עם רופא
      </Text>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const PHOTO = 104;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  // תקרת רוחב: בדפדפן שולחני הכרטיסים נמתחו לרוחב המסך כולו ושורת
  // טקסט אחת חצתה אותו מקצה לקצה. הפריסה נשארת זהה, רק ממורכזת.
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  // ---- כותרת ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  gear: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  headerText: { flex: 1, gap: 2 },
  greetingSmall: {
    fontSize: font.body,
    fontWeight: font.weight.medium,
    color: colors.textLight,
    textAlign: 'right',
  },
  familyName: {
    fontSize: font.titleLg,
    fontWeight: font.weight.heavy,
    color: colors.text,
    textAlign: 'right',
  },
  babyLine: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'right',
  },
  // הטבעת הלבנה מפרידה את התמונה מהרקע הקרם ונותנת לה מקום משלה
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO / 2,
    backgroundColor: colors.pink,
    borderWidth: 4,
    borderColor: colors.white,
    ...shadow.soft,
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: PHOTO / 2 },

  // ---- אזורים ----
  sectionTitle: {
    fontSize: font.small,
    fontWeight: font.weight.bold,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    ...shadow.soft,
  },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  medallion: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionBlue: { backgroundColor: colors.blue },
  cardTitle: {
    fontSize: font.bodyLg,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'right',
  },
  cardStatus: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statsRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: font.titleLg,
    fontWeight: font.weight.heavy,
    color: colors.text,
    textAlign: 'center',
  },
  statLabel: { fontSize: font.caption, color: colors.textLight, marginTop: 2 },

  addButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.pinkAccent,
    marginTop: spacing.md,
  },
  addButtonText: {
    fontSize: font.bodyLg,
    fontWeight: font.weight.bold,
    color: colors.white,
  },

  chatCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 92,
    ...shadow.soft,
  },
  chatPreview: {
    fontSize: font.body,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 20,
  },
  chatMeta: { fontSize: font.caption, color: colors.textMuted, textAlign: 'right', marginTop: 3 },

  soon: {
    fontSize: font.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
