import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, type, TOUCH } from '../config/theme';

/**
 * בורר יחיד מתוך שתיים עד ארבע אפשרויות — סוג חיתול, טווח בסיכומים.
 *
 * עדיף על שורת כפתורים: ברור שרק אחת נבחרת, והמצב הנבחר מוצג דרך
 * accessibilityState כך שקורא מסך מכריז אותו.
 */
interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}

export default function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.segment, active && styles.active]}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.creamDeep,
    borderRadius: radius.full,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: TOUCH - 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
  },
  active: { backgroundColor: colors.white },
  label: { ...type.smallStrong, textAlign: 'center', color: colors.textMuted },
  activeLabel: { color: colors.text },
});
