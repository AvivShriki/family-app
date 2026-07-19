import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCollection } from '../../hooks/useCollection';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import { BabyLog } from '../../types';
import { colors, spacing, radius, shadow } from '../../config/theme';
import AddLogModal from './AddLogModal';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import { useBabyDate } from './BabyDateContext';
import { fmtTime, fmtDuration, isSameDay } from '../../utils/dates';

const LOG_META: Record<string, { emoji: string; label: string; bg: string }> = {
  feeding: { emoji: '🍼', label: 'ארוחה', bg: '#FADADD' },
  sleep: { emoji: '😴', label: 'שינה', bg: '#BDE0FE' },
  diaper: { emoji: '💩', label: 'חיתול', bg: '#FFF3CD' },
  note: { emoji: '📝', label: 'הערה', bg: '#E8F5E9' },
  vitamin: { emoji: '☀️', label: 'ויטמין D', bg: '#FFF8DC' },
  iron: { emoji: '💧', label: 'ברזל', bg: '#FFE4E1' },
};

const DIAPER_LABEL: Record<string, string> = {
  wet: 'שתן',
  dirty: 'קקי',
  both: 'שתן + קקי',
};

export default function BabyDayScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { items: allLogs, remove } = useCollection<BabyLog>('babyLogs', 'timestamp', 'asc');
  const { profile } = useBabyProfile();
  // התאריך משותף לכל מדור התינוקת (יומן + סיכום) דרך context —
  // כך מעבר לטאב "סיכום" נשאר על היום שצפינו בו
  const { date: selectedDate, setDate: setSelectedDate } = useBabyDate();
  // ניווט מהלוח מגיע עם dateStr — מסנכרנים אותו לתאריך המשותף
  const paramDateStr: string | undefined = route.params?.dateStr;
  useEffect(() => {
    if (paramDateStr) setSelectedDate(new Date(paramDateStr));
  }, [paramDateStr]);

  // הוספה נפתחת רק דרך כפתור ה"+" בטאב-בר (מקור אחד לפעולה, לפי סקירת הצוות) —
  // הנראוּת נגזרת ישירות מפרמטר הניווט
  const addModalVisible = !!route.params?.openAdd;
  const [editTarget, setEditTarget] = useState<BabyLog | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const closeAddModal = () => {
    setEditTarget(null);
    if (route.params?.openAdd) navigation.setParams({ openAdd: false });
  };

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

  return (
    <View style={styles.container}>
      {/* Date header */}
      <View style={styles.dateBar}>
        {/* קדימה (מחר) — חסום כשמגיעים להיום; אין תיעוד לעתיד */}
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDay(1)} disabled={isToday}>
          <Text style={[styles.arrow, isToday && styles.arrowDisabled]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.dateLabelWrap}>
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('he-IL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.weekdayText}>
            {selectedDate.toLocaleDateString('he-IL', { weekday: 'long' })}
          </Text>
        </View>
        {/* אחורה (אתמול) — תמיד פתוח, לצפייה בימים שכבר תועדו */}
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDay(-1)}>
          <Text style={styles.arrow}>›</Text>
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
          <MissionChip done={missionsDone.iron} emoji="💧" label="ברזל" />
          <MissionChip done={missionsDone.vitamin} emoji="☀️" label="ויטמין D" />
        </View>

        {/* Timeline */}
        {todayLogs.length === 0 ? (
          <EmptyState
            icon="journal-outline"
            title="עוד לא תיעדתם כלום ביום הזה"
            hint="כפתור ה־+ למטה מוסיף ארוחה, שינה או חיתול 💗"
          />
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

        <View style={{ height: 40 }} />
      </ScrollView>

      <AddLogModal
        key={editTarget?.id ?? 'new'}
        visible={addModalVisible || !!editTarget}
        onClose={closeAddModal}
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

function TimelineItem({
  log,
  isLast,
  onEdit,
  onLongPress,
}: {
  log: BabyLog;
  isLast: boolean;
  onEdit: () => void;
  onLongPress: () => void;
}) {
  const meta = LOG_META[log.type] ?? LOG_META.note;

  let detail = '';
  if (log.type === 'feeding' && log.amountMl) detail = `${log.amountMl} מ"ל`;
  if (log.type === 'sleep' && log.endTimestamp) {
    detail = `נרדמה ${fmtTime(log.timestamp)} · התעוררה ${fmtTime(log.endTimestamp)} · משך ${fmtDuration(log.endTimestamp - log.timestamp)}`;
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
  dateLabelWrap: { alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '700', color: colors.text },
  weekdayText: { fontSize: 12, color: colors.textLight, marginTop: 1 },

  scroll: { padding: spacing.md },

  babyCard: {
    backgroundColor: colors.pink,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  babyName: { fontSize: 18, fontWeight: '700', color: colors.text },
  babyAge: { fontSize: 13, color: colors.textLight, marginTop: 2 },

  missionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  mission: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  missionDone: { backgroundColor: '#F0FFF4', borderColor: colors.success },
  missionEmoji: { fontSize: 16 },
  missionLabel: { flex: 1, fontSize: 13, color: colors.textLight },
  missionLabelDone: { color: '#2E7D32', fontWeight: '600' },
  missionCheck: { fontSize: 14, color: '#2E7D32', fontWeight: '700' },

  timelineRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  timeCol: { alignItems: 'center', width: 48 },
  timeText: { fontSize: 12, fontWeight: '600', color: colors.textLight, marginTop: 12 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },

  logCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    ...shadow.soft,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logEmoji: { fontSize: 20 },
  logBody: { flex: 1 },
  logTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  logDetail: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  editBtn: {
    padding: spacing.xs,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
