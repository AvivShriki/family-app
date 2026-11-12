import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useBabyLogs } from '../context/BabyLogsContext';
import { useMessages } from '../context/MessagesContext';
import { useMedications } from '../context/MedicationsContext';
import { useBabyProfile } from '../hooks/useBabyProfile';
import { useNow } from '../hooks/useNow';
import PressScale from '../components/PressScale';
import SectionHeader from '../components/SectionHeader';
import ActivityIcon from '../components/ActivityIcon';
import BlobBackdrop from '../components/BlobBackdrop';
import { BabyLog } from '../types';
import { activityMeta, medIcon, MCIcon } from '../config/activity';
import { colors, spacing, radius, shadow, type, TOUCH, CONTENT_MAX } from '../config/theme';
import { getAgeText, isSameDay, fmtTime } from '../utils/dates';

interface Props {
  navigation: any;
}

/** חלון החרטה אחרי רישום בנגיעה */
const UNDO_MS = 4000;
/** הקצב היומי מחולק לחלונות של שעתיים — 12 עמודות שנכנסות לרוחב טלפון */
const RHYTHM_BUCKETS = 12;

const DIAPER_LABEL: Record<NonNullable<BabyLog['diaperType']>, string> = {
  wet: 'שתן',
  dirty: 'קקי',
  both: 'שתן + קקי',
};

