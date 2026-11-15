import React, { useEffect, useState } from 'react';
import { Animated, Easing, View, StyleSheet, DimensionValue } from 'react-native';
import { c, r, space, shadow } from './theme';
import { useReducedMotion } from './motion';

/**
 * שלד טעינה.
 *
 * מוצג בזמן שהרישומים נטענים, במקום מסך ריק או מונים על אפס —
 * שנקראים כ"אין תיעוד" ומבהילים הורה שבטוח שרשם משהו.
 */
function Bar({ w, h = 14 }: { w: DimensionValue; h?: number }) {
  const reduced = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: w, height: h, borderRadius: h / 2, opacity: reduced ? 0.6 : pulse },
      ]}
    />
  );
}

export default function HomeSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="טוען את התיעוד">
      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: space.sm, alignItems: 'flex-end' }}>
          <Bar w={120} h={12} />
          <Bar w={170} h={24} />
          <Bar w={140} h={12} />
        </View>
        <View style={styles.avatar} />
      </View>

      <View style={styles.cardsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statCard}>
            <View style={styles.dot} />
            <Bar w={44} h={20} />
            <Bar w={52} h={10} />
          </View>
        ))}
      </View>

      <View style={styles.block}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.row}>
            <View style={styles.dot} />
            <View style={{ flex: 1, gap: 6, alignItems: 'flex-end' }}>
              <Bar w={'55%'} h={13} />
              <Bar w={'35%'} h={10} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xl },
  bar: { backgroundColor: c.bgDeep },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: c.bgDeep },
  cardsRow: { flexDirection: 'row-reverse', gap: space.md },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: c.white,
    borderRadius: r.xl,
    paddingVertical: space.lg,
    ...shadow.card,
  },
  dot: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.bgDeep },
  block: {
    backgroundColor: c.white,
    borderRadius: r.xxl,
    padding: space.lg,
    gap: space.lg,
    ...shadow.card,
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.md },
});
