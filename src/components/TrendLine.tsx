import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors, spacing, radius, type } from '../config/theme';

/**
 * גרף מגמה — קו עם נקודות, מצויר מ-View בלבד.
 *
 * כל קטע בין שתי נקודות הוא מלבן דק שמסובב בזווית שבין שתי הנקודות.
 * זה נשמע כמו טריק, אבל זו הדרך לצייר קו רציף בלי לגרור ספריית SVG
 * לבאנדל בשביל גרף אחד.
 *
 * הגרף נמדד לפי הרוחב בפועל (onLayout) ולא לפי הנחה, כדי שייראה נכון
 * גם בטלפון צר וגם בטאבלט.
 */
export interface Point {
  label: string;
  value: number;
}

interface Props {
  data: Point[];
  color?: string;
  height?: number;
  format?: (v: number) => string;
}

const DOT = 7;

export default function TrendLine({
  data,
  color = colors.terracottaDeep,
  height = 92,
  format = (v) => String(v),
}: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={type.small}>צריך לפחות שתי נקודות כדי להראות מגמה</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const span = max - min || 1;
  const pad = DOT;
  const usableW = Math.max(width - pad * 2, 1);
  const usableH = height - pad * 2;

  // הנקודה הראשונה בנתונים היא הימנית במסך — הזמן בעברית זורם שמאלה
  const pos = data.map((d, i) => ({
    x: pad + usableW - (i / (data.length - 1)) * usableW,
    y: pad + (1 - (d.value - min) / span) * usableH,
    d,
  }));

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ height }} onLayout={onLayout}>
        {width > 0
          ? pos.slice(0, -1).map((p, i) => {
              const n = pos[i + 1];
              const dx = n.x - p.x;
              const dy = n.y - p.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              return (
                <View
                  key={`seg-${i}`}
                  style={{
                    position: 'absolute',
                    // המלבן ממוקם כך שמרכזו הוא אמצע הקטע, ואז מסובב
                    // סביב מרכזו. סיבוב סביב קצה דורש שרשרת הזזות
                    // שקל מאוד לטעות בסדר שלה — וכך גם קרה.
                    left: (p.x + n.x) / 2 - len / 2,
                    top: (p.y + n.y) / 2 - 1.25,
                    width: len,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: color,
                    opacity: 0.55,
                    transform: [{ rotate: `${angle}deg` }],
                  }}
                />
              );
            })
          : null}

        {width > 0
          ? pos.map((p, i) => (
              <View
                key={`dot-${i}`}
                accessibilityLabel={`${p.d.label}: ${format(p.d.value)}`}
                style={{
                  position: 'absolute',
                  left: p.x - DOT / 2,
                  top: p.y - DOT / 2,
                  width: DOT,
                  height: DOT,
                  borderRadius: DOT / 2,
                  backgroundColor: i === 0 ? color : colors.white,
                  borderWidth: 2,
                  borderColor: color,
                }}
              />
            ))
          : null}
      </View>

      <View style={styles.axis}>
        <Text style={type.caption}>{data[data.length - 1].label}</Text>
        <Text style={type.caption}>{data[0].label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    borderRadius: radius.md,
  },
});