function greeting(now: number): string {
  const h = new Date(now).getHours();
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

function timeAgo(ts: number, now: number): string {
  const min = Math.round((now - ts) / 60000);
  if (min < 1) return 'ממש עכשיו';
  if (min < 60) return `לפני ${min} דק׳`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : `לפני ${h} שעות`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
}

/** הפרטים שמוסיפים מידע לפעילות האחרונה, מעבר לשם שלה ולשעה */
function detailOf(log: BabyLog): string {
  switch (log.type) {
    case 'feeding':
      return log.amountMl ? `${log.amountMl} מ"ל` : 'הנקה';
    case 'diaper':
      return log.diaperType ? DIAPER_LABEL[log.diaperType] : '';
    case 'sleep':
      return log.endTimestamp ? shortDuration(log.endTimestamp - log.timestamp) : 'עוד ישנה';
    default:
      return log.details ?? '';
  }
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { items: babyLogs, add, remove, update } = useBabyLogs();
  const { messages } = useMessages();
  const { medications, activeToday } = useMedications();
  const { profile } = useBabyProfile();
  const insets = useSafeAreaInsets();
  // שעון חי: "לפני 40 דק׳", מוני היום והברכה מתעדכנים בלי לרענן את המסך
  const now = useNow();

  // הרישום האחרון שנוצר בנגיעה, לחלון החרטה
  const [justLogged, setJustLogged] = useState<{ tile: string; id: string } | null>(null);

  const todayLogs = useMemo(
    () => babyLogs.filter((l) => isSameDay(l.timestamp, new Date(now))),
    [babyLogs, now],
  );

  const lastLog = babyLogs[babyLogs.length - 1];
  const lastMedName = medications.find((m) => m.id === lastLog?.medicationId)?.name;

  // שינה פתוחה: נרשמה התחלה ועוד אין סיום
  const openSleep = [...babyLogs].reverse().find((l) => l.type === 'sleep' && !l.endTimestamp);

  const meals = todayLogs.filter((l) => l.type === 'feeding').length;
  const diapers = todayLogs.filter((l) => l.type === 'diaper').length;
  const sleepMs = todayLogs
    .filter((l) => l.type === 'sleep' && l.endTimestamp)
    .reduce((sum, l) => sum + (l.endTimestamp! - l.timestamp), 0);

  // הקצב של היום: כמה תועד בכל חלון של שעתיים
  const rhythm = useMemo(() => {
    const buckets = Array(RHYTHM_BUCKETS).fill(0);
    todayLogs.forEach((l) => {
      const h = new Date(l.timestamp).getHours();
      buckets[Math.floor(h / (24 / RHYTHM_BUCKETS))] += 1;
    });
    return buckets;
  }, [todayLogs]);

  const loggedBy = user?.email ?? 'demo';

  const quickLog = async (tile: string, entry: Omit<BabyLog, 'id'>) => {
    const id = await add(entry as any);
    setJustLogged({ tile, id });
    setTimeout(() => setJustLogged((cur) => (cur?.id === id ? null : cur)), UNDO_MS);
  };

  const undo = async () => {
    if (!justLogged) return;
    const { id } = justLogged;
    setJustLogged(null);
    await remove(id);
  };

  const tapSleep = () => {
    if (openSleep) {
      // סגירת שינה פתוחה היא עדכון, לא רישום חדש — ולכן גם אין מה לבטל
      update(openSleep.id, { endTimestamp: Date.now() });
      return;
    }
    quickLog('sleep', { type: 'sleep', timestamp: Date.now(), loggedBy });
  };

  // משימות היום לפי התרופות שהמשפחה הגדירה, ולא לפי רשימה קבועה
  const missions = activeToday.map((m) => ({
    id: m.id,
    icon: medIcon(m.emoji),
    label: m.name,
    done: todayLogs.some((l) => l.type === 'medication' && l.medicationId === m.id),
  }));

  const lastMessage = messages[messages.length - 1];
  const goJournal = () => navigation.navigate('BabyDay');

  return (
    <View style={styles.root}>
      <BlobBackdrop />
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: 110 + insets.bottom },
        ]}
      >
        {/* ---- זהות: מי התינוקת, מה השעה, ומי המשפחה ---- */}
        <View style={styles.identity}>
          <TouchableOpacity
            style={styles.gear}
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel="פרופיל והגדרות"
          >
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.identityText}>
            {/* שם המשפחה בברכה הוא בקשה מפורשת, ולא קישוט: זה מה שהופך
                את הפתיחה לאישית. משפחה שלא מילאה אותו מקבלת ברכה רגילה. */}
            <Text style={styles.greeting} numberOfLines={1}>
              {profile.familyName?.trim()
                ? `${greeting(now)}, משפחת ${profile.familyName.trim()}`
                : `${greeting(now)},`}
            </Text>
            <Text style={type.h1} numberOfLines={1}>
              {profile.name}
            </Text>
            <Text style={type.small} numberOfLines={1}>
              {getAgeText(profile.birthDate)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('BabyProfile')}
            accessibilityRole="button"
            accessibilityLabel={`הפרטים של ${profile.name}`}
            activeOpacity={0.85}
          >
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <MaterialCommunityIcons name="baby-face-outline" size={40} color={colors.sage} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ---- הפעילות האחרונה — השאלה שהורים שואלים זה את זה ---- */}
        <LastActivity
          log={lastLog}
          now={now}
          medName={lastMedName}
          openSleep={openSleep}
          onEndSleep={tapSleep}
          onPress={goJournal}
        />

        {/* ---- תיעוד בנגיעה אחת ---- */}
        <View style={styles.quickRow}>
          <Quick
            type="feeding"
            label="האכלה"
            state={justLogged?.tile === 'feeding' ? 'logged' : 'idle'}
            onPress={() =>
              quickLog('feeding', { type: 'feeding', timestamp: Date.now(), loggedBy })
            }
            onUndo={undo}
          />
          <Quick
            type="sleep"
            label={openSleep ? 'סיום שינה' : 'שינה'}
            state={justLogged?.tile === 'sleep' ? 'logged' : openSleep ? 'active' : 'idle'}
            onPress={tapSleep}
            onUndo={undo}
          />
          <Quick
            type="diaper"
            label="חיתול"
            state={justLogged?.tile === 'diaper' ? 'logged' : 'idle'}
            onPress={() => quickLog('diaper', { type: 'diaper', timestamp: Date.now(), loggedBy })}
            onUndo={undo}
          />
          {/* "עוד" פותח את חלון התיעוד המלא — שם יש שעה, כמות והערה */}
          <Quick
            type="note"
            icon="dots-horizontal"
            label="עוד"
            state="idle"
            onPress={() => navigation.navigate('BabyDay', { openAdd: true })}
          />
        </View>

        {/* ---- משימות התרופות של היום ---- */}
        {missions.length > 0 ? (
          <View style={styles.missions}>
            {missions.map((m) => (
              <Mission
                key={m.id}
                icon={m.icon}
                label={m.label}
                done={m.done}
                justLogged={justLogged?.tile === m.id}
                onPress={() =>
                  quickLog(m.id, {
                    type: 'medication',
                    medicationId: m.id,
                    timestamp: Date.now(),
                    loggedBy,
                  })
                }
                onUndo={undo}
              />
            ))}
          </View>
        ) : null}

        {/* ---- היום ---- */}
        <View style={styles.section}>
          <SectionHeader
            title={`היום של ${profile.name}`}
            actionLabel="כל היומן"
            onAction={goJournal}
          />
          <View style={styles.statsRow}>
            <Stat type="feeding" value={String(meals)} label="ארוחות" />
            <Stat type="sleep" value={sleepMs > 0 ? shortDuration(sleepMs) : '—'} label="שינה" />
            <Stat type="diaper" value={String(diapers)} label="חיתולים" />
          </View>

          <View style={styles.rhythmCard}>
            <Text style={type.label}>הקצב של היום</Text>
            <DayRhythm buckets={rhythm} />
          </View>
        </View>

        {/* ---- עדכוני המשפחה ---- */}
        <PressScale
          to={0.99}
          onPress={() => navigation.navigate('Chat')}
          accessibilityRole="button"
          accessibilityLabel="הודעות למשפחה"
          style={styles.section}
        >
          <View style={styles.family}>
            <View style={styles.familyIcon}>
              <Ionicons name="people-outline" size={20} color={colors.sage} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.bodyStrong}>הודעות למשפחה</Text>
              <Text style={type.small} numberOfLines={1}>
                {lastMessage
                  ? `${lastMessage.senderEmail.split('@')[0]}: ${lastMessage.text}`
                  : 'עוד אין הודעות — אפשר להשאיר אחת'}
              </Text>
            </View>
            {lastMessage ? (
              <Text style={type.caption}>{fmtTime(lastMessage.createdAt)}</Text>
            ) : null}
            <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          </View>
        </PressScale>
      </ScrollView>
    </View>
  );
}

