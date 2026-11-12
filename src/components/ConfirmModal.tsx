import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, spacing, radius, type, shadow } from '../config/theme';

/**
 * חלונית אישור לפעולה שלא ניתן לבטל.
 *
 * הסדר אינו שרירותי: "ביטול" ראשון וקרוב לאגודל, "מחיקה" אחרי, באדום
 * מלא. מי שלוחץ מהר על הכפתור הראשון לא מוחק בטעות.
 */
interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'מחיקה',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal accessibilityLabel={title}>
          <View style={styles.medallion}>
            <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
          </View>
          <Text style={[type.h3, styles.center]}>{title}</Text>
          <Text style={[type.body, styles.center, styles.message]}>{message}</Text>
          <View style={styles.actions}>
            <Button label="ביטול" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={confirmLabel} variant="danger" onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.raised,
  },
  medallion: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  message: { marginTop: spacing.xs, marginBottom: spacing.lg },
  // ביטול בימין (נקרא ראשון), מחיקה בשמאל
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, alignSelf: 'stretch' },
});
