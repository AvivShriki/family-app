import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, type } from '../config/theme';

/**
 * הודעת מצב בתוך המסך: נשמר, נכשל, שים לב.
 *
 * כל מצב מקבל גם אייקון וגם צבע. הודעת שגיאה שמסומנת רק באדום לא
 * נקראת על ידי מי שלא מבדיל אדום מירוק.
 */
type Tone = 'success' | 'error' | 'info';

const TONE: Record<Tone, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' },
  error: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' },
  info: { bg: colors.sageSoft, fg: colors.sage, icon: 'information-circle' },
};

export default function Banner({ tone, text }: { tone: Tone; text: string }) {
  const t = TONE[tone];
  return (
    <View
      style={[styles.wrap, { backgroundColor: t.bg }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={t.icon} size={18} color={t.fg} />
      <Text style={[type.smallStrong, styles.text]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  text: { flex: 1, lineHeight: 20 },
});
