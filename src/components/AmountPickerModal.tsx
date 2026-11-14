import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Button from './Button';
import { colors, spacing, radius, font } from '../config/theme';

interface Props {
  visible: boolean;
  value: string; // כמות במ"ל כמחרוזת, או '' כשאין (הנקה)
  onSelect: (amount: string) => void;
  onClose: () => void;
}

// קפיצות של 10 מ"ל עד 300 — מכסה בקבוק מלא ועדיין מאפשר דיוק
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

          <Text style={styles.hint}>מ"ל</Text>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
            {/* הנקה — אין כמות למדוד */}
            <TouchableOpacity
              style={[styles.option, styles.optionWide, amount === '' && styles.optionActive]}
              onPress={() => setAmount('')}
            >
              <Text style={[styles.optionText, amount === '' && styles.optionTextActive]}>
                ללא (הנקה)
              </Text>
            </TouchableOpacity>

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

          <Button
            label={amount ? `אישור ${amount} מ"ל` : 'אישור ללא כמות'}
            onPress={confirm}
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
  hint: { fontSize: font.small, color: colors.textLight, textAlign: 'right', marginBottom: spacing.xs },
  scroll: { height: 280 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    width: '22%', // ארבעה בשורה
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.cream,
  },
  optionWide: { width: '100%' },
  optionActive: { backgroundColor: colors.pinkAccent },
  optionText: { fontSize: font.bodyLg, color: colors.text },
  optionTextActive: { color: colors.white, fontWeight: font.weight.bold },
});
