import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBabyLogs } from '../../context/BabyLogsContext';
import { useMedications } from '../../context/MedicationsContext';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import { BabyLog } from '../../types';
import { activityMeta, medIcon } from '../../config/activity';
import { colors, spacing, radius, shadow, type, TOUCH, CONTENT_MAX } from '../../config/theme';
import AddLogModal from './AddLogModal';
import ActivityIcon from '../../components/ActivityIcon';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import PressScale from '../../components/PressScale';
import DateBar from './DateBar';
import { useBabyDate } from './BabyDateContext';
import { fmtTime, fmtDuration, isSameDay } from '../../utils/dates';

const DIAPER_LABEL: Record<string, string> = {
  wet: 'שתן',
  dirty: 'קקי',
  both: 'שתן + קקי',
};

export default function BabyDayScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { items: allLogs, remove } = useBabyLogs();
  const { profile } = useBabyProfile();
  const { medications, activeToday } = useMedications();
  const insets = useSafeAreaInsets();
  // התאריך משותף לכל מדור התינוקת (יומן + סיכום) דרך context —
  // כך מעבר לטאב "סיכום" נשאר על היום שצפינו בו
  const { date: selectedDate, setDate: setSelectedDate } = useBabyDate();
  // ניווט מהלוח מגיע עם dateStr — מסנכרנים אותו לתאריך המשותף
  const paramDateStr: string | undefined = route.params?.dateStr;
  useEffect(() => {
    if (paramDateStr) setSelectedDate(new Date(paramDateStr));
  }, [paramDateStr]);

  // הוספה נפתחת רק דרך כפתור ה"+" בסרגל הטאבים (מקור אחד לפעולה) —
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

  // משימות היום נגזרות מהתרופות הפעילות, לא מרשימה קבועה
  const missions = activeToday.map((m) => ({
    id: m.id,
    icon: medIcon(m.emoji),
    label: m.name,
    done: todayLogs.some((l) => l.type === 'medication' && l.medicationId === m.id),
  }));

  const confirmDeleteLog = () => {
    if (deleteTargetId) remove(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <View style={styles.container}>
      <DateBar
        date={selectedDate}
        onChange={setSelectedDate}
        caption={getAgeText(profile.birthDate, selectedDate)}
      />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 108 + insets.bottom }]}>
        {missions.length > 0 ? (
          <View style={styles.missions}>
            {missions.map((m) => (
              <MissionChip key={m.id} done={m.done} icon={m.icon} label={m.label} />
            ))}
          </View>
        ) : null}

        {todayLogs.length === 0 ? (
          <EmptyState
            icon="notebook-outline"
            title="עוד לא תיעדתם כלום ביום הזה"
            hint="כפתור ההוספה שלמטה מוסיף ארוחה, שינה, חיתול או הערה"
          />
        ) : (
          <View style={styles.timeline}>
            {todayLogs.map((log, i) => (
              <TimelineItem
                key={log.id}
                log={log}
                isLast={i === todayLogs.length - 1}
                onEdit={() => setEditTarget(log)}
                onLongPress={() => setDeleteTargetId(log.id)}
                medName={medications.find((m) => m.id === log.medicationId)?.name}
                medEmoji={medications.find((m) => m.id === log.medicationId)?.emoji}
              />
            ))}
          </View>
        )}
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
        message="הרשומה תימחק מהיומן. אי אפשר לשחזר אותה."
        onConfirm={confirmDeleteLog}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
}

/** משימת תרופה יומית. "בוצע" מסומן באייקון ובטקסט, לא רק בצבע. */
function MissionChip({
  done,
  icon,
  label,
}: {
  done: boolean;
  icon: ReturnType<typeof medIcon>;
  label: string;
}) {
  return (
    <View
      style={[styles.mission, done && styles.missionDone]}
      accessibilityLabel={`${label}: ${done ? 'בוצע' : 'טרם בוצע'}`}
    >
      <ActivityIcon
        icon={done ? 'check' : icon}
        color={done ? colors.success : activityMeta('medication').color}
        surface={done ? colors.successSoft : activityMeta('medication').surface}
        size={28}
      />
      <Text style={[type.smallStrong, styles.missionLabel]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[type.caption, done && { color: colors.success }]}>{done ? 'בוצע' : 'טרם'}</Text>
    </View>
  );
}

function TimelineItem({
  log,
  isLast,
  onEdit,
  onLongPress,
  medName,
  medEmoji,
}: {
  log: BabyLog;
  isLast: boolean;
  onEdit: () => void;
  onLongPress: () => void;
  medName?: string;
  medEmoji?: string;
}) {
  const base = activityMeta(log.type);
  // רישום תרופה מציג את שם התרופה עצמה, לא את המילה "תרופה"
  const meta = medName ? { ...base, label: medName, icon: medIcon(medEmoji) } : base;

  let detail = '';
  if (log.type === 'feeding') detail = log.amountMl ? `${log.amountMl} מ"ל` : 'הנקה';
  if (log.type === 'sleep' && log.endTimestamp) {
    detail = `${fmtTime(log.timestamp)}–${fmtTime(log.endTimestamp)} · ${fmtDuration(log.endTimestamp - log.timestamp)}`;
  }
  if (log.type === 'sleep' && !log.endTimestamp) detail = 'עוד לא נרשמה התעוררות';
  if (log.type === 'diaper' && log.diaperType) detail = DIAPER_LABEL[log.diaperType] ?? '';
  if (log.details) detail += (detail ? ' · ' : '') + log.details;

  return (
    <View style={styles.row}>
      {/* עמוד הזמן בימין — זה הצד שממנו מתחילים לקרוא בעברית */}
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{fmtTime(log.timestamp)}</Text>
        <View style={[styles.node, { backgroundColor: meta.color }]} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      <PressScale
        to={0.99}
        onPress={onEdit}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={`${meta.label} ב-${fmtTime(log.timestamp)}${detail ? `, ${detail}` : ''}. נגיעה לעריכה, לחיצה ארוכה למחיקה`}
        style={styles.cardOuter}
      >
        <View style={styles.card}>
          <ActivityIcon icon={meta.icon} color={meta.color} surface={meta.surface} size={40} />
          <View style={styles.cardBody}>
            <Text style={type.bodyStrong}>{meta.label}</Text>
            {detail ? (
              <Text style={type.small} numberOfLines={2}>
                {detail}
              </Text>
            ) : null}
          </View>
          <Ionicons name="create-outline" size={19} color={colors.textMuted} />
        </View>
      </PressScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    padding: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },

  missions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  mission: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: TOUCH,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  missionDone: { backgroundColor: colors.successSoft, borderColor: colors.success },
  missionLabel: { flex: 1 },

  timeline: { gap: spacing.xs },
  row: { flexDirection: 'row-reverse', gap: spacing.sm },
  timeCol: { width: 46, alignItems: 'center' },
  timeText: {
    ...type.caption,
    textAlign: 'center',
    marginTop: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  node: { width: 9, height: 9, borderRadius: 5, marginTop: spacing.xs },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2, marginBottom: -2 },

  cardOuter: { flex: 1, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadow.soft,
  },
  cardBody: { flex: 1, gap: 1 },
});
