import React from 'react';
import { Text, StyleSheet, ActivityIndicator, View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressScale from './PressScale';
import { colors, spacing, radius, type, TOUCH, shadow } from '../config/theme';

/**
 * הכפתור היחיד של האפליקציה. מסך לא מגדיר לעצמו סגנון כפתור.
 *
 * primary   — הפעולה המובילה במסך. מרווה מלאה, טקסט לבן (5.8 ניגודיות).
 * secondary — פעולה חלופית. קרם עמוק עם קו, לא "כפתור שני בצבע אחר".
 * ghost     — פעולה שלישית, בלי משטח בכלל.
 * danger    — מחיקה. אדום מלא, כדי שלא תילחץ בטעות.
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  /** כפתור צר יותר, לשורות ולכרטיסים */
  compact?: boolean;
  style?: StyleProp<ViewStyle>; // פריסה בלבד (flex, מרווחים) — לא צבעים
}

const BG: Record<Variant, string> = {
  primary: colors.sage,
  secondary: colors.creamDeep,
  ghost: 'transparent',
  danger: colors.danger,
};

const FG: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.text,
  ghost: colors.sage,
  danger: colors.white,
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  compact,
  style,
}: Props) {
  const blocked = disabled || loading;
  return (
    <PressScale
      style={style}
      to={0.98}
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
    >
      <View
        style={[
          styles.base,
          compact && styles.compact,
          { backgroundColor: BG[variant] },
          variant === 'secondary' && styles.bordered,
          variant === 'primary' && shadow.soft,
          blocked && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={FG[variant]} size="small" />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={18} color={FG[variant]} /> : null}
            <Text style={[type.button, { color: FG[variant] }]}>{label}</Text>
          </>
        )}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: TOUCH + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  compact: { minHeight: TOUCH, paddingHorizontal: spacing.md },
  bordered: { borderWidth: 1, borderColor: colors.borderStrong },
  disabled: { opacity: 0.45 },
});
