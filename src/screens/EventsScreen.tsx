import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { FamilyEvent } from '../types';
import { colors, spacing, radius, shadow } from '../config/theme';
import DatePickerModal from '../components/DatePickerModal';
import TimePickerModal from '../components/TimePickerModal';
import ConfirmModal from '../components/ConfirmModal';

export default function EventsScreen() {
  const { user } = useAuth();
  const { items: events, loading, add, remove } = useCollection<FamilyEvent>('events', 'date', 'asc');
  const [modalVisible, setModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const addEvent = async () => {
    if (!title || !date) { setFormError('כותרת ותאריך הם שדות חובה'); return; }
    await add({ title, date, time, endTime, note, createdBy: user?.email ?? 'demo', createdAt: Date.now() } as any);
    setTitle(''); setDate(''); setTime(''); setEndTime(''); setNote(''); setFormError('');
    setModalVisible(false);
  };

  const confirmDelete = () => {
    if (deleteTargetId) remove(deleteTargetId);
    setDeleteTargetId(null);
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.pinkAccent} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>אין אירועים עדיין 📅</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{new Date(item.date).getDate()}</Text>
              <Text style={styles.monthText}>{new Date(item.date).toLocaleDateString('he-IL', { month: 'short' })}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.time ? (
                <Text style={styles.cardMeta}>🕐 {item.time}{item.endTime ? `–${item.endTime}` : ''}</Text>
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
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>אירוע חדש</Text>
            <TextInput style={styles.input} placeholder="כותרת *" placeholderTextColor={colors.textMuted}
              value={title} onChangeText={setTitle} textAlign="right" />

            <TouchableOpacity style={styles.pickerField} onPress={() => setDatePickerVisible(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.pickerFieldText, !date && styles.pickerFieldPlaceholder]}>
                {date ? formatDate(date) : 'תאריך *'}
              </Text>
            </TouchableOpacity>

            <View style={styles.timeRow}>
              <TouchableOpacity style={[styles.pickerField, styles.timeField]} onPress={() => setTimePickerVisible(true)}>
                <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.pickerFieldText, !time && styles.pickerFieldPlaceholder]}>
                  {time || 'משעה (לא חובה)'}
                </Text>
              </TouchableOpacity>

              {time ? (
                <TouchableOpacity style={[styles.pickerField, styles.timeField]} onPress={() => setEndTimePickerVisible(true)}>
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                  <Text style={[styles.pickerFieldText, !endTime && styles.pickerFieldPlaceholder]}>
                    {endTime || 'עד שעה'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TextInput style={[styles.input, styles.inputMulti]} placeholder="הערה (לא חובה)"
              placeholderTextColor={colors.textMuted} value={note} onChangeText={setNote}
              multiline textAlign="right" />
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
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md, gap: spacing.md, ...shadow.soft,
  },
  dateBadge: {
    backgroundColor: colors.pink, borderRadius: radius.md, width: 52,
    alignItems: 'center', justifyContent: 'center', padding: spacing.sm,
  },
  dateBadgeText: { fontSize: 22, fontWeight: '700', color: colors.text },
  monthText: { fontSize: 11, color: colors.textLight },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  cardMeta: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  cardNote: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  deleteBtn: { padding: spacing.sm },
  fab: {
    position: 'absolute', bottom: 28, right: 24, backgroundColor: colors.pinkAccent,
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...shadow.soft,
  },
  fabText: { fontSize: 28, color: colors.white, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: '#0004', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.white, borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.md, padding: spacing.md,
    fontSize: 15, color: colors.text, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  errorText: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  timeField: { flex: 1 },
  pickerField: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.cream, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  pickerFieldText: { fontSize: 15, color: colors.text },
  pickerFieldPlaceholder: { color: colors.textMuted },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  btnCancel: { flex: 1, padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.creamDark, alignItems: 'center' },
  btnCancelText: { color: colors.textLight, fontWeight: '600' },
  btnSave: { flex: 1, padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.pinkAccent, alignItems: 'center' },
  btnSaveText: { color: colors.white, fontWeight: '700' },
});
