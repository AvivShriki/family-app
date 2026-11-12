import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../config/theme';

/**
 * גרף עמודות קל, מצויר מ-View בלבד.
 *
 * אין כאן ספריית גרפים בכוונה: שלושה סוגי גרף זה כל מה שהמסך צריך,
 * וספרייה הייתה מוסיפה מאות קילובייט לבאנדל שנטען על רשת סלולרית —
 * ומביאה איתה שפה עיצובית משלה, שהיא בדיוק מה שניסינו לאחד.
 *
 * כל עמודה נגישה בנפרד: גם אם הגובה לא נקרא, הערך מוכרז.
 */
export interface Bar {
  label: string;
  value: number;
  /** הדגשה — למשל היום הנוכחי בתוך השבוע */
  highlight?: boolean;
}

interface Props {
  data: Bar[];
  color: string;
  /** טקסט לקורא מסך ולתווית — "3 ארוחות", "2.5 שעות" */
  format: (v: number) => string;
  height?: number;
  /** כמה תוויות להציג. 24 עמודות לא יכולות להציג 24 תוויות. */
  labelEvery?: number;
}

export default function BarChart({ data, color, format, height = 120, labelEvery = 1 }: Props) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const peak = data.findIndex((d) => d.value === max && max > 0);

  if (max === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={type.small}>אין תיעוד בטווח הזה</Text>
      </View>
    );
  }

  return (
    // row-reverse: העמודה הראשונה בנתונים היא הימנית במסך
    <View style={styles.wrap}>
      <View style={[styles.plot, { height }]}>
        {data.map((d, i) => {
          const ratio = d.value / max;
          return (
            <View key={`${d.label}-${i}`} style={styles.col}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(ratio * 100, d.value > 0 ? 4 : 1.5)}%`,
                      backgroundColor: d.value > 0 ? color : colors.border,
                      opacity: d.highlight || i === peak ? 1 : 0.55,
                    },
                  ]}
                  accessibilityLabel={`${d.label}: ${format(d.value)}`}
                />
              </View>
              <Text
                style={[type.caption, styles.tick, d.highlight && styles.tickActive]}
                numberOfLines={1}
              >
                {i % labelEvery === 0 ? d.label : ''}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[type.caption, styles.peak]}>שיא: {format(max)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  plot: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 3 },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end', gap: spacing.xs },
  barTrack: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.xs, minHeight: 2 },
  tick: { textAlign: 'center', fontSize: 10 },
  tickActive: { color: colors.text, fontWeight: '700' },
  peak: { textAlign: 'left' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    borderRadius: radius.md,
  },
});
