import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { BabyLog } from '../types';
import { colors, spacing, radius, shadow } from '../config/theme';

const LOG_TYPES = [
  { type: 'feeding', emoji: '🍼', label: 'האכלה' },
  { type: 'sleep', emoji: '😴', label: 'שינה' },
  { type: 'diaper', emoji: '🐣', label: 'חיתול' },
  { type: 'note', emoji: '📝', label: 'הערה' },
] as const;

const FEEDING_OPTIONS = [
  { value: 'breast_left', label: 'שמאל' },
  { value: 'breast_right', label: 'ימין' },
  { value: 'bottle', label: 'בקבוק' },
];
const DIAPER_OPTIONS = [
  { value: 'wet', label: 'רטוב' },
  { value: 'dirty', label: 'מלוכלך' },
  { value: 'both', label: 'שניהם' },
];

const LOG_BG: Record<string, string> = {
  feeding: colors.pink,
  sleep: colors.blue,
  diaper: colors.creamDark,
  note: '#E8F5E9',
};

function fmt(ts: number, type: 'time' | 'date') {
  return type === 'time'
    ? new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : new Date(ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export default function BabyScreen() {
  const { user } = useAuth();
  const { items: logs, loading, add, remove } = useCollection<BabyLog>('babyLogs', 'timestamp', 'desc');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<BabyLog['type']>('feeding');
  const [feedingType, setFeedingType] = useState('breast_left');
  const [durationMin, setDurationMin] = useState('');
  const [amountMl, setAmountMl] = useState('');
  const [diaperType, setDiaperType] = useState('wet');
  const [details, setDetails] = useState('');

  const openModal = (type: BabyLog['type']) => {
    setSelectedType(type);
    setDetails(''); setDurationMin(''); setAmountMl('');
    setModalVisible(true);
  };

  const addLog = async () => {
    const entry: any = { type: selectedType, timestamp: Date.now(), loggedBy: user?.email ?? 'demo', details };
    if (selectedType === 'feeding') {
      entry.feedingType = feedingType;
      if (feedingType === 'bottle') entry.amountMl = parseInt(amountMl) || 0;
      else entry.durationMin = parseInt(durationMin) || 0;
    }
    if (selectedType === 'diaper') entry.diaperType = diaperType;
    await add(entry);
    setModalVisible(false);
  };

  const deleteLog = (id: string) => {
    Alert.alert('מחיקה', 'למחוק רשומה זו?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחיקה', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  const renderItem = ({ item }: { item: BabyLog }) => {
    const t = LOG_TYPES.find((x) => x.type === item.type)!;
    let sub = '';
    if (item.type === 'feeding') {
      sub = FEEDING_OPTIONS.find((f) => f.value === item.feedingType)?.label ?? '';
      if (item.durationMin) sub += ` · ${item.durationMin} דק'`;
      if (item.amountMl) sub += ` · ${item.amountMl} מ"ל`;
    }
    if (item.type === 'diaper') sub = DIAPER_OPTIONS.find((d) => d.value === item.diaperType)?.label ?? '';
    if (item.details) sub += (sub ? ' · ' : '') + item.details;

    return (
      <TouchableOpacity style={styles.logItem} onLongPress={() => deleteLog(item.id)}>
        <View style={[styles.logIcon, { backgroundColor: LOG_BG[item.type] }]}>
          <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
        </View>
        <View style={styles.logBody}>
          <Text style={styles.logType}>{t.label}</Text>
          {sub ? <Text style={styles.logSub}>{sub}</Text> : null}
        </View>
        <View style={styles.logTime}>
          <Text style={styles.logTimeText}>{fmt(item.timestamp, 'time')}</Text>
          <Text style={styles.logDateText}>{fmt(item.timestamp, 'date')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.pinkAccent} />;

  return (
    <View style={styles.container}>
      <View style={styles.quickBtns}>
        {LOG_TYPES.map((t) => (
          <TouchableOpacity key={t.type} style={styles.quickBtn} onPress={() => openModal(t.type)}>
            <Text style={styles.quickBtnEmoji}>{t.emoji}</Text>
            <Text style={styles.quickBtnLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>אין רשומות עדיין 👶</Text>}
        renderItem={renderItem}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {LOG_TYPES.find((t) => t.type === selectedType)?.emoji}{' '}
              {LOG_TYPES.find((t) => t.type === selectedType)?.label}
            </Text>

            {selectedType === 'feeding' && (
              <>
                <Text style={styles.fieldLabel}>סוג האכלה</Text>
                <View style={styles.optionRow}>
                  {FEEDING_OPTIONS.map((o) => (
                    <TouchableOpacity key={o.value}
                      style={[styles.optionBtn, feedingType === o.value && styles.optionBtnActive]}
                      onPress={() => setFeedingType(o.value)}>
                      <Text style={[styles.optionText, feedingType === o.value && styles.optionTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {feedingType === 'bottle'
                  ? <TextInput style={styles.input} placeholder='כמות (מ"ל)' placeholderTextColor={colors.textMuted}
                      value={amountMl} onChangeText={setAmountMl} keyboardType="numeric" textAlign="right" />
                  : <TextInput style={styles.input} placeholder="משך (דקות)" placeholderTextColor={colors.textMuted}
                      value={durationMin} onChangeText={setDurationMin} keyboardType="numeric" textAlign="right" />
                }
              </>
            )}

            {selectedType === 'diaper' && (
              <>
                <Text style={styles.fieldLabel}>סוג חיתול</Text>
                <View style={styles.optionRow}>
                  {DIAPER_OPTIONS.map((o) => (
                    <TouchableOpacity key={o.value}
                      style={[styles.optionBtn, diaperType === o.value && styles.optionBtnActive]}
                      onPress={() => setDiaperType(o.value)}>
                      <Text style={[styles.optionText, diaperType === o.value && styles.optionTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TextInput style={[styles.input, styles.inputMulti]} placeholder="הערה (לא חובה)"
              placeholderTextColor={colors.textMuted} value={details} onChangeText={setDetails}
              multiline textAlign="right" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={addLog}>
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
  quickBtns: {
    flexDirection: 'row', padding: spacing.md, gap: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  quickBtn: { flex: 1, alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.md, padding: spacing.sm },
  quickBtnEmoji: { fontSize: 24 },
  quickBtnLabel: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  list: { padding: spacing.md, paddingBottom: 40 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: 16 },
  logItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    gap: spacing.md, ...shadow.soft,
  },
  logIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logBody: { flex: 1 },
  logType: { fontSize: 15, fontWeight: '600', color: colors.text },
  logSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  logTime: { alignItems: 'flex-end' },
  logTimeText: { fontSize: 14, fontWeight: '600', color: colors.textLight },
  logDateText: { fontSize: 11, color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: '#0004', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.white, borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: 40,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, color: colors.textLight, marginBottom: spacing.sm, textAlign: 'right' },
  optionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  optionBtn: {
    flex: 1, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.cream,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  optionBtnActive: { backgroundColor: colors.pinkAccent, borderColor: colors.pinkAccent },
  optionText: { fontSize: 14, color: colors.textLight, fontWeight: '500' },
  optionTextActive: { color: colors.white, fontWeight: '700' },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.md, padding: spacing.md,
    fontSize: 15, color: colors.text, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  btnCancel: { flex: 1, padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.creamDark, alignItems: 'center' },
  btnCancelText: { color: colors.textLight, fontWeight: '600' },
  btnSave: { flex: 1, padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.pinkAccent, alignItems: 'center' },
  btnSaveText: { color: colors.white, fontWeight: '700' },
});
