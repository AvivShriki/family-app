import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, type } from '../config/theme';

/** מצב טעינה אחיד. הטקסט אופציונלי אבל מומלץ — ספינר בלי הקשר מדאיג. */
export default function Loader({ text }: { text?: string }) {
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={text ?? 'טוען'}>
      <ActivityIndicator color={colors.sage} size="large" />
      {text ? <Text style={[type.small, styles.text]}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  text: { textAlign: 'center' },
});
