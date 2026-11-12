import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useBabyLogs } from '../context/BabyLogsContext';
import { useMessages } from '../context/MessagesContext';
import { useMedications } from '../context/MedicationsContext';
import { useBabyProfile } from '../hooks/useBabyProfile';
import { useNow } from '../hooks/useNow';
import BabyAvatar from '../components/BabyAvatar';
import PressScale from '../components/PressScale';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import ActivityIcon from '../components/ActivityIcon';
import { BabyLog } from '../types';
import { activityMeta, medIcon, MCIcon } from '../config/activity';
import { colors, spacing, radius, shadow, type, TOUCH, CONTENT_MAX } from '../config/theme';
import { getAgeText, isSameDay, fmtTime } from '../utils/dates';

interface Props {
  navigation: any;
}

/** תקרת אריחי התיעוד המהיר. מעבר לזה הרשת נשפכת מתחת לקיפול. */
const MAX_TILES = 6;
/** חלון החרטה אחרי רישום בנגיעה */
const UNDO_MS = 4000;

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
  if (h < 24) return `לפני ${h} שע׳`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
}

const DIAPER_LABEL: Record<NonNullable<BabyLog['diaperType']>, string> = {
  wet: 'שתן',
  dirty: 'קקי',
  both: 'שתן + קקי',
};

