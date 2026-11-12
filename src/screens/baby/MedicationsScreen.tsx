import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMedications, isActiveOn } from '../../context/MedicationsContext';
import Button from '../../components/Button';
import ConfirmModal from '../../components/ConfirmModal';
import DatePickerModal from '../../components/DatePickerModal';
import TimePickerModal from '../../components/TimePickerModal';
import EmptyState from '../../components/EmptyState';
import { Medication } from '../../types';
import { colors, spacing, radius, font, shadow } from '../../config/theme';

const EMOJIS = ['💊', '☀️', '💧', '🍼', '🧴', '🌿', '💉', '🩹'];

const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('he-IL') : '');

export default function MedicationsScreen() {
  const { medications, add, update, remove } = useMedications();
  const [editing, setEditing] = useState<Medication | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);

  if (editing) {
    return (
      <MedicationForm
        medication={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={async (data) => {
          if (editing === 'new') await add({ ...data, active: true });
          else await update(editing.id, data);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        מה שמוגדר כאן מופיע ביומן, בבחירת תיעוד חדש, וכמשימה יומית בדף הבית.
      </Text>

      {medications.length === 0 ? (
        <EmptyState
          icon="medkit-outline"
          title="עוד לא הוגדרו תרופות או תוספים"
          hint="אפשר להוסיף ויטמין, תוסף, או תרופה שניתנת לתקופה מוגבלת 💊"
        />
      ) : (
        medications.map((m) => {
          const activeNow = isActiveOn(m, new Date());
          return (
            <TouchableOpacity
              key={m.id}
              style={styles.row}
              onPress={() => setEditing(m)}
              accessibilityLabel={`עריכת ${m.name}`}
            >
              <TouchableOpacity
                onPress={() => setDeleteTarget(m)}
                hitSlop={8}
                accessibilityLabel={`מחיקת ${m.name}`}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {m.emoji} {m.name}
                </Text>
                <Text style={styles.meta}>{describe(m)}</Text>
              </View>

              {!activeNow ? <Text style={styles.inactive}>לא פעילה</Text> : null}
            </TouchableOpacity>
          );
        })
      )}

      <Button
        label="הוספת תרופה או תוסף"
        onPress={() => setEditing('new')}
        style={{ marginTop: spacing.md }}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="מחיקת תרופה"
        message={`למחוק את ${deleteTarget?.name}? התיעוד הקיים יישאר ביומן.`}
        onConfirm={() => {
          if (deleteTarget) remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScrollView>
  );
}

function describe(m: Medication): string {
  const parts: string[] = [];
  if (m.dose) parts.push(m.dose);
  if (m.times?.length) parts.push(m.times.join(', '));
  // טווח התאריכים נקרא אחרת לפי מה שהוגדר, כדי שלא ייצא מקף יתום
  if (m.startDate && m.endDate) parts.push(`${fmtDate(m.startDate)} – ${fmtDate(m.endDate)}`);
  else if (m.endDate) parts.push(`עד ${fmtDate(m.endDate)}`);
  else if (m.startDate) parts.push(`מ-${fmtDate(m.startDate)}`);
  return parts.join(' · ') || 'כל יום, בלי שעה קבועה';
}

function MedicationForm({
  medication,
  onSave,
  onCancel,
}: {
  medication: Medication | null;
  onSave: (data: Omit<Medication, 'id' | 'createdAt' | 'active'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(medication?.name ?? '');
  const [emoji, setEmoji] = useState(medication?.emoji ?? '💊');
  const [dose, setDose] = useState(medication?.dose ?? '');
  const [times, setTimes] = useState<string[]>(medication?.times ?? []);
  const [startDate, setStartDate] = useState(medication?.startDate ?? '');
  const [endDate, setEndDate] = useState(medication?.endDate ?? '');
  const [picker, setPicker] = useState<'start' | 'end' | 'time' | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onSave({ name: name.trim(), emoji, dose: dose.trim(), times, startDate, endDate });
    setSaving(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>שם</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          textAlign="right"
          placeholder="ויטמין D, אנטיביוטיקה, טיפות ברזל"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>אייקון</Text>
        <View style={styles.emojiRow}>
          {EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.emojiBtn, emoji === e && styles.emojiActive]}
              onPress={() => setEmoji(e)}
              accessibilityLabel={`אייקון ${e}`}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>מינון</Text>
        <TextInput
          style={styles.input}
          value={dose}
          onChangeText={setDose}
          textAlign="right"
          placeholder='0.5 מ"ל, טיפה אחת, חצי כדור'
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>שעות</Text>
        <View style={styles.timesRow}>
          {times.map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.timeChip}
              onPress={() => setTimes(times.filter((x) => x !== t))}
              accessibilityLabel={`הסרת ${t}`}
            >
              <Text style={styles.timeChipText}>{t} ✕</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addTime} onPress={() => setPicker('time')}>
            <Text style={styles.addTimeText}>+ שעה</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.note}>
          השעות נשמרות ויוצגו כאן. התראה בפועל עדיין לא נתמכת — היא תחובר בהמשך.
        </Text>

        <Text style={styles.label}>תאריך התחלה</Text>
        <TouchableOpacity style={styles.input} onPress={() => setPicker('start')}>
          <Text style={[styles.dateText, !startDate && styles.placeholder]}>
            {startDate ? fmtDate(startDate) : 'מהיום'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>תאריך סיום</Text>
        <TouchableOpacity style={styles.input} onPress={() => setPicker('end')}>
          <Text style={[styles.dateText, !endDate && styles.placeholder]}>
            {endDate ? fmtDate(endDate) : 'ללא סיום'}
          </Text>
        </TouchableOpacity>
        {endDate ? (
          <TouchableOpacity onPress={() => setEndDate('')} hitSlop={8}>
            <Text style={styles.clear}>ביטול תאריך הסיום</Text>
          </TouchableOpacity>
        ) : null}

        <Button
          label="שמירה"
          onPress={submit}
          disabled={!name.trim()}
          loading={saving}
          style={{ marginTop: spacing.md }}
        />
        <TouchableOpacity onPress={onCancel} hitSlop={8}>
          <Text style={styles.cancel}>ביטול</Text>
        </TouchableOpacity>
      </View>

      <DatePickerModal
        visible={picker === 'start' || picker === 'end'}
        value={picker === 'end' ? endDate : startDate}
        onSelect={(d) => (picker === 'end' ? setEndDate(d) : setStartDate(d))}
        onClose={() => setPicker(null)}
      />
      {picker === 'time' ? (
        <TimePickerModal
          visible
          value=""
          minuteStep={5}
          onSelect={(t) => setTimes((prev) => (prev.includes(t) ? prev : [...prev, t].sort()))}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.md, paddingBottom: 120 },
  intro: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  deleteBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: font.bodyLg, fontWeight: font.weight.bold, color: colors.text, textAlign: 'right' },
  meta: { fontSize: font.small, color: colors.textLight, textAlign: 'right', marginTop: 2 },
  inactive: { fontSize: font.caption, color: colors.textMuted },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  label: {
    fontSize: font.small,
    fontWeight: font.weight.semibold,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: font.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  dateText: { fontSize: font.body, color: colors.text, textAlign: 'right' },
  placeholder: { color: colors.textMuted },
  clear: {
    fontSize: font.small,
    color: colors.blueAccent,
    textAlign: 'right',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },

  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiActive: { borderColor: colors.pinkAccent, backgroundColor: colors.pink },
  emojiText: { fontSize: 20 },

  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  timeChip: {
    backgroundColor: colors.pink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  timeChipText: { fontSize: font.small, color: colors.text, fontWeight: font.weight.semibold },
  addTime: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  addTimeText: { fontSize: font.small, color: colors.textLight },
  note: {
    fontSize: font.caption,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  cancel: { fontSize: font.small, color: colors.textLight, textAlign: 'center', marginTop: spacing.md },
});
