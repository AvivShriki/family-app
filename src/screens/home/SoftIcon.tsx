import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MCIcon } from './activity';

/**
 * מדליון האייקון.
 *
 * העומק מגיע משתי שכבות ולא מאיור תלת-ממדי: עיגול בגוון הפעילות,
 * ומעליו עיגול פנימי בהיר יותר שיוצר נפילת אור עדינה. זה נותן את
 * התחושה המרומזת של כפתור פיזי בלי לגרור קובצי תמונה לבאנדל, ובלי
 * שהאייקונים ייראו שונה בכל גודל מסך.
 */
export default function SoftIcon({
  icon,
  tint,
  surface,
  size = 44,
}: {
  icon: MCIcon;
  tint: string;
  surface: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.outer,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: surface },
      ]}
    >
      {/* נפילת האור: חצי עליון בהיר, מרוכך בשקיפות */}
      <View style={[styles.gloss, { borderRadius: size / 2, height: size * 0.5 }]} />
      <MaterialCommunityIcons name={icon} size={Math.round(size * 0.48)} color={tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
