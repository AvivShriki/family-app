import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet from './BottomSheet';
import Button from './Button';
import { colors, spacing, radius, type, font } from '../config/theme';

interface Props {
  visible: boolean;
  value: string; // 'HH:MM' או ''
  onSelect: (timeStr: string) => void;
  onClose: () => void;
  /** רזולוציית הדקות. תיעוד תינוקת דורש 5. */
  minuteStep?: 5 | 15;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

const OPTION_HEIGHT = 44; // חייב להתאים ל-styles.option
const COLUMN_HEIGHT = 190;

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

  // גובה פריט קבוע מאפשר לחשב את ההיסט במדויק, בלי להסתמך על מדידת
  // תוכן — שמגיעה מאוחר מדי ב-react-native-web.
  useEffect(() => {
    const index = options.indexOf(selected);
    if (index <= 0) return;
    const id = setTimeout(() => {
      const y = Math.max(0, index * OPTION_HEIGHT - COLUMN_HEIGHT / 2 + OPTION_HEIGHT / 2);
      ref.current?.scrollTo({ y, animated: false });
    }, 50);
    return () => clearTimeout(id);
    // פעם אחת בלבד בפתיחה — אחר כך הגלילה שייכת למשתמש
  }, []);

  return (
    <View style={styles.column}>
      <Text style={[type.label, styles.colLabel]}>{label}</Text>
      <View style={styles.colFrame}>
        <ScrollView ref={ref} style={styles.colScroll} showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const active = selected === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => onSelect(opt)}
                accessibilityRole="button"
                accessibilityLabel={`${label} ${opt}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
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
  // שעה קיימת יכולה ליפול בין הצעדים (למשל 07:47) — מעגלים לקרובה
  const [minute, setMinute] = useState(() =>
    MINUTES.reduce((best, m) =>
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
    <BottomSheet visible={visible} title="בחירת שעה" onClose={onClose} scroll={false}>
      <View style={styles.preview}>
        <Text style={styles.previewText}>
          {hour}:{minute}
        </Text>
      </View>

      <View style={styles.columns}>
        <ScrollColumn label="שעה" options={HOURS} selected={hour} onSelect={setHour} />
        <ScrollColumn label="דקות" options={MINUTES} selected={minute} onSelect={setMinute} />
      </View>

      <Button label="אישור" onPress={confirm} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignSelf: 'center',
    backgroundColor: colors.sageSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  previewText: {
    ...type.display,
    textAlign: 'center',
    color: colors.sage,
    // ספרות באותו רוחב — אחרת השעה "קופצת" בכל גלילה
    fontVariant: ['tabular-nums'],
  },
  columns: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  column: { flex: 1, maxWidth: 140, alignItems: 'stretch' },
  colLabel: { textAlign: 'center', marginBottom: spacing.xs },
  colFrame: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  colScroll: { height: COLUMN_HEIGHT },
  option: {
    height: OPTION_HEIGHT - 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    marginHorizontal: spacing.xs,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: colors.sage },
  optionText: {
    fontFamily: font.family,
    fontSize: font.size.bodyLg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionTextActive: { color: colors.white, fontWeight: font.weight.bold },
});
