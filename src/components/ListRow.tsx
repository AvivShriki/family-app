import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressScale from './PressScale';
import { colors, spacing, radius, type, TOUCH, shadow } from '../config/theme';

/**
 * שורת ניווט או פעולה ברשימה — הגדרות, חשבון, ניהול.
 *
 * ב-RTL האייקון המוביל יושב בימין והחץ סוגר בשמאל. החץ הוא chevron-back
 * ולא forward: בעברית "פנימה" זה שמאלה.
 */
interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  /** שורה בלי חץ — פעולה שנעשית במקום ולא מנווטת */
  action?: boolean;
}

export default function ListRow({ icon, label, hint, onPress, tone = 'default', action }: Props) {
  const color = tone === 'danger' ? colors.danger : colors.sage;
  return (
    <PressScale
      to={0.99}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.outer}
    >
      <View style={styles.row}>
        <View
          style={[styles.medallion, tone === 'danger' && { backgroundColor: colors.dangerSoft }]}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.text}>
          <Text style={[type.bodyStrong, tone === 'danger' && { color: colors.danger }]}>
            {label}
          </Text>
          {hint ? <Text style={type.small}>{hint}</Text> : null}
        </View>
        {!action ? <Ionicons name="chevron-back" size={18} color={colors.textMuted} /> : null}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH + 16,
    ...shadow.soft,
  },
  medallion: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 1 },
});
