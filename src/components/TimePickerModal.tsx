import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../config/theme';

interface Props {
  visible: boolean;
  value: string; // 'HH:MM' or ''
  onSelect: (timeStr: string) => void;
  onClose: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export default function TimePickerModal({ visible, value, onSelect, onClose }: Props) {
  const [initialHour, initialMinute] = value ? value.split(':') : ['09', '00'];
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

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
            <View style={styles.column}>
              <Text style={styles.colLabel}>שעה</Text>
              <ScrollView style={styles.colScroll}>
                {HOURS.map((hh) => (
                  <TouchableOpacity
                    key={hh}
                    style={[styles.option, hour === hh && styles.optionActive]}
                    onPress={() => setHour(hh)}
                  >
                    <Text style={[styles.optionText, hour === hh && styles.optionTextActive]}>
                      {hh}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.column}>
              <Text style={styles.colLabel}>דקות</Text>
              <ScrollView style={styles.colScroll}>
                {MINUTES.map((mm) => (
                  <TouchableOpacity
                    key={mm}
                    style={[styles.option, minute === mm && styles.optionActive]}
                    onPress={() => setMinute(mm)}
                  >
                    <Text style={[styles.optionText, minute === mm && styles.optionTextActive]}>
                      {mm}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
            <Text style={styles.confirmText}>
              אישור {hour}:{minute}
            </Text>
          </TouchableOpacity>
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
  colScroll: { height: 180, width: 70 },
  option: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: colors.pinkAccent },
  optionText: { fontSize: 16, color: colors.text },
  optionTextActive: { color: colors.white, fontWeight: '700' },
  colon: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 40 },
  confirmBtn: {
    backgroundColor: colors.pinkAccent,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
  },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
