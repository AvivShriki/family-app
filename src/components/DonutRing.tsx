import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../config/theme';

/**
 * טבעת התקדמות, מצוירת מ-View בלבד.
 *
 * אין כאן ספריית SVG בכוונה: זו הטבעת היחידה באפליקציה, והוספת
 * ספרייה בשבילה הייתה מכניסה מאות קילובייט לבאנדל שנטען על רשת
 * סלולרית. הטריק הוא עיגול עם שני צדדים צבועים בלבד, שמסתובב בתוך
 * חלון שחושף חצי ממנו — חצי אחד לכל 180 מעלות.
 */
interface Props {
  /** 0 עד 1 */
  progress: number;
  size?: number;
  width?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}

export default function DonutRing({
  progress,
  size = 96,
  width = 10,
  color = colors.sage,
  track = colors.mossSoft,
  children,
}: Props) {
  const deg = Math.max(0, Math.min(1, progress)) * 360;
  // הצד הצבוע הוא חצי עיגול (פאה עליונה + ימנית), שמכסה 180 מעלות
  // סביב השעה 1:30. כדי שקצה הקשת ינחת בדיוק על הזווית המבוקשת צריך
  // לסובב אותו ב-(זווית − 135). החצי הימני נעצר ב-180, והשמאלי מתחיל
  // משם — ולכן לכל אחד יש תקרה או רצפה משלו.
  const rightRotate = Math.min(deg, 180) - 135;
  const leftRotate = Math.max(deg, 180) - 135;

  // חצי עיגול: שתי הפאות העליונה והימנית צבועות
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
      {/* חצי ימין — 180 המעלות הראשונות */}
      <View style={[styles.clip, { width: size / 2, height: size, left: size / 2 }]}>
        <View style={[arc, { left: -size / 2, transform: [{ rotate: `${rightRotate}deg` }] }]} />
      </View>
      {/* חצי שמאל — מה שמעבר ל-180 */}
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
