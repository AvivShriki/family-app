import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

/**
 * טבעת התקדמות, מצוירת מ-View בלבד.
 *
 * אין בפרויקט ספריית SVG, וטבעת אחת לא מצדיקה להוסיף אחת. הטריק:
 * עיגול שרק שתי פאותיו צבועות — כלומר חצי טבעת — שמסתובב בתוך חלון
 * שחושף חצי ממנו. חצי אחד לכל 180 מעלות.
 *
 * קצה הקשת צריך לנחות בדיוק על הזווית המבוקשת, ולכן הסיבוב הוא
 * (זווית − 135): החצי הצבוע מכוסה סביב השעה 1:30.
 */
export default function Ring({
  progress,
  size = 76,
  width = 8,
  color,
  track,
  children,
}: {
  progress: number;
  size?: number;
  width?: number;
  color: string;
  track: string;
  children?: React.ReactNode;
}) {
  const deg = Math.max(0, Math.min(1, progress)) * 360;
  const rightRotate = Math.min(deg, 180) - 135;
  const leftRotate = Math.max(deg, 180) - 135;

  const arc: ViewStyle = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: width,
    borderTopColor: color,
    borderRightColor: color,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  };

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: width,
          borderColor: track,
        }}
      />
      <View style={[styles.clip, { width: size / 2, height: size, left: size / 2 }]}>
        <View style={[arc, { left: -size / 2, transform: [{ rotate: `${rightRotate}deg` }] }]} />
      </View>
      <View style={[styles.clip, { width: size / 2, height: size, left: 0 }]}>
        <View style={[arc, { transform: [{ rotate: `${leftRotate}deg` }] }]} />
      </View>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { position: 'absolute', overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
