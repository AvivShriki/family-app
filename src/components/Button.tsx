import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, spacing, radius, font } from '../config/theme';

// The one primary-action button for the whole app. Variants cover every
// button role we have; screens must not define their own button styles.
type Variant = 'primary' | 'secondary' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle; // layout-only overrides (flex, margins) — not colors
}

const VARIANT_BG: Record<Variant, string> = {
  primary: colors.pinkAccent,
  secondary: colors.creamDark,
  danger: colors.danger,
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.textLight,
  danger: colors.white,
};

export default function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: VARIANT_BG[variant] },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={VARIANT_TEXT[variant]} />
      ) : (
        <Text style={[styles.label, { color: VARIANT_TEXT[variant] }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // comfortable touch target
  },
  disabled: { opacity: 0.45 },
  label: { fontSize: font.bodyLg, fontWeight: font.weight.bold },
});
