import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  AccessibilityInfo,
  ViewStyle,
  StyleProp,
  Pressable,
  PressableProps,
} from 'react-native';

/**
 * האנימציות של מסך הבית.
 *
 * בפרויקט אין ספריית אנימציה — לא Reanimated, לא Framer Motion —
 * ולכן הכול נשען על Animated של React Native עצמו. זו גם הבחירה
 * הנכונה כאן: שלוש אנימציות קטנות לא מצדיקות מאות קילובייט בבאנדל
 * שנטען על רשת סלולרית.
 *
 * כל אנימציה בקובץ הזה מכבדת את הגדרת "צמצום תנועה" של מערכת
 * ההפעלה. כשהיא דולקת, המצב הסופי מוצג מיד.
 */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduced(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}

/**
 * כניסה רכה: הופעה הדרגתית והחלקה קלה כלפי מעלה.
 * delay יוצר את אפקט המדרגות בין כרטיסים סמוכים.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 14,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [reduced, delay, v]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * ספירה עולה אל הערך.
 *
 * הערך מוחזר כמספר ולא כאנימציה על הטקסט, כי Animated לא יודע
 * להנפיש תוכן של Text. כשהנתון משתנה אחרי טעינה — למשל רישום חדש
 * שנכנס — הספירה רצה מהערך הקודם אל החדש, וכך העדכון נראה.
 */
export function useCountUp(target: number, duration = 700): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const [anim] = useState(() => new Animated.Value(0));
  // מה שמוצג כרגע על המסך. כשהיעד משתנה באמצע ספירה, הספירה הבאה
  // ממשיכה מכאן ולא קופצת אחורה אל ההתחלה הקודמת.
  const current = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const from = current.current;
    const delta = target - from;
    if (delta === 0) return;

    anim.setValue(0);
    const id = anim.addListener(({ value: p }) => {
      const v = Math.round(from + delta * p);
      current.current = v;
      setShown(v);
    });
    const a = Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      // listener דורש את מנוע ה-JS; המספר מתעדכן ב-state
      useNativeDriver: false,
    });
    a.start(({ finished }) => {
      if (!finished) return;
      current.current = target;
      setShown(target);
    });
    return () => {
      a.stop();
      anim.removeListener(id);
    };
  }, [target, duration, reduced, anim]);

  // בצמצום תנועה אין ספירה בכלל — הערך הסופי מוצג מיד
  return reduced ? target : shown;
}

/** כיווץ עדין בלחיצה — אישור מיידי שהנגיעה נרשמה */
export function Press({
  children,
  style,
  to = 0.975,
  ...rest
}: PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle>; to?: number }) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));

  const animate = (v: number) => {
    if (reduced) return;
    Animated.timing(scale, { toValue: v, duration: 110, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={() => animate(to)}
        onPressOut={() => animate(1)}
        style={{ flex: 1 }}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
