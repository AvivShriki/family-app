import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, type } from '../config/theme';

/**
 * סמל האפליקציה במסכי הכניסה.
 *
 * מחליף את האימוג'י 🌸 שעמד שם קודם: אימוג'י נראה אחרת בכל מערכת
 * הפעלה, ובמסך הראשון שמשתמש חדש רואה זה בדיוק המקום שבו לא כדאי
 * להיראות מאולתר.
 */
export default function BrandMark({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <MaterialCommunityIcons name="baby-face-outline" size={34} color={colors.white} />
      </View>
      <Text style={[type.h1, styles.center]}>{title}</Text>
      {subtitle ? (
        <Text style={[type.body, styles.center, styles.subtitle]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: spacing.lg },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  subtitle: { marginTop: spacing.xs, maxWidth: 320 },
});
