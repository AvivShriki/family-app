import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { colors, spacing, radius } from '../config/theme';

/**
 * מוצג כשהמשתמש מחובר אך אין לו שיוך למשק בית (מסמך users/{uid}).
 * בלי המסך הזה הוא היה נתקע במסך טעינה או מקבל שגיאת הרשאות סתומה.
 */
export default function NoHouseholdScreen() {
  const { logout } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏠</Text>
      <Text style={styles.title}>החשבון עדיין לא משויך למשפחה</Text>
      <Text style={styles.body}>
        צריך לשייך את החשבון הזה למשפחה לפני השימוש. פנה לאביב כדי להשלים את ההגדרה.
      </Text>
      <Button label="יציאה" onPress={logout} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