/**
 * כרטיס הפעילות האחרונה — המשטח הצבעוני היחיד במסך, ולכן גם הדבר
 * שהעין נוחתת עליו ראשונה.
 *
 * כשיש שינה פתוחה הוא מתחלף: במקום "מה היה" הוא מראה "מה קורה עכשיו",
 * ונותן לסיים את השינה בלי לרדת לאריחים.
 */
function LastActivity({
  log,
  now,
  medName,
  openSleep,
  onEndSleep,
  onPress,
}: {
  log: BabyLog | undefined;
  now: number;
  medName?: string;
  openSleep?: BabyLog;
  onEndSleep: () => void;
  onPress: () => void;
}) {
  if (openSleep) {
    return (
      <View style={styles.hero}>
        <View style={styles.heroMedallion}>
          <MaterialCommunityIcons name="weather-night" size={26} color={colors.sage} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>ישנה עכשיו</Text>
          <Text style={styles.heroTitle}>{shortDuration(now - openSleep.timestamp)}</Text>
          <View style={styles.heroMetaRow}>
            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroMeta}>נרדמה ב-{fmtTime(openSleep.timestamp)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.endSleep}
          onPress={onEndSleep}
          accessibilityRole="button"
          accessibilityLabel="סיום שינה"
        >
          <Text style={styles.endSleepText}>סיום</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!log) {
    return (
      <View style={styles.hero}>
        <View style={styles.heroMedallion}>
          <MaterialCommunityIcons name="baby-carriage" size={26} color={colors.sage} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>הפעילות האחרונה</Text>
          <Text style={styles.heroTitle}>עוד אין תיעוד</Text>
          <Text style={styles.heroMeta}>נגיעה באחד הכפתורים למטה רושמת את הראשון</Text>
        </View>
      </View>
    );
  }

  const meta = activityMeta(log.type);
  const title = log.type === 'medication' && medName ? medName : meta.label;
  const detail = detailOf(log);

  return (
    <PressScale
      to={0.99}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`הפעילות האחרונה: ${title}, ${timeAgo(log.timestamp, now)}. פתיחת היומן`}
    >
      <View style={styles.hero}>
        <View style={styles.heroMedallion}>
          <MaterialCommunityIcons name={meta.icon} size={26} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>הפעילות האחרונה</Text>
          <Text style={styles.heroTitle}>{title}</Text>
          <View style={styles.heroMetaRow}>
            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroMeta}>
              {timeAgo(log.timestamp, now)}
              {detail ? ` · ${detail}` : ''}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.75)" />
      </View>
    </PressScale>
  );
}

