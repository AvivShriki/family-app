import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, type, TOUCH } from '../config/theme';

/**
 * כותרת אזור, עם קישור פעולה אופציונלי בקצה הנגדי.
 *
 * בעברית הכותרת נקראת ראשונה ולכן יושבת בימין, והקישור בשמאל — זה
 * מחייב row-reverse ולא סדר ה-DOM, אחרת החץ מופיע לפני הטקסט.
 */
interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={type.h3}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.action}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-back" size={15} color={colors.sage} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    minHeight: 28,
  },
  action: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    minHeight: TOUCH - 10,
    paddingHorizontal: spacing.xs,
  },
  actionText: { ...type.smallStrong, color: colors.sage },
});