/** הפרטים שמוסיפים מידע לפעילות האחרונה, מעבר לשם שלה ולשעה */
function detailOf(log: BabyLog, medName?: string): string {
  switch (log.type) {
    case 'feeding':
      return log.amountMl ? `${log.amountMl} מ"ל` : 'הנקה';
    case 'diaper':
      return log.diaperType ? DIAPER_LABEL[log.diaperType] : '';
    case 'sleep':
      return log.endTimestamp
        ? `${shortDuration(log.endTimestamp - log.timestamp)} שינה`
        : 'עוד ישנה';
    case 'medication':
      // שם התרופה כבר מוצג ככותרת הכרטיס — אין טעם לחזור עליו בשורת הפרטים
      return '';
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

  // שלושת הבסיסיים ואחריהם התרופות, עד התקרה; העודף מקופל לאריח אחד
  const medTiles = activeToday.map((m) => ({
    key: m.id,
    icon: medIcon(m.emoji),
    label: m.name,
    done: todayLogs.some((l) => l.type === 'medication' && l.medicationId === m.id),
  }));
  const shownMeds = medTiles.slice(0, MAX_TILES - 3);
  const overflow = medTiles.length - shownMeds.length;

  const lastMessage = messages[messages.length - 1];
  const goSettings = () => navigation.navigate('Baby', { screen: 'BabySettings' });
  const goJournal = () => navigation.navigate('Baby', { screen: 'BabyDay' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xl + insets.bottom }}
    >
      {/* ---- כותרת: הפס היחיד בגוון המותג, והעוגן החזותי של האפליקציה ---- */}
      <View style={[styles.band, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.bandRow}>
          <TouchableOpacity
            onPress={goSettings}
            accessibilityRole="button"
            accessibilityLabel={`הפרופיל של ${profile.name}`}
            activeOpacity={0.85}
          >
            <BabyAvatar size={60} ring />
          </TouchableOpacity>

          <View style={styles.bandText}>
            <Text style={styles.greeting} numberOfLines={1}>
              {profile.familyName?.trim()
                ? `${greeting(now)}, משפחת ${profile.familyName.trim()}`
                : greeting(now)}
            </Text>
            <Text style={styles.babyName} numberOfLines={1}>
              {profile.name}
            </Text>
            <Text style={styles.babyAge} numberOfLines={1}>
              {getAgeText(profile.birthDate)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bandIcon}
            onPress={goSettings}
            accessibilityRole="button"
            accessibilityLabel="הגדרות"
          >
            <Ionicons name="settings-outline" size={21} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {/* ---- הפעילות האחרונה — השאלה שהורים שואלים זה את זה ---- */}
        <LastActivity
          log={lastLog}
          now={now}
          medName={lastMedName}
          openSleep={openSleep}
          onEndSleep={tapSleep}
          onPress={goJournal}
        />

        {/* ---- תיעוד מהיר: נגיעה אחת רושמת. סיבת הקיום של המסך. ---- */}
        <View style={styles.section}>
          <SectionHeader title="תיעוד מהיר" />
          <View style={styles.tiles}>
            <Tile
              type="feeding"
              label="ארוחה"
              state={justLogged?.tile === 'feeding' ? 'logged' : 'idle'}
              onPress={() =>
                quickLog('feeding', { type: 'feeding', timestamp: Date.now(), loggedBy })
              }
              onUndo={undo}
            />
            <Tile
              type="diaper"
              label="חיתול"
              state={justLogged?.tile === 'diaper' ? 'logged' : 'idle'}
              onPress={() =>
                quickLog('diaper', { type: 'diaper', timestamp: Date.now(), loggedBy })
              }
              onUndo={undo}
            />
            <Tile
              type="sleep"
              label={openSleep ? 'סיום שינה' : 'שינה'}
              state={justLogged?.tile === 'sleep' ? 'logged' : openSleep ? 'active' : 'idle'}
              onPress={tapSleep}
              onUndo={undo}
            />

            {shownMeds.map((t) => (
              <Tile
                key={t.key}
                type="medication"
                icon={t.icon}
                label={t.label}
                state={justLogged?.tile === t.key ? 'logged' : t.done ? 'done' : 'idle'}
                onPress={() =>
                  quickLog(t.key, {
                    type: 'medication',
                    medicationId: t.key,
                    timestamp: Date.now(),
                    loggedBy,
                  })
                }
                onUndo={undo}
              />
            ))}

            {overflow > 0 ? (
              <Tile type="medication" label={`עוד ${overflow}`} state="idle" onPress={goJournal} />
            ) : null}
          </View>
        </View>

        {/* ---- סיכום היום ---- */}
        <View style={styles.section}>
          <SectionHeader title="היום" actionLabel="כל היומן" onAction={goJournal} />
          <View style={styles.stats}>
            <StatCard
              icon={activityMeta('feeding').icon}
              color={activityMeta('feeding').color}
              surface={activityMeta('feeding').surface}
              value={String(meals)}
              label="ארוחות"
            />
            <StatCard
              icon={activityMeta('sleep').icon}
              color={activityMeta('sleep').color}
              surface={activityMeta('sleep').surface}
              value={sleepMs > 0 ? shortDuration(sleepMs) : '—'}
              label="שינה"
            />
            <StatCard
              icon={activityMeta('diaper').icon}
              color={activityMeta('diaper').color}
              surface={activityMeta('diaper').surface}
              value={String(diapers)}
              label="חיתולים"
            />
          </View>
        </View>

        {/* ---- עדכוני המשפחה ---- */}
        <View style={styles.section}>
          <SectionHeader title="המשפחה" />
          <PressScale
            to={0.99}
            onPress={() => navigation.navigate('Chat')}
            accessibilityRole="button"
            accessibilityLabel="הודעות למשפחה"
          >
            <View style={styles.chat}>
              <View style={styles.chatIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.sage} />
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
        </View>

        {/* ---- שירותים שעוד לא נפתחו. מסומנים כך במקום להיראות שבורים. ---- */}
        <View style={styles.section}>
          <SectionHeader title="בקרוב" />
          <View style={styles.soonRow}>
            <SoonTile icon="robot-outline" label="שאל סוכן AI" />
            <SoonTile icon="stethoscope" label="שיחה עם רופא" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * כרטיס הפעילות האחרונה.
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
    const meta = activityMeta('sleep');
    return (
      <View style={[styles.last, styles.lastSleeping]}>
        <ActivityIcon
          icon={meta.icon}
          color={colors.white}
          surface="rgba(255,255,255,0.18)"
          size={48}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.sleepingLabel}>ישנה עכשיו</Text>
          <Text style={styles.sleepingValue}>
            {shortDuration(now - openSleep.timestamp)} · נרדמה ב-
            {fmtTime(openSleep.timestamp)}
          </Text>
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
      <View style={styles.last}>
        <ActivityIcon
          icon="baby-carriage"
          color={colors.sage}
          surface={colors.sageSoft}
          size={48}
        />
        <View style={{ flex: 1 }}>
          <Text style={type.label}>הפעילות האחרונה</Text>
          <Text style={type.h3}>עוד אין תיעוד</Text>
          <Text style={type.small}>נגיעה באריח למטה רושמת את הראשון</Text>
        </View>
      </View>
    );
  }

  const meta = activityMeta(log.type);
  const title = log.type === 'medication' && medName ? medName : meta.label;
  const detail = detailOf(log, medName);

  return (
    <PressScale
      to={0.99}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`הפעילות האחרונה: ${title}, ${timeAgo(log.timestamp, now)}. פתיחת היומן`}
    >
      <View style={styles.last}>
        <ActivityIcon icon={meta.icon} color={meta.color} surface={meta.surface} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={type.label}>הפעילות האחרונה</Text>
          <Text style={type.h3}>{title}</Text>
          <Text style={type.small}>
            {timeAgo(log.timestamp, now)}
            {detail ? ` · ${detail}` : ''}
          </Text>
        </View>
        <View style={styles.lastTime}>
          <Text style={styles.lastTimeText}>{fmtTime(log.timestamp)}</Text>
        </View>
      </View>
    </PressScale>
  );
}