/**
 * כפתור תיעוד בנגיעה אחת.
 *
 * ארבעה מצבים: רגיל, נרשם-כרגע (ולכן אפשר לבטל), ופעיל (שינה שנפתחה).
 * בכל מצב הסימון הוא גם צורני וגם טקסטואלי.
 */
function Quick({
  type: logType,
  icon,
  label,
  state,
  onPress,
  onUndo,
}: {
  type: BabyLog['type'];
  icon?: MCIcon;
  label: string;
  state: 'idle' | 'logged' | 'active';
  onPress: () => void;
  onUndo?: () => void;
}) {
  const meta = activityMeta(logType);

  if (state === 'logged') {
    return (
      <PressScale
        onPress={onUndo}
        accessibilityRole="button"
        // לא `${label} נרשם`: אחרי פתיחת שינה התווית כבר התחלפה
        // ל"סיום שינה", והיה נקרא "סיום שינה נרשם"
        accessibilityLabel="התיעוד נרשם. נגיעה מבטלת"
        style={styles.quickOuter}
      >
        <View style={[styles.quick, styles.quickLogged]}>
          <View style={[styles.quickIcon, { backgroundColor: colors.successSoft }]}>
            <MaterialCommunityIcons name="check" size={21} color={colors.success} />
          </View>
          <Text style={[styles.quickLabel, { color: colors.success }]} numberOfLines={1}>
            ביטול
          </Text>
        </View>
      </PressScale>
    );
  }

  const active = state === 'active';
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`תיעוד ${label}`}
      style={styles.quickOuter}
    >
      <View style={[styles.quick, active && styles.quickActive]}>
        <View style={[styles.quickIcon, { backgroundColor: meta.surface }]}>
          <MaterialCommunityIcons name={icon ?? meta.icon} size={21} color={meta.color} />
        </View>
        <Text style={styles.quickLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressScale>
  );
}

/** תרופה או תוסף של היום. נגיעה רושמת, והווי נשאר עד סוף היום. */
function Mission({
  icon,
  label,
  done,
  justLogged,
  onPress,
  onUndo,
}: {
  icon: MCIcon;
  label: string;
  done: boolean;
  justLogged: boolean;
  onPress: () => void;
  onUndo: () => void;
}) {
  const meta = activityMeta('medication');
  const marked = done || justLogged;
  return (
    <PressScale
      onPress={justLogged ? onUndo : onPress}
      accessibilityRole="button"
      accessibilityLabel={
        justLogged
          ? `${label} נרשמה. נגיעה מבטלת`
          : marked
            ? `${label}, ניתנה היום`
            : `תיעוד ${label}`
      }
      style={styles.missionOuter}
    >
      <View style={[styles.mission, marked && styles.missionDone]}>
        <MaterialCommunityIcons
          name={marked ? 'check-circle' : icon}
          size={18}
          color={marked ? colors.success : meta.color}
        />
        <Text style={[type.smallStrong, styles.missionLabel]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[type.caption, marked && { color: colors.success }]}>
          {justLogged ? 'ביטול' : marked ? 'בוצע' : 'טרם'}
        </Text>
      </View>
    </PressScale>
  );
}

