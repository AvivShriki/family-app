import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, shadow } from '../config/theme';

interface Props {
  navigation: any;
}

const LIBI_BIRTH = new Date('2026-01-30'); // ליבי נולדה ינואר 2026 (5 חודשים)

function getAge() {
  const now = new Date();
  const months =
    (now.getFullYear() - LIBI_BIRTH.getFullYear()) * 12 +
    (now.getMonth() - LIBI_BIRTH.getMonth());
  const days = Math.floor((now.getTime() - LIBI_BIRTH.getTime()) / (1000 * 60 * 60 * 24));
  return { months, days };
}

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { months, days } = getAge();
  const displayName = user?.email?.split('@')[0] ?? 'שלום';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>שלום, {displayName} 👋</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>יציאה</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.libiCard}>
        <Text style={styles.libiEmoji}>👶</Text>
        <View>
          <Text style={styles.libiName}>ליבי שלנו</Text>
          <Text style={styles.libiAge}>
            {months} חודשים ו-{days % 30} ימים
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>מה תרצה לפתוח?</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: colors.pink }]}
          onPress={() => navigation.navigate('Events')}
        >
          <Text style={styles.tileEmoji}>📅</Text>
          <Text style={styles.tileLabel}>לוח שנה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tile, { backgroundColor: colors.blue }]}
          onPress={() => navigation.navigate('Shopping')}
        >
          <Text style={styles.tileEmoji}>🛒</Text>
          <Text style={styles.tileLabel}>קניות</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tile, styles.tileFull, { backgroundColor: colors.creamDark }]}
          onPress={() => navigation.navigate('Baby')}
        >
          <Text style={styles.tileEmoji}>🍼</Text>
          <Text style={styles.tileLabel}>מעקב ליבי</Text>
        </TouchableOpacity>
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
  libiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
    ...shadow.soft,
  },
  libiEmoji: { fontSize: 48 },
  libiName: { fontSize: 20, fontWeight: '700', color: colors.text },
  libiAge: { fontSize: 14, color: colors.textLight, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    ...shadow.soft,
  },
  tileFull: { width: '100%', flex: undefined, aspectRatio: undefined, flexDirection: 'row', gap: spacing.md },
  tileEmoji: { fontSize: 36, marginBottom: spacing.sm },
  tileLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
});
