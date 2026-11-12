import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, type } from '../config/theme';
import { MCIcon } from '../config/activity';

/**
 * כותרת המסך, בתוך התוכן ולא בסרגל ניווט.
 *
 * מסך שיושב בסרגל טאבים לא מקבל כותרת מערכת, ובלי כותרת פנימית הוא
 * מתחיל באוויר. כאן הכותרת היא חלק מהעמוד: שם, שורת הסבר, ומדליון
 * אייקון בקצה שנותן לכל מסך סימן זיהוי משלו.
 */
interface Props {
  title: string;
  subtitle?: string;
  icon: MCIcon;
  /** גוון המדליון. ברירת המחדל היא גוון המותג. */
  color?: string;
  surface?: string;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, icon, color, surface, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={type.h2} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={type.small} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (
        <View style={[styles.medallion, { backgroundColor: surface ?? colors.sageSoft }]}>
          <MaterialCommunityIcons name={icon} size={21} color={color ?? colors.sage} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    minHeight: 46,
  },
  medallion: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
