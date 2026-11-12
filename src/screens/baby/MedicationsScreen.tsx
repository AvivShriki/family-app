import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMedications, isActiveOn } from '../../context/MedicationsContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import Chip from '../../components/Chip';
import TextField from '../../components/TextField';
import ConfirmModal from '../../components/ConfirmModal';
import DatePickerModal from '../../components/DatePickerModal';
import TimePickerModal from '../../components/TimePickerModal';
import EmptyState from '../../components/EmptyState';
import ActivityIcon from '../../components/ActivityIcon';
import SectionHeader from '../../components/SectionHeader';
import { Medication } from '../../types';
import { activityMeta, medIcon, MED_ICON_CHOICES } from '../../config/activity';
import { colors, spacing, radius, type, TOUCH } from '../../config/theme';

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

  const meta = activityMeta('medication');

  return (
    <Screen>
      <Text style={[type.body, styles.intro]}>
        מה שמוגדר כאן מופיע ביומן, בבחירת תיעוד חדש, וכמשימה יומית בדף הבית.
      </Text>

      {medications.length === 0 ? (
        <EmptyState
          icon="pill"
          title="עוד לא הוגדרו תרופות או תוספים"
          hint="אפשר להוסיף ויטמין, תוסף, או תרופה שניתנת לתקופה מוגבלת"
        />
      ) : (
        medications.map((m) => {
          const activeNow = isActiveOn(m, new Date());
          return (
            // העריכה והמחיקה הם שני כפתורים אחים בתוך שורה, ולא כפתור
            // מחיקה בתוך כפתור עריכה: כפתור מקונן הוא HTML לא תקין,
            // וקורא מסך מכריז עליו פעמיים
            <View key={m.id} style={[styles.row, styles.rowOuter]}>
              <TouchableOpacity
                style={styles.rowMain}
                onPress={() => setEditing(m)}
                accessibilityRole="button"
                accessibilityLabel={`עריכת ${m.name}`}
                activeOpacity={0.75}
              >
                <ActivityIcon
                  icon={medIcon(m.emoji)}
                  color={meta.color}
                  surface={meta.surface}
                  size={40}
                />
                <View style={styles.rowBody}>
                  <Text style={type.bodyStrong}>{m.name}</Text>
                  <Text style={type.small} numberOfLines={2}>
                    {describe(m)}
                  </Text>
                </View>
                {!activeNow ? <Text style={styles.inactive}>לא פעילה</Text> : null}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDeleteTarget(m)}
                accessibilityRole="button"
                accessibilityLabel={`מחיקת ${m.name}`}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <Button
        label="הוספת תרופה או תוסף"
        icon="add"
        onPress={() => setEditing('new')}
        style={{ marginTop: spacing.md }}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="מחיקת תרופה"
        message={`${deleteTarget?.name} תוסר מהרשימה. התיעוד הקיים יישאר ביומן.`}
        onConfirm={() => {
          if (deleteTarget) remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
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
  // השדה נקרא emoji מטעמי תאימות לנתונים שכבר נשמרו; מה שנראה הוא אייקון
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
    <Screen>
      <SectionHeader title={medication ? 'עריכת תרופה' : 'תרופה או תוסף חדש'} />
      <Card>
        <TextField
          label="שם"
          value={name}
          onChangeText={setName}
          // בלי אותיות לטיניות בתוך משפט עברי: "ויטמין D" הקפיץ את ה-D
          // לאמצע השורה בגלל סדר הכיווניות הדו-כיווני
          placeholder="ויטמין, אנטיביוטיקה, טיפות ברזל"
        />

        <View style={styles.fieldWrap}>
          <Text style={type.label}>אייקון</Text>
          <View style={styles.iconRow}>
            {MED_ICON_CHOICES.map((c) => {
              const active = emoji === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setEmoji(c.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`אייקון ${c.icon}`}
                  accessibilityState={{ selected: active }}
                  style={[styles.iconBtn, active && styles.iconBtnActive]}
                >
                  <ActivityIcon
                    icon={c.icon}
                    color={active ? colors.sage : colors.textMuted}
                    surface="transparent"
                    size={30}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TextField
          label="מינון"
          value={dose}
          onChangeText={setDose}
          placeholder='טיפה אחת, חצי כדור, 5 מ"ל'
        />

        <View style={styles.fieldWrap}>
          <Text style={type.label}>שעות</Text>
          <View style={styles.timesRow}>
            {times.map((t) => (
              <Chip
                key={t}
                label={t}
                mode="remove"
                onPress={() => setTimes(times.filter((x) => x !== t))}
              />
            ))}
            <Button
              label="הוספת שעה"
              icon="add"
              variant="secondary"
              compact
              onPress={() => setPicker('time')}
            />
          </View>
          <Text style={type.small}>
            השעות נשמרות ומוצגות כאן. התראה בפועל עדיין לא נתמכת — היא תחובר בהמשך.
          </Text>
        </View>

        <View style={styles.fieldWrap}>
          <Text style={type.label}>תאריך התחלה</Text>
          <DateField
            value={startDate ? fmtDate(startDate) : ''}
            placeholder="מהיום"
            onPress={() => setPicker('start')}
            label="תאריך התחלה"
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={type.label}>תאריך סיום</Text>
          <DateField
            value={endDate ? fmtDate(endDate) : ''}
            placeholder="ללא סיום"
            onPress={() => setPicker('end')}
            label="תאריך סיום"
          />
          {endDate ? (
            <TouchableOpacity
              onPress={() => setEndDate('')}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="ביטול תאריך הסיום"
            >
              <Text style={styles.clearText}>ביטול תאריך הסיום</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Button
          label="שמירה"
          onPress={submit}
          disabled={!name.trim()}
          loading={saving}
          style={{ marginTop: spacing.sm }}
        />
        <Button
          label="ביטול"
          variant="ghost"
          onPress={onCancel}
          style={{ marginTop: spacing.xs }}
        />
      </Card>

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
    </Screen>
  );
}

function DateField({
  value,
  placeholder,
  onPress,
  label,
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity
      style={styles.picker}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, לבחירה`}
    >
      <Ionicons name="calendar-outline" size={19} color={colors.sage} />
      <Text style={[type.bodyStrong, styles.pickerText, !value && styles.placeholder]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.md },

  rowOuter: { marginBottom: spacing.sm },
  rowMain: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: TOUCH,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBody: { flex: 1, gap: 1 },
  inactive: { ...type.caption, color: colors.textMuted },
  deleteBtn: {
    width: TOUCH,
    height: TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },

  fieldWrap: { marginBottom: spacing.md, gap: spacing.xs },
  iconRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  iconBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { borderColor: colors.sage, backgroundColor: colors.sageSoft },

  timesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },

  picker: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH + 6,
  },
  pickerText: { flex: 1 },
  placeholder: { ...type.body, color: colors.textMuted },
  clearBtn: { minHeight: TOUCH - 12, justifyContent: 'center' },
  clearText: { ...type.caption, color: colors.danger, fontWeight: '700' },
});