function Stat({ type: t, value, label }: { type: BabyLog['type']; value: string; label: string }) {
  const meta = activityMeta(t);
  return (
    <View style={styles.stat} accessibilityLabel={`${label}: ${value}`}>
      <ActivityIcon icon={meta.icon} color={meta.color} surface={meta.surface} size={34} />
      <Text style={type.metric} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[type.caption, { textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}

/** עמודות התיעוד לאורך היום, בחלונות של שעתיים */
function DayRhythm({ buckets }: { buckets: number[] }) {
  const max = Math.max(...buckets, 1);
  return (
    <View>
      {/* row-reverse: חצות בימין, סוף היום בשמאל */}
      <View style={styles.rhythmBars}>
        {buckets.map((v, i) => (
          <View key={i} style={styles.rhythmCol}>
            <View
              style={[
                styles.rhythmBar,
                {
                  height: `${Math.max((v / max) * 100, v > 0 ? 12 : 5)}%`,
                  backgroundColor: v > 0 ? colors.moss : colors.border,
                },
              ]}
              accessibilityLabel={`${String(i * 2).padStart(2, '0')}:00 — ${v} רישומים`}
            />
          </View>
        ))}
      </View>
      <View style={styles.rhythmAxis}>
        <Text style={type.caption}>18:00</Text>
        <Text style={type.caption}>12:00</Text>
        <Text style={type.caption}>06:00</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroller: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },

  // ---- זהות ----
  identity: {
    // סדר ה-DOM הוא הגדרות, טקסט, תמונה — ולכן כאן דווקא row ולא
    // row-reverse: כך ההגדרות נוחתות בשמאל והתמונה בימין, כמו שצריך
    // להיראות בעברית
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  identityText: { flex: 1, gap: 1 },
  greeting: { ...type.small, color: colors.textSecondary },
  photo: { width: 76, height: 76, borderRadius: radius.lg, backgroundColor: colors.mossSoft },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  gear: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },

  // ---- כרטיס הפעילות האחרונה ----
  hero: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.sage,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.raised,
  },
  heroMedallion: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: { ...type.caption, color: 'rgba(255,255,255,0.8)' },
  heroTitle: { ...type.h2, color: colors.white, marginTop: 1 },
  heroMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 },
  heroMeta: { ...type.caption, color: 'rgba(255,255,255,0.85)' },
  endSleep: {
    minHeight: TOUCH - 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endSleepText: { ...type.smallStrong, color: colors.sage },

  // ---- תיעוד מהיר ----
  quickRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md },
  quickOuter: { flex: 1 },
  quick: {
    flex: 1,
    minHeight: 84,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    ...shadow.soft,
  },
  quickActive: { backgroundColor: colors.skySoft },
  quickLogged: { backgroundColor: colors.successSoft },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { ...type.caption, color: colors.text, fontWeight: '600', textAlign: 'center' },

  // ---- משימות התרופות ----
  missions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  missionOuter: { flexGrow: 1, flexBasis: '45%' },
  mission: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: TOUCH,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  missionDone: { backgroundColor: colors.successSoft, borderColor: colors.success },
  missionLabel: { flex: 1 },

  // ---- היום ----
  section: { marginTop: spacing.lg },
  statsRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    ...shadow.soft,
  },

  rhythmCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
    ...shadow.soft,
  },
  rhythmBars: { flexDirection: 'row-reverse', alignItems: 'flex-end', height: 56, gap: 4 },
  rhythmCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  rhythmBar: { width: '100%', borderRadius: radius.xs, minHeight: 3 },
  rhythmAxis: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 2 },

  // ---- משפחה ----
  family: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadow.soft,
  },
  familyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
