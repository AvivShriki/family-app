import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, shadow } from '../config/theme';

interface Props {
  navigation: any;
}

const OPTIONS = [
  {
    route: 'Events',
    title: 'לוח שנה',
    subtitle: 'האירועים המשותפים שלכם',
    bg: colors.pink,
    iconColor: colors.pinkAccent,
    icon: (color: string) => <Ionicons name="calendar-outline" size={26} color={color} />,
  },
  {
    route: 'Shopping',
    title: 'רשימת קניות',
    subtitle: 'קניות משותפות בזמן אמת',
    bg: colors.blue,
    iconColor: colors.blueAccent,
    icon: (color: string) => <Ionicons name="cart-outline" size={26} color={color} />,
  },
  {
    route: 'Baby',
    title: 'מעקב תינוק',
    subtitle: 'האכלות, שינה וחיתולים',
    bg: colors.creamDark,
    iconColor: colors.textLight,
    icon: (color: string) => <MaterialCommunityIcons name="baby-face-outline" size={26} color={color} />,
  },
];

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const displayName = user?.email?.split('@')[0] ?? 'שלום';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>שלום, {displayName} 👋</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>יציאה</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {OPTIONS.map((opt) => (
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
    width: 52, height: 52, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
});
