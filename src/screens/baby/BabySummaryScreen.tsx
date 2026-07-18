import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useCollection } from '../../hooks/useCollection';
import { BabyLog } from '../../types';
import { colors, spacing, radius, shadow } from '../../config/theme';
import { fmtDuration, isSameDay } from '../../utils/dates';

export default function BabySummaryScreen() {
  const { items: allLogs } = useCollection<BabyLog>('babyLogs', 'timestamp', 'asc');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const logs = useMemo(
    () => allLogs.filter((l) => isSameDay(l.timestamp, selectedDate)),
    [allLogs, selectedDate],
  );

  const isToday = isSameDay(selectedDate.getTime(), new Date());
  const goDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  // Compute stats
  const feedings = logs.filter((l) => l.type === 'feeding');
  const totalMl = feedings.reduce((s, l) => s + (l.amountMl ?? 0), 0);

  const sleeps = logs.filter((l) => l.type === 'sleep' && l.endTimestamp);
  const totalSleepMs = sleeps.reduce((s, l) => s + ((l.endTimestamp ?? 0) - l.timestamp), 0);

  const diapers = logs.filter((l) => l.type === 'diaper');
  const vitaminDone = logs.some((l) => l.type === 'vitamin');
  const ironDone = logs.some((l) => l.type === 'iron');

  const stats: { emoji: string; value: string; label: string; color: string }[] = [
    { emoji: '🍼', value: String(feedings.length), label: 'ארוחות', color: colors.pink },
    { emoji: '💧', value: `${totalMl}`, label: 'מ"ל סה"כ', color: colors.blue },
    { emoji: '😴', value: fmtDuration(totalSleepMs), label: 'שינה', color: '#BDE0FE' },
    { emoji: '🌙', value: String(sleeps.length), label: 'תנומות', color: '#D4C5F9' },
    { emoji: '💩', value: String(diapers.length), label: 'חיתולים', color: '#FFF3CD' },
  ];

  return (
    <View style={styles.container}>
      {/* Date nav */}
      <View style={styles.dateBar}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDay(1)}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDay(-1)} disabled={isToday}>
          <Text style={[styles.arrow, isToday && styles.arrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.color }]}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Missions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>משימות יומיות</Text>
          <View style={styles.missionsRow}>
            <MissionTile done={vitaminDone} emoji="☀️" label="ויטמין D" />
            <MissionTile done={ironDone} emoji="💧" label="ברזל" />
          </View>
        </View>

        {/* Sleep breakdown */}
        {sleeps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תנומות</Text>
            {sleeps.map((s) => {
              const dur = fmtDuration((s.endTimestamp ?? s.timestamp) - s.timestamp);
              const start = new Date(s.timestamp).toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const end = new Date(s.endTimestamp!).toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <View key={s.id} style={styles.sleepRow}>
                  <Text style={styles.sleepEmoji}>😴</Text>
                  <Text style={styles.sleepText}>
                    {start} – {end}
                  </Text>
                  <Text style={styles.sleepDur}>{dur}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MissionTile({ done, emoji, label }: { done: boolean; emoji: string; label: string }) {
  return (
    <View style={[styles.missionTile, done && styles.missionDone]}>
      <Text style={styles.missionEmoji}>{emoji}</Text>
      <Text style={[styles.missionLabel, done && styles.missionLabelDone]}>{label}</Text>
      <Text style={styles.missionStatus}>{done ? '✓ בוצע' : '— טרם בוצע'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrowBtn: { padding: spacing.sm },
  arrow: { fontSize: 28, color: colors.pinkAccent, fontWeight: '300' },
  arrowDisabled: { color: colors.border },
  dateText: { fontSize: 16, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: 40 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    width: '31%',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.soft,
  },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textLight, marginTop: 2 },

  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  missionsRow: { flexDirection: 'row', gap: spacing.sm },
  missionTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  missionDone: { backgroundColor: '#F0FFF4', borderColor: colors.success },
  missionEmoji: { fontSize: 28, marginBottom: 4 },
  missionLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  missionLabelDone: { color: '#2E7D32' },
  missionStatus: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  sleepEmoji: { fontSize: 20 },
  sleepText: { flex: 1, fontSize: 14, color: colors.text },
  sleepDur: { fontSize: 13, fontWeight: '600', color: colors.blueAccent },
});
