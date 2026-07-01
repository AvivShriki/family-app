import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useCollection } from '../../hooks/useCollection';
import { useAuth } from '../../context/AuthContext';
import { BabyLog } from '../../types';
import { colors, spacing, radius, shadow } from '../../config/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
}

type LogType = BabyLog['type'];

const TYPES: { type: LogType; emoji: string; label: string }[] = [
  { type: 'feeding', emoji: '🍼', label: 'ארוחה' },
  { type: 'sleep',   emoji: '😴', label: 'שינה' },
  { type: 'diaper',  emoji: '💩', label: 'חיתול' },
  { type: 'vitamin', emoji: '☀️', label: 'ויטמין D' },
  { type: 'iron',    emoji: '💧', label: 'ברזל' },
  { type: 'note',    emoji: '📝', label: 'הערה' },
];

const DIAPER_OPTIONS = [
  { value: 'wet',   label: 'שתן' },
  { value: 'dirty', label: 'קקי' },
  { value: 'both',  label: 'שניהם' },
];

function parseTime(str: string, baseDate: Date): number {
  const [h, m] = str.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
  return d.getTime();
}

function nowHHMM() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

export default function AddLogModal({ visible, onClose, selectedDate }: Props) {
  const { user } = useAuth();
  const { add } = useCollection<BabyLog>('babyLogs', 'timestamp', 'asc');

  const [step, setStep] = useState<'pick' | 'form'>('pick');
  const [selectedType, setSelectedType] = useState<LogType>('feeding');

  // form fields
  const [startTime, setStartTime] = useState(nowHHMM);
  const [endTime, setEndTime] = useState('');
  const [amountMl, setAmountMl] = useState('');
  const [diaperType, setDiaperType] = useState<string>('dirty');
  const [note, setNote] = useState('');

  const reset = () => {
    setStep('pick');
    setStartTime(nowHHMM());
    setEndTime('');
    setAmountMl('');
    setDiaperType('dirty');
    setNote('');
  };

  const handleClose = () => { reset(); onClose(); };

  const pickType = (type: LogType) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleSave = async () => {
    const ts = parseTime(startTime, selectedDate);
    const entry: Omit<BabyLog, 'id'> = {
      type: selectedType,
      timestamp: ts,
      loggedBy: user?.email ?? 'demo',
    };
    if (selectedType === 'feeding') entry.amountMl = parseInt(amountMl) || 0;
    if (selectedType === 'sleep' && endTime) entry.endTimestamp = parseTime(endTime, selectedDate);
    if (selectedType === 'diaper') entry.diaperType = diaperType as any;
    if (note) entry.details = note;

    await add(entry as any);
    handleClose();
  };

  const typeMeta = TYPES.find((t) => t.type === selectedType)!;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            {step === 'form' ? (
              <TouchableOpacity onPress={() => setStep('pick')} style={styles.backBtn}>
                <Text style={styles.backText}>‹ חזרה</Text>
              </TouchableOpacity>
            ) : <View style={{ width: 60 }} />}
            <Text style={styles.title}>
              {step === 'pick' ? 'הוסף אירוע' : `${typeMeta.emoji} ${typeMeta.label}`}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {step === 'pick' ? (
              /* Type picker grid */
              <View style={styles.typeGrid}>
                {TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.type}
                    style={styles.typeBtn}
                    onPress={() => pickType(t.type)}
                  >
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text style={styles.typeLabel}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              /* Form fields */
              <View>
                {/* Start time — always shown */}
                <Field label={selectedType === 'sleep' ? 'שעת כניסה לשינה' : 'שעה'}>
                  <TimeInput value={startTime} onChange={setStartTime} />
                </Field>

                {/* Sleep end time */}
                {selectedType === 'sleep' && (
                  <Field label="שעת התעוררות">
                    <TimeInput value={endTime} onChange={setEndTime} placeholder="HH:MM" />
                  </Field>
                )}

                {/* Feeding amount */}
                {selectedType === 'feeding' && (
                  <Field label='כמות (מ"ל)'>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={amountMl}
                      onChangeText={setAmountMl}
                      placeholder="150"
                      placeholderTextColor={colors.textMuted}
                      textAlign="right"
                    />
                  </Field>
                )}

                {/* Diaper type */}
                {selectedType === 'diaper' && (
                  <Field label="סוג">
                    <View style={styles.optionRow}>
                      {DIAPER_OPTIONS.map((o) => (
                        <TouchableOpacity
                          key={o.value}
                          style={[styles.optionBtn, diaperType === o.value && styles.optionActive]}
                          onPress={() => setDiaperType(o.value)}
                        >
                          <Text style={[styles.optionText, diaperType === o.value && styles.optionTextActive]}>
                            {o.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Field>
                )}

                {/* Note — always optional */}
                <Field label="הערה (לא חובה)">
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    value={note}
                    onChangeText={setNote}
                    placeholder="הוסף הערה..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlign="right"
                  />
                </Field>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>שמירה</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TimeInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder ?? 'HH:MM'}
      placeholderTextColor={colors.textMuted}
      keyboardType="numbers-and-punctuation"
      textAlign="center"
      maxLength={5}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#0005', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, color: colors.pinkAccent, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeBtn: { width: 60, alignItems: 'flex-end' },
  closeText: { fontSize: 18, color: colors.textMuted },

  body: { padding: spacing.lg, paddingBottom: 40 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  typeBtn: {
    width: '30%', aspectRatio: 1, backgroundColor: colors.cream,
    borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  typeEmoji: { fontSize: 30, marginBottom: spacing.xs },
  typeLabel: { fontSize: 13, color: colors.text, fontWeight: '500' },

  fieldWrap: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, color: colors.textLight, marginBottom: spacing.xs, textAlign: 'right' },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.md,
    padding: spacing.md, fontSize: 16, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },

  optionRow: { flexDirection: 'row', gap: spacing.sm },
  optionBtn: {
    flex: 1, padding: spacing.sm, borderRadius: radius.md,
    backgroundColor: colors.cream, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  optionActive: { backgroundColor: colors.pinkAccent, borderColor: colors.pinkAccent },
  optionText: { fontSize: 14, color: colors.textLight, fontWeight: '500' },
  optionTextActive: { color: colors.white, fontWeight: '700' },

  saveBtn: {
    backgroundColor: colors.pinkAccent, borderRadius: radius.full,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
