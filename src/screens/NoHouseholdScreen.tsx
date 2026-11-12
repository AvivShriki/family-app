import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { colors, spacing, type } from '../config/theme';

/**
 * מוצג כשהמשתמש מחובר אך אין לו שיוך למשק בית (מסמך users/{uid}).
 * בלי המסך הזה הוא היה נתקע במסך טעינה או מקבל שגיאת הרשאות סתומה.
 */
export default function NoHouseholdScreen() {
  const { logout } = useAuth();
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <MaterialCommunityIcons name="home-heart" size={34} color={colors.sage} />
      </View>
      <Text style={[type.h2, styles.center]}>החשבון עדיין לא משויך למשפחה</Text>
      <Card style={styles.card}>
        <Text style={[type.body, styles.center]}>
          צריך לשייך את החשבון הזה למשפחה לפני השימוש. אם קיבלתם קישור הזמנה — כדאי לפתוח אותו שוב.
          אחרת, בקשו מבן המשפחה שהזמין אתכם קישור חדש.
        </Text>
      </Card>
      <Button label="יציאה" variant="secondary" onPress={logout} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  card: { marginTop: spacing.md, alignSelf: 'stretch', maxWidth: 420 },
  button: { marginTop: spacing.lg, alignSelf: 'stretch', maxWidth: 420 },
});
