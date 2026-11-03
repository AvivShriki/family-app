import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useBabyProfile, DEFAULT_PROFILE } from '../hooks/useBabyProfile';
import Button from '../components/Button';
import { BabyLog } from '../types';
import { colors, spacing, radius, shadow, font } from '../config/theme';
import { getAgeText, isSameDay } from '../utils/dates';

interface Props {
  navigation: any;
}

// ברכה לפי שעת היום — הקופי של עודד
function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

// גרסה קצרה של משך זמן לאריח הסיכום — המילה "שעות" גולשת לשורה שנייה
// ומיותרת, כי התווית מתחת כבר אומרת שמדובר בשינה.
function shortDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  return h > 0 ? `${h}:${String(min % 60).padStart(2, '0')}` : `${min} דק'`;
}

// מחוץ לקומפוננטה: Date.now ישירות בגוף הרנדר נחשב קריאה לא-טהורה
function timeAgo(ts: number): string {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return 'ממש עכשיו';
  if (min < 60) return `לפני ${min} דק'`;
  const h = Math.floor(min / 60);
  return `לפני ${h} שע'`;
}

// תיאור הפעולה האחרונה בשפה של הורים
function lastLogText(log: BabyLog | undefined): string {
  if (!log) return 'עוד אין תיעוד — הכול רגוע 💤';
  const ago = timeAgo(log.timestamp);
  switch (log.type) {
    case 'feeding':
      return `🍼 אכלה ${ago}${log.amountMl ? ` · ${log.amountMl} מ"ל` : ''}`;
    case 'sleep':
      return log.endTimestamp && log.endTimestamp <= Date.now()
        ? `😴 התעוררה ${timeAgo(log.endTimestamp)}`
        : `😴 נרדמה ${ago}`;
    case 'diaper':
      return `💩 חיתול הוחלף ${ago}`;
    case 'vitamin':
      return `☀️ ויטמין D ניתן ${ago}`;
    case 'iron':
      return `💧 ברזל ניתן ${ago}`;
    default:
      return `📝 עדכון אחרון ${ago}`;
  }
}

export default function HomeScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const { items: babyLogs } = useCollection<BabyLog>('babyLogs', 'timestamp', 'desc');
  const { profile } = useBabyProfile();

  // שני הכפתורים החדשים עוד לא מחוברים לכלום. לחיצה שלא מחזירה דבר
  // מלמדת שהאפליקציה שבורה, ולכן היא מציגה הודעה קצרה במקום כלום.
  const [soonFor, setSoonFor] = useState<string | null>(null);
  const tapSoon = (what: string) => {
    setSoonFor(what);
    setTimeout(() => setSoonFor(null), 4000);
  };

  const dateLine = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // "משפחת" מתווסף בקוד, אחרת כל משפחה תקליד אחרת ונקבל "משפחת משפחת שריקי"
  const family = profile.familyName?.trim();
  // רווח קשיח בין "משפחת" לשם, כדי שגלישה לשורה שנייה לא תפריד ביניהם
  const greetingLine = family ? `${greeting()}, משפחת ${family}` : greeting();

  const hasName = profile.name && profile.name !== DEFAULT_PROFILE.name;

  // --- מצב התינוקת: פעולה אחרונה, משימות היום וסיכום היום ---
  const todayLogs = useMemo(
    () => babyLogs.filter((l) => isSameDay(l.timestamp, new Date())),
    [babyLogs],
  );
  // הרשימה ממוינת יורד, ולכן האיבר הראשון הוא האחרון שתועד
  const statusText = lastLogText(babyLogs[0]);
  const vitaminDone = todayLogs.some((l) => l.type === 'vitamin');
  const ironDone = todayLogs.some((l) => l.type === 'iron');

  const meals = todayLogs.filter((l) => l.type === 'feeding').length;
  const diapers = todayLogs.filter((l) => l.type === 'diaper').length;
  const sleepMs = todayLogs
    .filter((l) => l.type === 'sleep' && l.endTimestamp)
    .reduce((sum, l) => sum + (l.endTimestamp! - l.timestamp), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* כותרת — כפתור עגול בכל צד וברכה ממורכזת ביניהם */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('ChangePassword')}
          accessibilityLabel="שינוי סיסמה"
          hitSlop={8}
        >
          <Ionicons name="key-outline" size={18} color={colors.textLight} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>{greetingLine}</Text>
          <Text style={styles.dateLine}>{dateLine}</Text>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={logout}
          accessibilityLabel="יציאה"
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* כרטיס הירו — 70% מהמשקל הוויזואלי של המסך.
          הכרטיס עצמו אינו לחיץ: האווטאר מוביל להגדרות והכפתור ליומן,
          כך שאין שני יעדי מגע מקוננים. */}
      <View style={styles.hero}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Baby', { screen: 'BabySettings' })}
          accessibilityLabel="עריכת פרופיל התינוקת"
          activeOpacity={0.85}
        >
          <View style={styles.avatarRing}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarEmoji}>👶</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </View>
        </TouchableOpacity>

        {!profile.photoUrl ? <Text style={styles.photoHint}>לחיצה מוסיפה תמונה</Text> : null}

        <Text style={styles.babyName}>{profile.name}</Text>
        <Text style={styles.babyAge}>{getAgeText(profile.birthDate)}</Text>
        {profile.birthDate ? (
          <Text style={styles.babyBirth}>
            נולדה ב-{new Date(profile.birthDate).toLocaleDateString('he-IL')}
          </Text>
        ) : null}

        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>{statusText}</Text>
        </View>

        <View style={styles.missionsRow}>
          <View style={[styles.missionChip, vitaminDone && styles.missionDone]}>
            <Text style={[styles.missionText, vitaminDone && styles.missionTextDone]}>
              {vitaminDone ? '✓ ויטמין D' : '○ ויטמין D — עוד לא'}
            </Text>
          </View>
          <View style={[styles.missionChip, ironDone && styles.missionDone]}>
            <Text style={[styles.missionText, ironDone && styles.missionTextDone]}>
              {ironDone ? '✓ ברזל' : '○ ברזל — עוד לא'}
            </Text>
          </View>
        </View>

        <Button
          label="פתיחת היומן"
          onPress={() => navigation.navigate('Baby')}
          style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
        />
      </View>

      {/* סיכום היום — נקרא הרבה, נלחץ מעט */}
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{meals}</Text>
          <Text style={styles.statLabel}>ארוחות היום</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{sleepMs > 0 ? shortDuration(sleepMs) : '—'}</Text>
          <Text style={styles.statLabel}>שינה היום</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{diapers}</Text>
          <Text style={styles.statLabel}>חיתולים היום</Text>
        </View>
      </View>

      {/* שירותים עתידיים — מוצגים, מסומנים "בקרוב", ועוד לא מחוברים */}
      <View style={styles.servicesRow}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => tapSoon('ask')}
          accessibilityState={{ disabled: true }}
          accessibilityHint="בקרוב"
          activeOpacity={0.9}
        >
          <View style={[styles.serviceIcon, { backgroundColor: colors.pink }]}>
            <Ionicons name="sparkles-outline" size={20} color={colors.text} />
          </View>
          <Text style={styles.serviceLabel}>
            {hasName ? `שאלה על ${profile.name}` : 'יש לי שאלה'}
          </Text>
          <View style={styles.soonChip}>
            <Text style={styles.soonText}>בקרוב</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => tapSoon('doctor')}
          accessibilityState={{ disabled: true }}
          accessibilityHint="בקרוב"
          activeOpacity={0.9}
        >
          <View style={[styles.serviceIcon, { backgroundColor: colors.blue }]}>
            <Ionicons name="medkit-outline" size={20} color={colors.text} />
          </View>
          <Text style={styles.serviceLabel}>שיחה עם רופא</Text>
          <View style={styles.soonChip}>
            <Text style={styles.soonText}>בקרוב</Text>
          </View>
        </TouchableOpacity>
      </View>

      {soonFor ? <Text style={styles.soonNotice}>עוד לא מוכן — נעדכן כאן כשייפתח.</Text> : null}
    </ScrollView>
  );
}

