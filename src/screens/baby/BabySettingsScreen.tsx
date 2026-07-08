import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import DatePickerModal from '../../components/DatePickerModal';
import { colors, spacing, radius, shadow } from '../../config/theme';

export default function BabySettingsScreen() {
  const { profile, loading, save } = useBabyProfile();
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Sync the form once the profile arrives from Firestore
  useEffect(() => {
    if (!loading) { setName(profile.name); setBirthDate(profile.birthDate); }
  }, [loading, profile.name, profile.birthDate]);

  const dirty = name.trim() !== profile.name || birthDate !== profile.birthDate;
  const valid = name.trim().length > 0 && birthDate.length > 0;

  const onSave = async () => {
    try {
      await save({ name: name.trim(), birthDate });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>פרופיל התינוקת 🌸</Text>

        <Text style={styles.label}>שם</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => { setName(t); setStatus('idle'); }}
          placeholder="שם התינוקת"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>תאריך לידה</Text>
        <TouchableOpacity style={styles.input} onPress={() => setPickerOpen(true)}>
          <Text style={styles.dateText}>
            {new Date(birthDate).toLocaleDateString('he-IL')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.agePreview}>{getAgeText(birthDate)}</Text>

        <TouchableOpacity
          style={[styles.saveBtn, (!dirty || !valid) && styles.saveBtnDisabled]}
          disabled={!dirty || !valid}
          onPress={onSave}
        >
          <Text style={styles.saveBtnText}>שמירה</Text>
        </TouchableOpacity>

        {status === 'saved' && <Text style={styles.saved}>נשמר ✓</Text>}
        {status === 'error' && <Text style={styles.error}>השמירה נכשלה, נסו שוב</Text>}
      </View>

      <DatePickerModal
        visible={pickerOpen}
        value={birthDate}
        onSelect={(d) => { setBirthDate(d); setStatus('idle'); }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.lg, ...shadow.soft,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.md, textAlign: 'right' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: spacing.xs, textAlign: 'right' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: 15, color: colors.text, textAlign: 'right',
    backgroundColor: colors.cream, marginBottom: spacing.md,
  },
  dateText: { fontSize: 15, color: colors.text, textAlign: 'right' },
  agePreview: { fontSize: 13, color: colors.textMuted, textAlign: 'right', marginTop: -spacing.sm, marginBottom: spacing.md },
  saveBtn: {
    backgroundColor: colors.pinkAccent, borderRadius: radius.md,
    paddingVertical: spacing.sm + 4, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.pink },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  saved: { fontSize: 14, color: colors.success, textAlign: 'center', marginTop: spacing.sm, fontWeight: '600' },
  error: { fontSize: 14, color: colors.danger, textAlign: 'center', marginTop: spacing.sm, fontWeight: '600' },
});
