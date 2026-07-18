import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font } from '../config/theme';

// Shared empty-state: a soft icon medallion, a warm title, and an optional
// hint that points the user at the action that fills the screen.
interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
}

export default function EmptyState({ icon, title, hint }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.medallion}>
        <Ionicons name={icon} size={34} color={colors.pinkAccent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  medallion: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: font.bodyLg, fontWeight: font.weight.semibold,
    color: colors.text, textAlign: 'center', marginBottom: spacing.xs,
  },
  hint: { fontSize: font.small, color: colors.textMuted, textAlign: 'center' },
});
