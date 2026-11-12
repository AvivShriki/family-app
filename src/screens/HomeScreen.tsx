import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useBabyLogs } from '../context/BabyLogsContext';
import { useMessages } from '../context/MessagesContext';
import { useMedications } from '../context/MedicationsContext';
import { useBabyProfile, DEFAULT_PROFILE } from '../hooks/useBabyProfile';
import { BabyLog } from '../types';
import { colors, spacing, radius, shadow, font } from '../config/theme';
import { getAgeText, isSameDay } from '../utils/dates';

interface Props {
  navigation: any;
}

/** תקרת אריחי התיעוד המהיר. מעבר לזה הרשת נשפכת מתחת לקיפול. */
const MAX_TILES = 6;
/** חלון החרטה אחרי רישום בנגיעה */
const UNDO_MS = 4000;

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

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { items: babyLogs, add, remove, update } = useBabyLogs();
  const { messages } = useMessages();
  const { medications, activeToday } = useMedications();
  const { profile } = useBabyProfile();

  // הרישום האחרון שנוצר בנגיעה, לחלון החרטה
  const [justLogged, setJustLogged] = useState<{ tile: string; id: string } | null>(null);

  const todayLogs = useMemo(
    () => babyLogs.filter((l) => isSameDay(l.timestamp, new Date())),
    [babyLogs],
  );

  const lastLog = babyLogs[babyLogs.length - 1];
  const statusText = lastLogText(
    lastLog,
    medications.find((m) => m.id === lastLog?.medicationId)?.name,
  );

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
    emoji: m.emoji,
    label: m.name,
    done: todayLogs.some((l) => l.type === 'medication' && l.medicationId === m.id),
  }));
  const shownMeds = medTiles.slice(0, MAX_TILES - 3);
  const overflow = medTiles.length - shownMeds.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* זהות — שורה אחת ולא כרטיס. נוי יודעת מי התינוקת. */}
      <View style={styles.identity}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Baby', { screen: 'BabySettings' })}
          accessibilityLabel="פרופיל התינוקת"
          activeOpacity={0.8}
        >
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarEmoji}>👶</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.greeting} numberOfLines={1}>
            {profile.familyName?.trim()
              ? `${greeting()}, משפחת ${profile.familyName.trim()}`
              : greeting()}
          </Text>
          <Text style={styles.identityName} numberOfLines={1}>
            {profile.name}
            {profile.birthDate ? ` · ${getAgeText(profile.birthDate)}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Baby', { screen: 'BabySettings' })}
          accessibilityLabel="הגדרות"
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={19} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* עכשיו — השאלה שהורים באמת שואלים זה את זה */}
      <View style={styles.now}>
        <Text style={styles.nowLabel}>עכשיו</Text>
        <Text style={styles.nowValue}>{statusText}</Text>
      </View>

      {/* תיעוד מהיר — נגיעה אחת רושמת. זו סיבת הקיום של המסך. */}
      <View style={styles.tiles}>
        <Tile
          emoji="🍼"
          label="ארוחה"
          state={justLogged?.tile === 'feeding' ? 'logged' : 'idle'}
          onPress={() => quickLog('feeding', { type: 'feeding', timestamp: Date.now(), loggedBy })}
          onUndo={undo}
        />
        <Tile
          emoji="💩"
          label="חיתול"
          state={justLogged?.tile === 'diaper' ? 'logged' : 'idle'}
          onPress={() => quickLog('diaper', { type: 'diaper', timestamp: Date.now(), loggedBy })}
          onUndo={undo}
        />
        <Tile
          emoji="😴"
          label={openSleep ? 'סיום שינה' : 'שינה'}
          state={justLogged?.tile === 'sleep' ? 'logged' : openSleep ? 'active' : 'idle'}
          onPress={tapSleep}
          onUndo={undo}
        />

        {shownMeds.map((t) => (
          <Tile
            key={t.key}
            emoji={t.emoji}
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
          <Tile
            emoji="💊"
            label={`עוד ${overflow} ›`}
            state="idle"
            onPress={() => navigation.navigate('Baby', { screen: 'BabyDay' })}
          />
        ) : null}
      </View>

      {/* היום — מונים ומשימות בבלוק אחד */}
      <View style={styles.block}>
        <View style={styles.blockHead}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Baby', { screen: 'BabyDay' })}
            hitSlop={8}
          >
            <Text style={styles.blockLink}>כל היומן ›</Text>
          </TouchableOpacity>
          <Text style={styles.blockTitle}>היום</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat value={String(meals)} label="ארוחות" />
          <Stat value={sleepMs > 0 ? shortDuration(sleepMs) : '—'} label="שינה" />
          <Stat value={String(diapers)} label="חיתולים" />
        </View>
      </View>

      {/* הודעות המשפחה */}
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => navigation.navigate('Chat')}
        accessibilityLabel="הודעות למשפחה"
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={20} color={colors.blueAccent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.chatTitle}>הודעות למשפחה</Text>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {messages[messages.length - 1]?.text ?? 'עוד אין הודעות — אפשר להשאיר אחת'}
          </Text>
        </View>
        <Text style={styles.chevron}>‹</Text>
      </TouchableOpacity>

      {/* שירותים עתידיים — שורת טקסט, במקום שני כפתורים מתים ברבע מהמסך */}
      <Text style={styles.soon}>
        בקרוב: {profile.name !== DEFAULT_PROFILE.name ? `שאלה על ${profile.name}` : 'שאלות'} ושיחה
        עם רופא
      </Text>
    </ScrollView>
  );
}

function Tile({
  emoji,
  label,
  state,
  onPress,
  onUndo,
}: {
  emoji: string;
  label: string;
  state: 'idle' | 'logged' | 'done' | 'active';
  onPress: () => void;
  onUndo?: () => void;
}) {
  if (state === 'logged') {
    return (
      <TouchableOpacity
        style={[styles.tile, styles.tileDone]}
        onPress={onUndo}
        accessibilityLabel={`${label} נרשם, ביטול`}
      >
        <Text style={styles.tileEmoji}>✓</Text>
        <Text style={styles.tileLabel} numberOfLines={1}>
          נרשם · ביטול
        </Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      style={[
        styles.tile,
        state === 'active' && styles.tileActive,
        state === 'done' && styles.tileDone,
      ]}
      onPress={onPress}
      accessibilityLabel={`תיעוד ${label}`}
      activeOpacity={0.8}
    >
      <Text style={styles.tileEmoji}>{emoji}</Text>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {state === 'done' ? `✓ ${label}` : label}
      </Text>
    </TouchableOpacity>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const AVATAR = 44;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 },
  avatarPlaceholder: {
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: AVATAR / 2 },
  greeting: {
    fontSize: font.body,
    fontWeight: font.weight.medium,
    color: colors.textLight,
    textAlign: 'right',
  },
  identityName: {
    fontSize: font.title,
    fontWeight: font.weight.heavy,
    color: colors.text,
    textAlign: 'right',
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  now: {
    backgroundColor: colors.pink,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  // טקסט בהיר על ורוד נופל מהתקן — ההפרדה כאן היא בגודל ובמשקל
  nowLabel: { fontSize: font.caption, color: colors.text, textAlign: 'right' },
  nowValue: {
    fontSize: font.title,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'right',
    marginTop: 2,
  },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    minHeight: 76,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  tileActive: { borderColor: colors.blueAccent, backgroundColor: colors.blue },
  tileDone: { backgroundColor: colors.successSoft, borderColor: colors.success },
  tileEmoji: { fontSize: font.titleLg },
  tileLabel: {
    fontSize: font.small,
    fontWeight: font.weight.semibold,
    color: colors.text,
    marginTop: 2,
  },

  block: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  blockHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  blockTitle: { fontSize: font.bodyLg, fontWeight: font.weight.bold, color: colors.text },
  blockLink: { fontSize: font.small, color: colors.blueAccent },

  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: font.titleLg, fontWeight: font.weight.bold, color: colors.text },
  statLabel: { fontSize: font.caption, color: colors.textLight, marginTop: 2 },

  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.soft,
  },
  chatTitle: {
    fontSize: font.body,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'right',
  },
  chatPreview: { fontSize: font.small, color: colors.textLight, textAlign: 'right', marginTop: 2 },
  chevron: { fontSize: font.title, color: colors.textMuted },

  soon: {
    fontSize: font.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
