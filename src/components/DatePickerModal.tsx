import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors, spacing, radius } from '../config/theme';

interface Props {
  visible: boolean;
  value: string; // 'YYYY-MM-DD' or ''
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
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

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));
  const isSelected = (d: number) => value === toDateStr(year, month, d);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>בחר תאריך</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthBar}>
            <TouchableOpacity onPress={() => goMonth(1)} style={styles.arrowBtn}>
              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{HE_MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={() => goMonth(-1)} style={styles.arrowBtn}>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dowRow}>
            {HE_DAYS.map((d) => <Text key={d} style={styles.dowText}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.cell} />;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.cell, isSelected(day) && styles.cellSelected]}
                  onPress={() => { onSelect(toDateStr(year, month, day)); onClose(); }}
                >
                  <Text style={[styles.dayNum, isSelected(day) && styles.dayNumSelected]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0004', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: 40,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  close: { fontSize: 18, color: colors.textMuted },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  arrowBtn: { padding: spacing.sm },
  arrow: { fontSize: 24, color: colors.pinkAccent, fontWeight: '300' },
  monthTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  dowRow: { flexDirection: 'row', marginBottom: spacing.xs },
  dowText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: colors.pinkAccent, borderRadius: radius.md },
  dayNum: { fontSize: 15, color: colors.text },
  dayNumSelected: { color: colors.white, fontWeight: '700' },
});
