import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors, spacing, radius, shadow } from '../config/theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible, title, message, confirmLabel = 'מחיקה', onConfirm, onCancel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onCancel}>
              <Text style={styles.btnCancelText}>ביטול</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnConfirm} onPress={onConfirm}>
              <Text style={styles.btnConfirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0005', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.lg, ...shadow.soft,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  message: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md },
  btnCancel: { flex: 1, padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.creamDark, alignItems: 'center' },
  btnCancelText: { color: colors.textLight, fontWeight: '600' },
  btnConfirm: { flex: 1, padding: spacing.md, borderRadius: radius.full, backgroundColor: colors.danger, alignItems: 'center' },
  btnConfirmText: { color: colors.white, fontWeight: '700' },
});
