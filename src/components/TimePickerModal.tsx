import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Button from './Button';
import { colors, spacing, radius } from '../config/theme';

interface Props {
  visible: boolean;
  value: string; // 'HH:MM' or ''
  onSelect: (timeStr: string) => void;
  onClose: () => void;
  /** רזולוציית הדקות. אירועים ביומן מסתפקים ב-15; תיעוד תינוקת דורש 5. */
  minuteStep?: 5 | 15;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

const OPTION_HEIGHT = 44; // גובה שורה + מרווח — חייב להתאים ל-styles.option
const COLUMN_HEIGHT = 180;

function minuteOptions(step: number) {
  return Array.from({ length: 60 / step }, (_, i) => String(i * step).padStart(2, '0'));
}

/**
 * עמודה נגללת שמביאה את הערך הנבחר לתצוגה בפתיחה — אחרת כל בחירת
 * שעה מתחילה מ-00 ודורשת גלילה ארוכה.
 */
function ScrollColumn({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const ref = useRef<ScrollView>(null);

  // גובה פריט קבוע (OPTION_HEIGHT) מאפשר לחשב את ההיסט במדויק, בלי להסתמך
  // על מדידת תוכן — שמגיעה מאוחר מדי ב-react-native-web.
  useEffect(() => {
    const index = options.indexOf(selected);
    if (index <= 0) return;
    const id = setTimeout(() => {
      // מרכוז יחסי של הערך הנבחר בתוך החלון הנראה
      const y = Math.max(0, index * OPTION_HEIGHT - COLUMN_HEIGHT / 2 + OPTION_HEIGHT / 2);
      ref.current?.scrollTo({ y, animated: false });
    }, 50);
    return () => clearTimeout(id);
    // פעם אחת בלבד בפתיחה — אחר כך הגלילה שייכת למשתמש
  }, []);

  return (
    <View style={styles.column}>
      <Text style={styles.colLabel}>{label}</Text>
      <ScrollView ref={ref} style={styles.colScroll}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.option, selected === opt && styles.optionActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.optionText, selected === opt && styles.optionTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function TimePickerModal({
  visible,
  value,
  onSelect,
  onClose,
  minuteStep = 15,
}: Props) {
  const MINUTES = minuteOptions(minuteStep);
  const [initialHour, initialMinute] = value ? value.split(':') : ['09', '00'];
  const [hour, setHour] = useState(initialHour);
  // שעה קיימת יכולה ליפול בין הצעדים (למשל 07:47) — מעגלים לאפשרות הקרובה
  const [minute, setMinute] = useState(
    () => MINUTES.reduce((best, m) =>
      Math.abs(Number(m) - Number(initialMinute)) < Math.abs(Number(best) - Number(initialMinute))
        ? m
        : best,
    ),
  );

  const confirm = () => {
    onSelect(`${hour}:${minute}`);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>בחר שעה</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.columns}>
            <ScrollColumn label="שעה" options={HOURS} selected={hour} onSelect={setHour} />
            <Text style={styles.colon}>:</Text>
            <ScrollColumn label="דקות" options={MINUTES} selected={minute} onSelect={setMinute} />
          </View>

          <Button label={`אישור ${hour}:${minute}`} onPress={confirm} />
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
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  close: { fontSize: 18, color: colors.textMuted },
  columns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  column: { alignItems: 'center' },
  colLabel: { fontSize: 12, color: colors.textLight, marginBottom: spacing.xs },
  colScroll: { height: COLUMN_HEIGHT, width: 70 },
  option: {
    height: OPTION_HEIGHT - 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: colors.pinkAccent },
  optionText: { fontSize: 16, color: colors.text },
  optionTextActive: { color: colors.white, fontWeight: '700' },
  colon: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 40 },
});
