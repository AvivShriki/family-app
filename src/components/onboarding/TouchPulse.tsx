import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../config/theme';
import { useReducedMotion } from '../../screens/home/motion';

/**
 * סימון "אצבע נוגעת כאן".
 *
 * טבעת שמתרחבת ונעלמת, ומתחתיה נקודה קבועה שמסמנת את נקודת המגע
 * עצמה. הנקודה קבועה בכוונה: בלעדיה, ברגע שהטבעת דוהה אין שום דבר
 * שמצביע על המקום, וההדרכה מאבדת את מי שמסתכל רגע אחר כך.
 *
 * כשהמערכת מבקשת לצמצם תנועה, הטבעת מוצגת במצב קבוע בלי לולאה.
 *
 * בלי x/y הרכיב מרונדר בזרימה רגילה, כך שאפשר למרכז אותו בתוך
 * ההורה. עם x/y הוא ממוקם אבסולוטית. העדיפו מרכוז — חישוב ידני
 * של מיקום נשבר ב-RTL.
 */
export default function TouchPulse({
  x,
  y,
  size = 44,
  delay = 0,
  color = colors.pinkAccent,
}: {
  x?: number;
  y?: number;
  size?: number;
  delay?: number;
  /** חייב לנגוד את הרקע. ורוד על הכפתור הוורוד פשוט נעלם. */
  color?: string;
}) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(250),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, reduced, delay]);

  const ringStyle = reduced
    ? { opacity: 0.45, transform: [{ scale: 1.1 }] }
    : {
        opacity: progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 0.55, 0],
        }),
        transform: [
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) },
        ],
      };

  const positioned =
    x !== undefined && y !== undefined
      ? { position: 'absolute' as const, left: x - size / 2, top: y - size / 2 }
      : null;

  return (
    <View pointerEvents="none" style={[styles.anchor, { width: size, height: size }, positioned]}>
      <Animated.View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, borderColor: color },
          ringStyle as never,
        ]}
      />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.4,
  },
});
