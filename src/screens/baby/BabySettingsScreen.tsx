import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBabyProfile, getAgeText } from '../../hooks/useBabyProfile';
import { useAuth } from '../../context/AuthContext';
import ListRow from '../../components/ListRow';
import Screen from '../../components/Screen';
import SectionHeader from '../../components/SectionHeader';
import BlobBackdrop from '../../components/BlobBackdrop';
import { colors, spacing, radius, type, shadow } from '../../config/theme';

/**
 * הפרופיל — נקודת הכניסה לכל מה שמגדירים.
 *
 * קודם זה היה מסך הגדרות שהתחיל בטופס ארוך, והשורות שמתחתיו נדחקו
 * מתחת לקיפול. עכשיו הוא מתחיל במי שהאפליקציה עוסקת בה, ומתחתיה
 * רשימת יעדים קצרה. הטופס עצמו עבר למסך משלו.
 */
export default function BabySettingsScreen({ navigation }: any) {
  const { profile } = useBabyProfile();
  const { user, logout } = useAuth();

  return (
    <View style={styles.root}>
      <BlobBackdrop />
      <Screen tabBar>
        {/* ---- כרטיס הזהות ---- */}
        <TouchableOpacity
          style={styles.hero}
          onPress={() => navigation.navigate('BabyProfile')}
          accessibilityRole="button"
          accessibilityLabel={`עריכת הפרטים של ${profile.name}`}
          activeOpacity={0.85}
        >
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <MaterialCommunityIcons name="baby-face-outline" size={54} color={colors.sage} />
            </View>
          )}
          <Text style={[type.h1, styles.center]} numberOfLines={1}>
            {profile.name}
          </Text>
          <Text style={[type.small, styles.center]}>{getAgeText(profile.birthDate)}</Text>
          {profile.familyName?.trim() ? (
            <View style={styles.familyTag}>
              <Text style={styles.familyTagText}>משפחת {profile.familyName.trim()}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.section}>
          <SectionHeader title="התינוקת" />
          <ListRow
            icon="create-outline"
            label="עריכת פרטי התינוקת"
            hint="שם, תאריך לידה, תמונה ושם המשפחה"
            onPress={() => navigation.navigate('BabyProfile')}
          />
          <ListRow
            icon="medkit-outline"
            label="תרופות ותוספים"
            hint="מה שמוגדר כאן מופיע בתיעוד ובמשימות היום"
            onPress={() => navigation.navigate('Medications')}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="המשפחה" />
          <ListRow
            icon="chatbubble-ellipses-outline"
            label="הודעות המשפחה"
            hint="הודעות בין בני הבית"
            onPress={() => navigation.navigate('Chat')}
          />
          <ListRow
            icon="person-add-outline"
            label="הוספת בן משפחה"
            hint="עד שלושה אנשים באותה משפחה"
            onPress={() => navigation.navigate('Invite')}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="החשבון" />
          <ListRow
            icon="key-outline"
            label="שינוי סיסמה"
            hint={user?.email ?? undefined}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <ListRow icon="log-out-outline" label="יציאה" onPress={logout} tone="danger" action />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    ...shadow.soft,
  },
  photo: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.mossSoft,
    marginBottom: spacing.sm,
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  familyTag: {
    marginTop: spacing.xs,
    backgroundColor: colors.sageSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  familyTagText: { ...type.caption, color: colors.sage, fontWeight: '700' },

  section: { marginTop: spacing.lg },
});
