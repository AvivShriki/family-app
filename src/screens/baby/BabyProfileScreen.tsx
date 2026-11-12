import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import DatePickerModal from '../../components/DatePickerModal';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import Card from '../../components/Card';
import Banner from '../../components/Banner';
import Screen from '../../components/Screen';
import { pickProfileImage } from '../../utils/imagePicker';
import { colors, spacing, radius, type, TOUCH } from '../../config/theme';

/**
 * עריכת פרטי התינוק או התינוקת.
 *
 * הטופס ישב קודם בראש מסך ההגדרות ודחק את שאר השורות מתחת לקיפול.
 * הוא פעולה שנעשית פעם בכמה חודשים, ולכן הוא מסך משלו שנפתח מהפרופיל.
 */
export default function BabyProfileScreen() {
  const { profile, save } = useBabyProfile();
  // עריכות המשתמש חיות בנפרד מהפרופיל; כל עוד לא נערך — מציגים את הערך
  // מהשרת. כך אין צורך לסנכרן state בתוך effect כשהפרופיל נטען.
  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const [birthDateEdit, setBirthDateEdit] = useState<string | null>(null);
  const [familyNameEdit, setFamilyNameEdit] = useState<string | null>(null);
  // undefined = לא נגעו בתמונה, null = הוסרה, string = תמונה חדשה שנבחרה
  const [photoEdit, setPhotoEdit] = useState<string | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saving, setSaving] = useState(false);

  const name = nameEdit ?? profile.name;
  const birthDate = birthDateEdit ?? profile.birthDate;
  const familyName = familyNameEdit ?? profile.familyName ?? '';
  const photoUrl = photoEdit === undefined ? profile.photoUrl : (photoEdit ?? undefined);

  const dirty =
    name.trim() !== profile.name ||
    birthDate !== profile.birthDate ||
    familyName.trim() !== (profile.familyName ?? '') ||
    photoUrl !== profile.photoUrl;
  // תאריך הלידה אינו חובה לשמירה: בלעדיו מוצג "תאריך לידה טרם הוגדר",
  // ואין סיבה שהוא יחסום הגדרה של שם המשפחה או של שם התינוקת.
  const valid = name.trim().length > 0;

  const onPickPhoto = async () => {
    const dataUrl = await pickProfileImage();
    if (dataUrl) {
      setPhotoEdit(dataUrl);
      setStatus('idle');
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ name: name.trim(), birthDate, photoUrl, familyName: familyName.trim() });
      setPhotoEdit(undefined); // מסונכרן מחדש מהפרופיל השמור
      setFamilyNameEdit(null);
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card>
        <View style={styles.photoSection}>
          <TouchableOpacity
            onPress={onPickPhoto}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={photoUrl ? 'החלפת תמונת הפרופיל' : 'הוספת תמונת פרופיל'}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <MaterialCommunityIcons name="baby-face-outline" size={48} color={colors.sage} />
              </View>
            )}
            <View style={styles.photoBadge}>
              <Ionicons name="camera" size={15} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={[type.caption, styles.photoHint]}>
            {photoUrl ? 'נגיעה בתמונה מחליפה אותה' : 'נגיעה מוסיפה תמונת פרופיל'}
          </Text>
          {photoUrl ? (
            <TouchableOpacity
              onPress={() => {
                setPhotoEdit(null);
                setStatus('idle');
              }}
              style={styles.removeBtn}
              accessibilityRole="button"
              accessibilityLabel="הסרת התמונה"
            >
              <Text style={styles.removeText}>הסרת התמונה</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TextField
          label="שם"
          value={name}
          onChangeText={(t) => {
            setNameEdit(t);
            setStatus('idle');
          }}
          placeholder="שם התינוק או התינוקת"
        />

        <View style={styles.fieldWrap}>
          <Text style={type.label}>תאריך לידה</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="תאריך לידה, לבחירה"
          >
            <Ionicons name="calendar-outline" size={19} color={colors.sage} />
            {/* משפחה חדשה מגיעה בלי תאריך; בלי הבדיקה הזו מוצג "Invalid Date" */}
            <Text style={[type.bodyStrong, styles.pickerText, !birthDate && styles.placeholder]}>
              {birthDate ? new Date(birthDate).toLocaleDateString('he-IL') : 'בחירת תאריך'}
            </Text>
            <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={type.small}>{getAgeText(birthDate)}</Text>
        </View>

        <TextField
          label="שם המשפחה"
          value={familyName}
          onChangeText={(t) => {
            setFamilyNameEdit(t);
            setStatus('idle');
          }}
          placeholder="לברכה בדף הבית"
          hint="מופיע בפתיחת האפליקציה, אחרי ברכת השעה"
        />

        {status === 'saved' ? (
          <Banner tone="success" text={`הפרופיל של ${profile.name} עודכן`} />
        ) : null}
        {status === 'error' ? (
          <Banner tone="error" text="השמירה לא הצליחה — בדקו את החיבור ונסו שוב" />
        ) : null}

        <Button label="שמירה" onPress={onSave} disabled={!dirty || !valid} loading={saving} />
      </Card>

      <DatePickerModal
        visible={pickerOpen}
        value={birthDate}
        onSelect={(d) => {
          setBirthDateEdit(d);
          setStatus('idle');
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoSection: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.xs },
  photo: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.mossSoft },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  photoHint: { marginTop: spacing.sm, textAlign: 'center' },
  removeBtn: { minHeight: TOUCH - 10, justifyContent: 'center' },
  removeText: { ...type.caption, color: colors.danger, fontWeight: '700' },

  fieldWrap: { marginBottom: spacing.md, gap: spacing.xs },
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
});
