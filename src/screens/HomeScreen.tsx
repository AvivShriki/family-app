import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { FamilyEvent, ShoppingItem, BabyLog } from '../types';
import { colors, spacing, radius, shadow } from '../config/theme';

interface Props {
  navigation: any;
}

const BABY_LOG_LABELS: Record<BabyLog['type'], string> = {
  feeding: 'האכלה',
  sleep: 'שינה',
  diaper: 'חיתול',
  vitamin: 'ויטמין D',
  iron: 'ברזל',
  note: 'הערה',
};

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

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const displayName = user?.email?.split('@')[0] ?? 'שלום';

  const { items: events } = useCollection<FamilyEvent>('events', 'date', 'asc');
  const { items: shoppingItems } = useCollection<ShoppingItem>('shoppingList', 'createdAt', 'desc');
  const { items: babyLogs } = useCollection<BabyLog>('babyLogs', 'timestamp', 'desc');

  const calendarSubtitle = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const nextEvent = events.find((e) => e.date >= todayStr);
    if (!nextEvent) return 'אין אירועים קרובים';
    const dateLabel = new Date(nextEvent.date).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
    return `הקרוב: ${nextEvent.title} · ${dateLabel}`;
  }, [events]);

  const shoppingSubtitle = useMemo(() => {
    const openCount = shoppingItems.filter((i) => !i.checked).length;
    return openCount > 0 ? `${openCount} פריטים לקנייה` : 'הרשימה ריקה';
  }, [shoppingItems]);

  const babySubtitle = useMemo(() => {
    const lastLog = latestLog(babyLogs);
    if (!lastLog) return 'אין רישומים עדיין';
    return `${BABY_LOG_LABELS[lastLog.type] ?? lastLog.type} · ${timeAgo(lastLog.timestamp)}`;
  }, [babyLogs]);

  const options = [
    {
      route: 'Events',
      title: 'לוח שנה',
      subtitle: calendarSubtitle,
      bg: colors.pink,
      iconColor: colors.pinkAccent,
      icon: (color: string) => <Ionicons name="calendar-outline" size={26} color={color} />,
    },
    {
      route: 'Shopping',
      title: 'רשימת קניות',
      subtitle: shoppingSubtitle,
      bg: colors.blue,
      iconColor: colors.blueAccent,
      icon: (color: string) => <Ionicons name="cart-outline" size={26} color={color} />,
    },
    {
      route: 'Baby',
      title: 'מעקב תינוק',
      subtitle: babySubtitle,
      bg: colors.creamDark,
      iconColor: colors.textLight,
      icon: (color: string) => (
        <MaterialCommunityIcons name="baby-face-outline" size={26} color={color} />
      ),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>שלום, {displayName} 👋</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>יציאה</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.route}
            style={styles.row}
            onPress={() => navigation.navigate(opt.route)}
          >
            <Text style={styles.chevron}>‹</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{opt.title}</Text>
              <Text style={styles.rowSubtitle}>{opt.subtitle}</Text>
            </View>
            <View style={[styles.iconCircle, { backgroundColor: opt.bg }]}>
              {opt.icon(opt.iconColor)}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
  logoutText: { color: colors.textMuted, fontSize: 14 },
  list: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.soft,
  },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'right' },
  rowSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 2, textAlign: 'right' },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