const AVATAR = 88;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  headerCenter: { flex: 1, alignItems: 'center' },
  greeting: {
    fontSize: font.titleLg,
    fontWeight: font.weight.heavy,
    color: colors.text,
    textAlign: 'center',
  },
  dateLine: { fontSize: font.small, color: colors.textLight, marginTop: 2, textAlign: 'center' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },

  hero: {
    backgroundColor: colors.pink,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  // הטבעת הלבנה מפרידה את התמונה מהרקע הוורוד ונותנת לה את הבולטות
  avatarRing: {
    width: AVATAR + 6,
    height: AVATAR + 6,
    borderRadius: (AVATAR + 6) / 2,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 },
  avatarPlaceholder: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: AVATAR / 2 },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  photoHint: { fontSize: font.caption, color: colors.text, marginTop: spacing.xs },

  // בתוך הכרטיס הוורוד הצבע אינו כלי היררכיה — ניגודיות של טקסט בהיר על
  // ורוד נופלת מהתקן, ולכן ההפרדה היא בגודל ובמשקל בלבד.
  babyName: {
    fontSize: font.titleLg,
    fontWeight: font.weight.heavy,
    color: colors.text,
    marginTop: spacing.md,
  },
  babyAge: { fontSize: font.body, fontWeight: font.weight.medium, color: colors.text, marginTop: 2 },
  babyBirth: { fontSize: font.small, color: colors.text, marginTop: 2 },

  statusChip: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  statusChipText: { fontSize: font.small, fontWeight: font.weight.semibold, color: colors.text },

  missionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignSelf: 'stretch' },
  missionChip: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  missionDone: { backgroundColor: '#F0FFF4', borderColor: colors.success },
  missionText: { fontSize: font.caption, color: colors.text },
  missionTextDone: { fontWeight: font.weight.bold },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.soft,
  },
  statValue: { fontSize: font.titleLg, fontWeight: font.weight.bold, color: colors.text },
  statLabel: { fontSize: font.caption, color: colors.textLight, marginTop: 2, textAlign: 'center' },

  servicesRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  serviceCard: {
    flex: 1,
    minHeight: 72,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.soft,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  serviceLabel: {
    fontSize: font.body,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  soonChip: {
    backgroundColor: colors.creamDark,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  soonText: { fontSize: font.caption, fontWeight: font.weight.semibold, color: colors.textLight },
  soonNotice: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
