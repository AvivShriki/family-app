import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, type } from '../config/theme';
import { MCIcon } from '../config/activity';

/**
 * כרטיס נתון: אייקון, מספר, ותווית.
 *
 * המספר הוא הגיבור ולכן הוא הדבר הגדול בכרטיס; האייקון מסמן על מה
 * מדובר בלי להתחרות עליו. delta מוצג רק כשיש תקופה להשוות אליה,
 * ותמיד עם סימן ומילה — לא עם חץ צבעוני בלבד.
 */
interface Props {
  icon: MCIcon;
  value: string;
  label: string;
  color: string;
  surface: string;
  delta?: string;
  style?: StyleProp<ViewStyle>;
}

export default function StatCard({ icon, value, label, color, surface, delta, style }: Props) {
  return (
    <View
      style={[styles.card, style]}
      accessibilityLabel={`${label}: ${value}${delta ? `, ${delta}` : ''}`}
    >
      <View style={[styles.icon, { backgroundColor: surface }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={type.metric} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[type.caption, styles.label]}>{label}</Text>
      {delta ? <Text style={[type.caption, styles.delta]}>{delta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 92,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center' },
  delta: { textAlign: 'center', color: colors.textSecondary },
});
