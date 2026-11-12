import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../config/theme';

/**
 * צורות רקע אורגניות, רכות ומטושטשות בקצה המסך.
 *
 * זה האלמנט היחיד באפליקציה שתפקידו דקורטיבי בלבד: הוא שובר את
 * הרקע האחיד ונותן לדף הבית אופי, בלי להתחרות על תשומת לב. הוא
 * מוסתר מקוראי מסך, כי אין בו שום מידע.
 */
export default function BlobBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden>
      <View style={[styles.blob, styles.one]} />
      <View style={[styles.blob, styles.two]} />
      <View style={[styles.blob, styles.three]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999 },
  one: {
    width: 220,
    height: 220,
    top: -90,
    left: -70,
    backgroundColor: colors.mossSoft,
    opacity: 0.9,
  },
  two: {
    width: 150,
    height: 150,
    top: 40,
    right: -60,
    backgroundColor: colors.terracottaSoft,
    opacity: 0.85,
  },
  three: {
    width: 120,
    height: 120,
    top: 210,
    left: -50,
    backgroundColor: colors.skySoft,
    opacity: 0.8,
  },
});
