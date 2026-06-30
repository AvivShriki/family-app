import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { FamilyEvent } from '../types';
import { colors, spacing, radius, shadow } from '../config/theme';

export default function EventsScreen() {
  const { user } = useAuth();
  const { items: events, loading, add, remove } = useCollection<FamilyEvent>('events', 'date', 'asc');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const addEvent = async () => {
    if (!title || !date) { Alert.alert('שגיאה', 'כותרת ותאריך הם שדות חובה'); return; }
    await add({ title, date, time, note, createdBy: user?.email ?? 'demo', createdAt: Date.now() } as any);
    setTitle(''); setDate(''); setTime(''); setNote('');
    setModalVisible(false);
  };

  const deleteEvent = (id: string) => {
    Alert.alert('מחיקה', 'למחוק את האירוע?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחיקה', style: 'destructive', onPress: () => remove(id) },
    ]);
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
          <TouchableOpacity style={styles.card} onLongPress={() => deleteEvent(item.id)}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{new Date(item.date).getDate()}</Text>
              <Text style={styles.monthText}>{new Date(item.date).toLocaleDateString('he-IL', { month: 'short' })}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.time ? <Text style={styles.cardMeta}>🕐 {item.time}</Text> : null}
              {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
              <Text style={styles.cardMeta}>📅 {formatDate(item.date)}</Text>
            </View>
          </TouchableOpacity>
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
            <TextInput style={styles.input} placeholder="תאריך (YYYY-MM-DD) *" placeholderTextColor={colors.textMuted}
              value={date} onChangeText={setDate} textAlign="right" />
            <TextInput style={styles.input} placeholder="שעה (לא חובה)" placeholderTextColor={colors.textMuted}
              value={time} onChangeText={setTime} textAlign="right" />
            <TextInput style={[styles.input, styles.inputMulti]} placeholder="הערה (לא חובה)"
              placeholderTextColor={colors.textMuted} value={note} onChangeText={setNote}
              multiline textAlign="right" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.lg, paddingBottom: 100 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: 16 },
  card: {
    flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg,
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
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  btnCancel: { flex: 1, padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.creamDark, alignItems: 'center' },
  btnCancelText: { color: colors.textLight, fontWeight: '600' },
  btnSave: { flex: 1, padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.pinkAccent, alignItems: 'center' },
  btnSaveText: { color: colors.white, fontWeight: '700' },
});
