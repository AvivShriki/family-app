import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCollection } from '../../hooks/useCollection';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import { BabyLog } from '../../types';
import { colors, spacing, radius, shadow } from '../../config/theme';
import AddLogModal from './AddLogModal';
import ConfirmModal from '../../components/ConfirmModal';

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(start: number, end: number) {
  const min = Math.round((end - start) / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')} שעות` : `${m} דק'`;
}

function isSameDay(ts: number, date: Date) {
  const d = new Date(ts);
  return d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate();
}

const LOG_META: Record<string, { emoji: string; label: string; bg: string }> = {
  feeding: { emoji: '🍼', label: 'ארוחה',     bg: '#FADADD' },
  sleep:   { emoji: '😴', label: 'שינה',      bg: '#BDE0FE' },
  diaper:  { emoji: '💩', label: 'חיתול',     bg: '#FFF3CD' },
  note:    { emoji: '📝', label: 'הערה',      bg: '#E8F5E9' },
  vitamin: { emoji: '☀️', label: 'ויטמין D',  bg: '#FFF8DC' },
  iron:    { emoji: '💧', label: 'ברזל',      bg: '#FFE4E1' },
};

const DIAPER_LABEL: Record<string, string> = {
  wet: 'שתן', dirty: 'קקי', both: 'שתן + קקי',
};

export default function BabyDayScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { items: allLogs, remove } = useCollection<BabyLog>('babyLogs', 'timestamp', 'asc');
  const { profile } = useBabyProfile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<BabyLog | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // When navigated from calendar with a specific date
  useEffect(() => {
    if (route.params?.dateStr) {
      setSelectedDate(new Date(route.params.dateStr));
    }
  }, [route.params?.dateStr]);

  // When navigated from the tab bar's "+" quick-add button
  useEffect(() => {
    if (route.params?.openAdd) {
      setAddModalVisible(true);
      navigation.setParams({ openAdd: false });
    }
  }, [route.params?.openAdd]);

  const todayLogs = useMemo(
    () => allLogs.filter((l) => isSameDay(l.timestamp, selectedDate)),
    [allLogs, selectedDate],
  );

  const missionsDone = {
    vitamin: todayLogs.some((l) => l.type === 'vitamin'),
    iron: todayLogs.some((l) => l.type === 'iron'),
  };

  const goDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const isToday = isSameDay(selectedDate.getTime(), new Date());

  const confirmDeleteLog = () => {
    if (deleteTargetId) remove(deleteTargetId);
    setDeleteTargetId(null);
  };

  const dateLabel = selectedDate.toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Date header */}
      <View style={styles.dateBar}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDay(1)}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.dateLabelWrap}>
          <Text style={styles.dateText}>{selectedDate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
          <Text style={styles.weekdayText}>{selectedDate.toLocaleDateString('he-IL', { weekday: 'long' })}</Text>
        </View>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDay(-1)} disabled={isToday}>
          <Text style={[styles.arrow, isToday && styles.arrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Baby card */}
        <View style={styles.babyCard}>
          <Text style={styles.babyName}>{profile.name} 🌸</Text>
          <Text style={styles.babyAge}>{getAgeText(profile.birthDate, selectedDate)}</Text>
        </View>

        {/* Missions */}
        <View style={styles.missionsRow}>
          <MissionChip done={missionsDone.iron}   emoji="💧" label="ברזל" />
          <MissionChip done={missionsDone.vitamin} emoji="☀️" label="ויטמין D" />
        </View>

        {/* Timeline */}
        {todayLogs.length === 0 ? (
          <Text style={styles.empty}>אין רשומות ליום זה</Text>
        ) : (
          todayLogs.map((log, i) => (
            <TimelineItem
              key={log.id}
              log={log}
              isLast={i === todayLogs.length - 1}
              onEdit={() => setEditTarget(log)}
              onLongPress={() => setDeleteTargetId(log.id)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.addBtnText}>+ הוסף אירוע</Text>
      </TouchableOpacity>

      <AddLogModal
        visible={addModalVisible || !!editTarget}
        onClose={() => { setAddModalVisible(false); setEditTarget(null); }}
        selectedDate={selectedDate}
        editLog={editTarget}
      />
      <ConfirmModal
        visible={!!deleteTargetId}
        title="מחיקת רשומה"
        message="למחוק רשומה זו?"
        onConfirm={confirmDeleteLog}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
}

function MissionChip({ done, emoji, label }: { done: boolean; emoji: string; label: string }) {
  return (
    <View style={[styles.mission, done && styles.missionDone]}>
      <Text style={styles.missionEmoji}>{emoji}</Text>
      <Text style={[styles.missionLabel, done && styles.missionLabelDone]}>{label}</Text>
      {done && <Text style={styles.missionCheck}>✓</Text>}
    </View>
  );
}

function TimelineItem({ log, isLast, onEdit, onLongPress }: {
  log: BabyLog; isLast: boolean; onEdit: () => void; onLongPress: () => void;
}) {
  const meta = LOG_META[log.type] ?? LOG_META.note;

  let detail = '';
  if (log.type === 'feeding' && log.amountMl) detail = `${log.amountMl} מ"ל`;
  if (log.type === 'sleep' && log.endTimestamp) {
    detail = `נרדמה ${fmtTime(log.timestamp)} · התעוררה ${fmtTime(log.endTimestamp)} · משך ${fmtDuration(log.timestamp, log.endTimestamp)}`;
  }
  if (log.type === 'diaper' && log.diaperType) detail = DIAPER_LABEL[log.diaperType] ?? '';
  if (log.details) detail += (detail ? ' · ' : '') + log.details;

  return (
    <TouchableOpacity style={styles.timelineRow} onLongPress={onLongPress} activeOpacity={0.75}>
      {/* Time + line */}
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{fmtTime(log.timestamp)}</Text>
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Card */}
      <View style={[styles.logCard, { borderLeftColor: meta.bg }]}>
        <View style={[styles.logIcon, { backgroundColor: meta.bg }]}>
          <Text style={styles.logEmoji}>{meta.emoji}</Text>
        </View>
        <View style={styles.logBody}>
          <Text style={styles.logTitle}>{meta.label}</Text>
          {detail ? <Text style={styles.logDetail}>{detail}</Text> : null}
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit} hitSlop={8}>
          <Ionicons name="create-outline" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  dateBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  arrowBtn: { padding: spacing.sm },
  arrow: { fontSize: 28, color: colors.pinkAccent, fontWeight: '300' },
  arrowDisabled: { color: colors.border },
  dateLabelWrap: { alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '700', color: colors.text },
  weekdayText: { fontSize: 12, color: colors.textLight, marginTop: 1 },

  scroll: { padding: spacing.md },

  babyCard: {
    backgroundColor: colors.pink, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md,
    ...shadow.soft,
  },
  babyName: { fontSize: 18, fontWeight: '700', color: colors.text },
  babyAge: { fontSize: 13, color: colors.textLight, marginTop: 2 },

  missionsRow: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg,
  },
  mission: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  missionDone: { backgroundColor: '#F0FFF4', borderColor: colors.success },
  missionEmoji: { fontSize: 16 },
  missionLabel: { flex: 1, fontSize: 13, color: colors.textLight },
  missionLabelDone: { color: '#2E7D32', fontWeight: '600' },
  missionCheck: { fontSize: 14, color: '#2E7D32', fontWeight: '700' },

  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: 15 },

  timelineRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  timeCol: { alignItems: 'center', width: 48 },
  timeText: { fontSize: 12, fontWeight: '600', color: colors.textLight, marginTop: 12 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },

  logCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 4, ...shadow.soft,
  },
  logIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  logEmoji: { fontSize: 20 },
  logBody: { flex: 1 },
  logTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  logDetail: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  editBtn: { padding: spacing.xs, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  addBtn: {
    position: 'absolute', bottom: 16, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.pinkAccent, borderRadius: radius.full,
    padding: spacing.md, alignItems: 'center', ...shadow.soft,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
