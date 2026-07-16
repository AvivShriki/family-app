import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { FamilyEvent } from '../types';
import { colors, spacing, radius, shadow } from '../config/theme';
import DatePickerModal from '../components/DatePickerModal';
import TimePickerModal from '../components/TimePickerModal';
import ConfirmModal from '../components/ConfirmModal';

const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const HE_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Month grid shown above the list; days that have an event get a dot.
// Tapping a day selects it (tap again to clear).
function MonthCalendar({
  eventDays,
  selectedDay,
  onSelectDay,
}: {
  eventDays: Set<string>;
  selectedDay: string | null;
  onSelectDay: (dateStr: string) => void;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <View style={styles.calendarCard}>
      <View style={styles.monthBar}>
        <TouchableOpacity
          onPress={() => setViewDate(new Date(year, month + 1, 1))}
          style={styles.arrowBtn}
        >
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {HE_MONTHS[month]} {year}
        </Text>
        <TouchableOpacity
          onPress={() => setViewDate(new Date(year, month - 1, 1))}
          style={styles.arrowBtn}
        >
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dowRow}>
        {HE_DAYS.map((d) => (
          <Text key={d} style={styles.dowText}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
          const dateStr = toDateStr(year, month, day);
          const hasEvent = eventDays.has(dateStr);
          const selected = selectedDay === dateStr;
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.cell,
                isToday(day) && styles.todayCell,
                selected && styles.selectedCell,
              ]}
              onPress={() => onSelectDay(dateStr)}
            >
              <Text style={[styles.dayNum, isToday(day) && styles.todayNum]}>{day}</Text>
              {hasEvent ? (
                <View style={[styles.eventDot, isToday(day) && styles.eventDotToday]} />
              ) : (
                <View style={styles.dotPlaceholder} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function EventsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    items: events,
    loading,
    add,
    remove,
  } = useCollection<FamilyEvent>('events', 'date', 'asc');
  const [modalVisible, setModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const addEvent = async () => {
    if (!title || !date) {
      setFormError('כותרת ותאריך הם שדות חובה');
      return;
    }
    await add({
      title,
      date,
      time,
      endTime,
      note,
      createdBy: user?.email ?? 'demo',
      createdAt: Date.now(),
    } as any);
    setTitle('');
    setDate('');
    setTime('');
    setEndTime('');
    setNote('');
    setFormError('');
    setModalVisible(false);
  };

  const confirmDelete = () => {
    if (deleteTargetId) remove(deleteTargetId);
    setDeleteTargetId(null);
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const eventDays = useMemo(() => new Set(events.map((e) => e.date)), [events]);

  // Tap toggles selection; when a day is selected the list shows only its events
  const onSelectDay = (d: string) => setSelectedDay((prev) => (prev === d ? null : d));
  const shownEvents = useMemo(
    () => (selectedDay ? events.filter((e) => e.date === selectedDay) : events),
    [events, selectedDay],
  );

  const openAddModal = () => {
    setDate(selectedDay ?? '');
    setFormError('');
    setModalVisible(true);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.pinkAccent} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={shownEvents}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <MonthCalendar
              eventDays={eventDays}
              selectedDay={selectedDay}
              onSelectDay={onSelectDay}
            />
            {selectedDay ? (
              <View style={styles.dayBar}>
                <TouchableOpacity onPress={() => setSelectedDay(null)}>
                  <Text style={styles.dayBarClear}>הצג הכול</Text>
                </TouchableOpacity>
                <Text style={styles.dayBarText}>{formatDate(selectedDay)}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {selectedDay ? 'אין אירועים ביום זה — אפשר להוסיף עם ה-+ 👇' : 'אין אירועים עדיין 📅'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{new Date(item.date).getDate()}</Text>
              <Text style={styles.monthText}>
                {new Date(item.date).toLocaleDateString('he-IL', { month: 'short' })}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.time ? (
                <Text style={styles.cardMeta}>
                  🕐 {item.time}
                  {item.endTime ? `–${item.endTime}` : ''}
                </Text>
              ) : null}
              {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
              <Text style={styles.cardMeta}>📅 {formatDate(item.date)}</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteTargetId(item.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={[styles.fab, { bottom: 28 + insets.bottom }]} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>אירוע חדש</Text>
            <TextInput
              style={styles.input}
              placeholder="כותרת *"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              textAlign="right"
            />

            <TouchableOpacity style={styles.pickerField} onPress={() => setDatePickerVisible(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.pickerFieldText, !date && styles.pickerFieldPlaceholder]}>
                {date ? formatDate(date) : 'תאריך *'}
              </Text>
            </TouchableOpacity>

            <View style={styles.timeRow}>
              <TouchableOpacity
                style={[styles.pickerField, styles.timeField]}
                onPress={() => setTimePickerVisible(true)}
              >
                <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.pickerFieldText, !time && styles.pickerFieldPlaceholder]}>
                  {time || 'משעה (לא חובה)'}
                </Text>
              </TouchableOpacity>

              {time ? (
                <TouchableOpacity
                  style={[styles.pickerField, styles.timeField]}
                  onPress={() => setEndTimePickerVisible(true)}
                >
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                  <Text style={[styles.pickerFieldText, !endTime && styles.pickerFieldPlaceholder]}>
                    {endTime || 'עד שעה'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="הערה (לא חובה)"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              textAlign="right"
            />
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={addEvent}>
                <Text style={styles.btnSaveText}>שמירה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={datePickerVisible}
        value={date}
        onSelect={setDate}
        onClose={() => setDatePickerVisible(false)}
      />
      <TimePickerModal
        visible={timePickerVisible}
        value={time}
        onSelect={setTime}
        onClose={() => setTimePickerVisible(false)}
      />
      <TimePickerModal
        visible={endTimePickerVisible}
        value={endTime}
        onSelect={setEndTime}
        onClose={() => setEndTimePickerVisible(false)}
      />
      <ConfirmModal
        visible={!!deleteTargetId}
        title="מחיקת אירוע"
        message="למחוק את האירוע?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.lg, paddingBottom: 100 },
  calendarCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  arrowBtn: { padding: spacing.sm },
  arrow: { fontSize: 24, color: colors.pinkAccent, fontWeight: '300' },
  monthTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  dowRow: { flexDirection: 'row', marginBottom: spacing.xs },
  dowText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: { backgroundColor: colors.pinkAccent, borderRadius: radius.md },
  selectedCell: { borderWidth: 2, borderColor: colors.pinkAccent, borderRadius: radius.md },
  dayNum: { fontSize: 14, color: colors.text },
  todayNum: { color: colors.white, fontWeight: '700' },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pinkAccent,
    marginTop: 2,
  },
  eventDotToday: { backgroundColor: colors.white },
  dotPlaceholder: { width: 6, height: 6, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: 16 },
  dayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.pink,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  dayBarText: { fontSize: 14, fontWeight: '700', color: colors.text },
  dayBarClear: { fontSize: 13, fontWeight: '600', color: colors.pinkAccent },
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
  dateBadge: {
    backgroundColor: colors.pink,
    borderRadius: radius.md,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  dateBadgeText: { fontSize: 22, fontWeight: '700', color: colors.text },
  monthText: { fontSize: 11, color: colors.textLight },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  cardMeta: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  cardNote: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  deleteBtn: { padding: spacing.sm },
  fab: {
    position: 'absolute',
    right: 24,
    backgroundColor: colors.pinkAccent,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  fabText: { fontSize: 28, color: colors.white, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: '#0004', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  errorText: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  timeField: { flex: 1 },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerFieldText: { fontSize: 15, color: colors.text },
  pickerFieldPlaceholder: { color: colors.textMuted },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  btnCancel: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
  },
  btnCancelText: { color: colors.textLight, fontWeight: '600' },
  btnSave: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
  },
  btnSaveText: { color: colors.white, fontWeight: '700' },
});