/**
 * אריח תיעוד בנגיעה אחת.
 *
 * ארבעה מצבים: רגיל, נרשם-כרגע (ולכן אפשר לבטל), בוצע היום (תרופה),
 * ופעיל (שינה שנפתחה). בכל מצב הסימון הוא גם צורני וגם טקסטואלי.
 */
function Tile({
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
  state: 'idle' | 'logged' | 'done' | 'active';
  onPress: () => void;
  onUndo?: () => void;
}) {
  const meta = activityMeta(logType);

  if (state === 'logged') {
    return (
      <PressScale
        onPress={onUndo}
        accessibilityRole="button"
        // לא `${label} נרשם`: אחרי פתיחת שינה התווית כבר התחלפה ל"סיום
        // שינה", והיה נקרא "סיום שינה נרשם"
        accessibilityLabel="התיעוד נרשם. נגיעה מבטלת"

        style={styles.tileOuter}
      >
        <View style={[styles.tile, styles.tileLogged]}>
          <ActivityIcon
            icon="check"
            color={colors.success}
            surface={colors.successSoft}
            size={38}
            square
          />
          <Text style={styles.tileLabel} numberOfLines={1}>
            נרשם
          </Text>
          <Text style={styles.tileUndo}>ביטול</Text>
        </View>
      </PressScale>
    );
  }

  const active = state === 'active';
  const done = state === 'done';

  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={done ? `${label}, ניתנה היום` : `תיעוד ${label}`}
      style={styles.tileOuter}
    >
      <View style={[styles.tile, active && styles.tileActive, done && styles.tileDone]}>
        <ActivityIcon
          icon={icon ?? meta.icon}
          color={active ? colors.white : meta.color}
          surface={active ? 'rgba(255,255,255,0.2)' : meta.surface}
          size={38}
          square
        />
        <Text style={[styles.tileLabel, active && { color: colors.white }]} numberOfLines={1}>
          {label}
        </Text>
        {done ? <Text style={styles.tileDoneMark}>בוצע היום</Text> : null}
      </View>
    </PressScale>
  );
}

function SoonTile({ icon, label }: { icon: MCIcon; label: string }) {
  return (
    <View style={styles.soon} accessibilityLabel={`${label} — בקרוב`}>
      {/* בלי המילה "בקרוב" על כל אריח — כותרת האזור כבר אומרת אותה,
          וברוחב של טלפון היא דחקה את השם עצמו לשלוש נקודות */}
      <MaterialCommunityIcons name={icon} size={20} color={colors.textMuted} />
      <Text style={[type.smallStrong, styles.soonLabel]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  // ---- כותרת ----
  band: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.md,
    // הפינה התחתונה המעוגלת היא הקומפוזיציה האורגנית: הפס לא נגמר בקו
    // חד אלא נכנס לתוך הקרם, והכרטיס שמתחתיו נכנס לתוכו
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
    paddingBottom: spacing.xl + spacing.md,
  },
  bandRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },
  bandText: { flex: 1, gap: 1 },
  greeting: {
    ...type.small,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
  },
  babyName: { ...type.h1, color: colors.white },
  babyAge: { ...type.small, color: 'rgba(255,255,255,0.82)' },
  bandIcon: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // התוכן עולה לתוך הפס, כדי שהכרטיס הראשון ייראה מונח עליו
  body: {
    paddingHorizontal: spacing.md,
    marginTop: -spacing.xl,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },
  section: { marginTop: spacing.lg },

  // ---- פעילות אחרונה ----
  last: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadow.raised,
  },
  lastSleeping: { backgroundColor: colors.sageDeep },
  lastTime: {
    backgroundColor: colors.cream,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lastTimeText: { ...type.smallStrong, fontVariant: ['tabular-nums'] },
  sleepingLabel: { ...type.label, color: 'rgba(255,255,255,0.78)' },
  sleepingValue: { ...type.bodyStrong, color: colors.white },
  endSleep: {
    minHeight: TOUCH - 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endSleepText: { ...type.smallStrong, color: colors.sageDeep },

  // ---- אריחים ----
  tiles: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  tileOuter: { flexGrow: 1, flexBasis: '30%', minWidth: 98 },
  tile: {
    flex: 1,
    minHeight: 96,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tileActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  tileLogged: { backgroundColor: colors.successSoft, borderColor: colors.success },
  tileDone: { backgroundColor: colors.cream },
  tileLabel: { ...type.smallStrong, textAlign: 'center' },
  tileUndo: { ...type.caption, color: colors.success, fontWeight: '700' },
  tileDoneMark: { ...type.caption, color: colors.success },

  // ---- נתוני היום ----
  stats: { flexDirection: 'row-reverse', gap: spacing.sm },

  // ---- צ'אט ----
  chat: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadow.soft,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- בקרוב ----
  soonRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  soon: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: TOUCH + 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  soonLabel: { flex: 1, color: colors.textSecondary },
});
