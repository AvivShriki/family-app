import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useBabyProfile } from '../hooks/useBabyProfile';
import { FamilyEvent, ShoppingItem, BabyLog } from '../types';
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

// מחוץ לקומפוננטה: Date.now ישירות בגוף הרנדר נחשב קריאה לא-טהורה
function latestLog(logs: BabyLog[]): BabyLog | undefined {
  const now = Date.now();
  return logs.find((l) => l.timestamp <= now);
}

function timeAgo(ts: number): string {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'ממש עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `לפני ${diffHours} שע'`;
  return 'לפני יותר מיום';
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
  const { user, logout } = useAuth();
  const displayName = user?.email?.split('@')[0] ?? 'משפחה';

  const { items: events } = useCollection<FamilyEvent>('events', 'date', 'asc');
  const { items: shoppingItems } = useCollection<ShoppingItem>('shoppingList', 'createdAt', 'desc');
  const { items: babyLogs } = useCollection<BabyLog>('babyLogs', 'timestamp', 'desc');
  const { profile } = useBabyProfile();

  const dateLine = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // --- סטטוס התינוקת: פעולה אחרונה + משימות היום ---
  const statusText = useMemo(() => lastLogText(latestLog(babyLogs)), [babyLogs]);
  const todayBabyLogs = useMemo(
    () => babyLogs.filter((l) => isSameDay(l.timestamp, new Date())),
    [babyLogs],
  );
  const vitaminDone = todayBabyLogs.some((l) => l.type === 'vitamin');
  const ironDone = todayBabyLogs.some((l) => l.type === 'iron');

  // --- לוח שנה: אירוע היום, או הקרוב הבא ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEvent = events.find((e) => e.date === todayStr);
  const nextEvent = events.find((e) => e.date > todayStr);
  const calendarTitle = todayEvent ? `היום: ${todayEvent.title}` : 'היום אין כלום — נהנים 🙌';
  const calendarSub = nextEvent
    ? `הקרוב: ${nextEvent.title} · ${new Date(nextEvent.date).toLocaleDateString('he-IL', { weekday: 'long' })}`
    : 'אין אירועים קרובים בלוח';

  // --- קניות: כמה פתוחים + מה הם ---
  const openItems = shoppingItems.filter((i) => !i.checked);
  const shoppingTitle = openItems.length > 0 ? `${openItems.length} דברים מחכים בסופר` : 'הכול קנוי 🎉';
  const shoppingSub = openItems.length > 0
    ? openItems.slice(0, 3).map((i) => i.text).join(' · ')
    : 'הרשימה ריקה ומחכה לסיבוב הבא';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}, {displayName} ☀️</Text>
          <Text style={styles.dateLine}>{dateLine}</Text>
        </View>
        <TouchableOpacity onPress={logout} hitSlop={8}>
          <Text style={styles.logoutText}>יציאה</Text>
        </TouchableOpacity>
      </View>

      {/* כרטיס התינוקת — הכוכבת של המסך */}
      <TouchableOpacity
        style={styles.babyCard}
        onPress={() => navigation.navigate('Baby')}
        activeOpacity={0.85}
      >
        <View style={styles.babyTopRow}>
          <View style={styles.babyAvatar}>
            <Text style={styles.babyAvatarEmoji}>👶</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.babyName}>{profile.name} 🌸</Text>
            <Text style={styles.babyAge}>{getAgeText(profile.birthDate)}</Text>
          </View>
          <Text style={styles.chevron}>‹</Text>
        </View>

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
      </TouchableOpacity>

      {/* לוח שנה */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Events')}
        activeOpacity={0.85}
      >
        <View style={[styles.cardIcon, { backgroundColor: colors.pink }]}>
          <Ionicons name="calendar-outline" size={22} color={colors.pinkAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{calendarTitle}</Text>
          <Text style={styles.cardSub}>{calendarSub}</Text>
        </View>
        <Text style={styles.chevron}>‹</Text>
      </TouchableOpacity>

      {/* קניות */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Shopping')}
        activeOpacity={0.85}
      >
        <View style={[styles.cardIcon, { backgroundColor: colors.blue }]}>
          <Ionicons name="cart-outline" size={22} color={colors.blueAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{shoppingTitle}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>{shoppingSub}</Text>
        </View>
        <Text style={styles.chevron}>‹</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: font.titleLg, fontWeight: font.weight.heavy, color: colors.text },
  dateLine: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
  logoutText: { color: colors.textMuted, fontSize: font.small, paddingTop: 6 },

  babyCard: {
    backgroundColor: colors.pink,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  babyTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  babyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  babyAvatarEmoji: { fontSize: 24 },
  babyName: { fontSize: font.title, fontWeight: font.weight.heavy, color: colors.text },
  babyAge: { fontSize: font.small, color: colors.textLight, marginTop: 1 },

  statusChip: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  statusChipText: { fontSize: font.small, fontWeight: font.weight.semibold, color: colors.text },

  missionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  missionChip: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  missionDone: { backgroundColor: '#E8F8EE' },
  missionText: { fontSize: font.caption + 1, fontWeight: font.weight.semibold, color: colors.textMuted },
  missionTextDone: { color: '#2E7D32' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadow.soft,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: font.body, fontWeight: font.weight.bold, color: colors.text },
  cardSub: { fontSize: font.small, color: colors.textLight, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
});
