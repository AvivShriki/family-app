import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import Button from './Button';
import { colors, spacing, radius, type, TOUCH } from '../config/theme';

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
    <BottomSheet visible={visible} title="כמות" onClose={onClose} scroll={false}>
      {/* הנקה — אין כמות למדוד, ולכן היא אפשרות ולא "אפס" */}
      <TouchableOpacity
        style={[styles.nursing, amount === '' && styles.nursingActive]}
        onPress={() => setAmount('')}
        accessibilityRole="button"
        accessibilityLabel="הנקה, ללא כמות"
        accessibilityState={{ selected: amount === '' }}
      >
        <MaterialCommunityIcons
          name="mother-nurse"
          size={20}
          color={amount === '' ? colors.sage : colors.textMuted}
        />
        <Text style={[type.bodyStrong, amount !== '' && { color: colors.textSecondary }]}>
          {'הנקה — ללא כמות'}
        </Text>
      </TouchableOpacity>

      <Text style={[type.label, styles.unit]}>{'מ"ל'}</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
        {AMOUNTS.map((ml) => {
          const active = amount === ml;
          return (
            <TouchableOpacity
              key={ml}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setAmount(ml)}
              accessibilityRole="button"
              accessibilityLabel={`${ml} מיליליטר`}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{ml}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Button
        label={amount ? `אישור ${amount} מ"ל` : 'אישור ללא כמות'}
        onPress={confirm}
        style={{ marginTop: spacing.md }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  nursing: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: TOUCH + 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  nursingActive: { borderColor: colors.sage, backgroundColor: colors.sageSoft },
  unit: { marginTop: spacing.md, marginBottom: spacing.xs },
  scroll: { maxHeight: 260 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    width: '22%', // ארבעה בשורה
    minHeight: TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { backgroundColor: colors.sage, borderColor: colors.sage },
  optionText: { ...type.bodyStrong, textAlign: 'center' },
  optionTextActive: { color: colors.white },
});
