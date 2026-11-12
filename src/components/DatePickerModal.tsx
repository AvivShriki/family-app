import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import { colors, spacing, radius, type, TOUCH } from '../config/theme';

interface Props {
  visible: boolean;
  value: string; // 'YYYY-MM-DD' או ''
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const HE_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function DatePickerModal({ visible, value, onSelect, onClose }: Props) {
  const initial = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));
  const isSelected = (d: number) => value === toDateStr(year, month, d);
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const pick = (d: number) => {
    onSelect(toDateStr(year, month, d));
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="בחירת תאריך" onClose={onClose} scroll={false}>
      <View style={styles.monthBar}>
        {/* בעברית הזמן זורם שמאלה: החץ השמאלי מקדם חודש */}
        <TouchableOpacity
          onPress={() => goMonth(1)}
          style={styles.arrowBtn}
          accessibilityRole="button"
          accessibilityLabel="החודש הבא"
        >
          <Ionicons name="chevron-back" size={22} color={colors.sage} />
        </TouchableOpacity>
        <Text style={type.h3}>
          {HE_MONTHS[month]} {year}
        </Text>
        <TouchableOpacity
          onPress={() => goMonth(-1)}
          style={styles.arrowBtn}
          accessibilityRole="button"
          accessibilityLabel="החודש הקודם"
        >
          <Ionicons name="chevron-forward" size={22} color={colors.sage} />
        </TouchableOpacity>
      </View>

      {/* row-reverse: יום ראשון בימין, כמו בכל לוח שנה עברי */}
      <View style={styles.dowRow}>
        {HE_DAYS.map((d) => (
          <Text key={d} style={[type.caption, styles.dowText]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
          const selected = isSelected(day);
          return (
            <View key={day} style={styles.cell}>
              <TouchableOpacity
                style={[
                  styles.day,
                  selected && styles.daySelected,
                  !selected && isToday(day) && styles.dayToday,
                ]}
                onPress={() => pick(day)}
                accessibilityRole="button"
                accessibilityLabel={`${day} ב${HE_MONTHS[month]} ${year}`}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{day}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.todayBtn}
        onPress={() => {
          onSelect(toDateStr(today.getFullYear(), today.getMonth(), today.getDate()));
          onClose();
        }}
        accessibilityRole="button"
      >
        <Text style={[type.smallStrong, { color: colors.sage, textAlign: 'center' }]}>היום</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  arrowBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  dowRow: { flexDirection: 'row-reverse', marginBottom: spacing.xs },
  dowText: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  day: {
    width: '100%',
    height: '100%',
    maxWidth: 44,
    maxHeight: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: colors.sage },
  dayToday: { borderWidth: 1.5, borderColor: colors.moss },
  dayNum: { ...type.bodyStrong, textAlign: 'center' },
  dayNumSelected: { color: colors.white },
  todayBtn: { minHeight: TOUCH, justifyContent: 'center', marginTop: spacing.sm },
});
