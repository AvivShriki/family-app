import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import DatePickerModal from '../../components/DatePickerModal';
import Button from '../../components/Button';
import { pickProfileImage } from '../../utils/imagePicker';
import { colors, spacing, radius, shadow } from '../../config/theme';

export default function BabySettingsScreen() {
  const { profile, save } = useBabyProfile();
  // עריכות המשתמש חיות בנפרד מהפרופיל; כל עוד לא נערך — מציגים את הערך מהשרת.
  // כך אין צורך לסנכרן state בתוך effect כשהפרופיל נטען.
  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const [birthDateEdit, setBirthDateEdit] = useState<string | null>(null);
  // undefined = לא נגעו בתמונה, null = הוסרה, string = תמונה חדשה שנבחרה
  const [photoEdit, setPhotoEdit] = useState<string | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const name = nameEdit ?? profile.name;
  const birthDate = birthDateEdit ?? profile.birthDate;
  const photoUrl = photoEdit === undefined ? profile.photoUrl : photoEdit ?? undefined;

  const dirty =
    name.trim() !== profile.name ||
    birthDate !== profile.birthDate ||
    photoUrl !== profile.photoUrl;
  const valid = name.trim().length > 0 && birthDate.length > 0;

  const onPickPhoto = async () => {
    const dataUrl = await pickProfileImage();
    if (dataUrl) {
      setPhotoEdit(dataUrl);
      setStatus('idle');
    }
  };

  const onSave = async () => {
    try {
      await save({ name: name.trim(), birthDate, photoUrl });
      setPhotoEdit(undefined); // מסונכרן מחדש מהפרופיל השמור
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>פרופיל התינוקת 🌸</Text>

        {/* תמונת פרופיל — מוצגת בכל האפליקציה */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={onPickPhoto} activeOpacity={0.8}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoEmoji}>👶</Text>
              </View>
            )}
            <View style={styles.photoBadge}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>
            {photoUrl ? 'לחיצה על התמונה מחליפה אותה' : 'לחיצה מוסיפה תמונת פרופיל 📷'}
          </Text>
          {photoUrl ? (
            <TouchableOpacity onPress={() => { setPhotoEdit(null); setStatus('idle'); }} hitSlop={8}>
              <Text style={styles.photoRemove}>הסרת התמונה</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>שם</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => {
            setNameEdit(t);
            setStatus('idle');
          }}
          placeholder="שם התינוקת"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>תאריך לידה</Text>
        <TouchableOpacity style={styles.input} onPress={() => setPickerOpen(true)}>
          <Text style={styles.dateText}>{new Date(birthDate).toLocaleDateString('he-IL')}</Text>
        </TouchableOpacity>
        <Text style={styles.agePreview}>{getAgeText(birthDate)}</Text>

        <Button label="שמירה" onPress={onSave} disabled={!dirty || !valid} />

        {status === 'saved' && <Text style={styles.saved}>נשמר! הפרופיל של {profile.name} מעודכן 🌸</Text>}
        {status === 'error' && <Text style={styles.error}>השמירה לא הצליחה — בדקו את החיבור ונסו שוב</Text>}
      </View>

      <DatePickerModal
        visible={pickerOpen}
        value={birthDate}
        onSelect={(d) => {
          setBirthDateEdit(d);
          setStatus('idle');
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  photoSection: { alignItems: 'center', marginBottom: spacing.lg },
  photo: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.pink },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: 44 },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  photoHint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  photoRemove: { fontSize: 12, color: colors.danger, fontWeight: '600', marginTop: spacing.xs },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
    backgroundColor: colors.cream,
    marginBottom: spacing.md,
  },
  dateText: { fontSize: 15, color: colors.text, textAlign: 'right' },
  agePreview: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  saved: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '600',
  },
});
