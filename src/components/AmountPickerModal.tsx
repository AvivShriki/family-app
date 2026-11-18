import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Button from './Button';
import { colors, spacing, radius, font } from '../config/theme';

interface Props {
  visible: boolean;
  value: string; // כמות במיליליטרים כמחרוזת, '' כשעוד לא נבחרה
  onSelect: (amount: string) => void;
  onClose: () => void;
}

// קפיצות של 10 מיליליטר עד 300 — מכסה בקבוק מלא ועדיין מאפשר דיוק
const AMOUNTS = Array.from({ length: 30 }, (_, i) => String((i + 1) * 10));

export default function AmountPickerModal({ visible, value, onSelect, onClose }: Props) {
  const [amount, setAmount] = useState(value);

  const confirm = () => {
    onSelect(amount);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>בחר כמות</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>מיליליטר</Text>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
            {AMOUNTS.map((ml) => (
              <TouchableOpacity
                key={ml}
                style={[styles.option, amount === ml && styles.optionActive]}
                onPress={() => setAmount(ml)}
              >
                <Text style={[styles.optionText, amount === ml && styles.optionTextActive]}>
                  {ml}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* בלי כמות אין מה לאשר. קודם היה כאן "אישור ללא כמות",
              שהיה הדרך לרשום הנקה — היום הנקה היא בחירה מפורשת
              בחלון התיעוד, ולכן האפשרות הזו רק בלבלה. */}
          <Button
            label={amount ? `אישור ${amount} מיליליטר` : 'בחרו כמות'}
            onPress={confirm}
            disabled={!amount}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0004', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: font.title, fontWeight: font.weight.bold, color: colors.text },
  close: { fontSize: font.title, color: colors.textMuted },
  hint: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  scroll: { height: 280 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    width: '22%', // ארבעה בשורה
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.cream,
  },
  optionActive: { backgroundColor: colors.pinkAccent },
  optionText: { fontSize: font.bodyLg, color: colors.text },
  optionTextActive: { color: colors.white, fontWeight: font.weight.bold },
});
