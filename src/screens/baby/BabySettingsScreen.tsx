import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../config/theme';

export default function BabySettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚙️</Text>
      <Text style={styles.text}>הגדרות — בקרוב</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emoji: { fontSize: 40 },
  text: { fontSize: 15, color: colors.textLight },
});
