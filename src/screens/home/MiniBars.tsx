import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { c, t, r } from './theme';

export interface Day {
  /** מפתח לקריאת מסך: "12 בנובמבר" */
  label: string;
  value: number;
  today?: boolean;
}

/**
 * גרף עמודות זעיר, בלי ספרייה.
 *
 * row-reverse: היום הראשון בנתונים הוא הימני במסך — בעברית הזמן
 * זורם שמאלה, בדיוק כמו בכל גרף אחר באפליקציה.
 *
 * יום בלי תיעוד מקבל קו דק ולא כלום, אחרת נוצר חור בגרף שנראה
 * כמו תקלה ולא כמו יום שקט.
 */
export default function MiniBars({
  data,
  color,
  height = 48,
}: {
  data: Day[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.row, { height }]}>
      {data.map((d, i) => (
        <View key={i} style={styles.col}>
          <View
            accessibilityLabel={`${d.label}: ${d.value}`}
            style={[
              styles.bar,
              {
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 10 : 4)}%`,
                backgroundColor: d.value > 0 ? color : c.bgDeep,
                opacity: d.today ? 1 : 0.62,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

export function BarsAxis({ from, to }: { from: string; to: string }) {
  return (
    <View style={styles.axis}>
      <Text style={t.caption}>{to}</Text>
      <Text style={t.caption}>{from}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 2 },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: r.sm, minHeight: 2 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
});
