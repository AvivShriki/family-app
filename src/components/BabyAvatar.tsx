import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBabyProfile } from '../hooks/useBabyProfile';
import { colors } from '../config/theme';

/**
 * תמונת הפרופיל של התינוק או התינוקת, בכל מקום באפליקציה.
 *
 * כשאין תמונה מוצג אייקון במסגרת בגוון המותג — ולא אימוג'י, שנראה
 * אחרת בכל מערכת הפעלה ומוריד את כל המסך לרמה של מדבקה.
 */
export default function BabyAvatar({ size = 48, ring }: { size?: number; ring?: boolean }) {
  const { profile } = useBabyProfile();
  const round = { width: size, height: size, borderRadius: size / 2 };
  const frame = ring ? { borderWidth: 2.5, borderColor: colors.white } : null;

  if (profile.photoUrl) {
    return <Image source={{ uri: profile.photoUrl }} style={[round, frame, styles.photo]} />;
  }
  return (
    <View style={[round, frame, styles.placeholder]}>
      <MaterialCommunityIcons
        name="baby-face-outline"
        size={Math.round(size * 0.56)}
        color={colors.sage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { backgroundColor: colors.mossSoft },
  placeholder: {
    backgroundColor: colors.mossSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
