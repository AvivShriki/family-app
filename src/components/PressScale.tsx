import React, { useState } from 'react';
import { Animated, Pressable, ViewStyle, StyleProp, PressableProps } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion } from '../config/theme';

/**
 * עטיפת לחיצה עם כיווץ עדין.
 *
 * זו המיקרו-אינטראקציה הכי שימושית במוצר שמתפעלים ביד אחת: היא נותנת
 * אישור מיידי שהנגיעה נרשמה, עוד לפני שהנתון מגיע מהשרת. הכיווץ קטן
 * (0.97) וקצר, וכשהמשתמש ביקש לצמצם תנועה הוא פשוט לא קורה.
 */
interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** עוצמת הכיווץ. אריח גדול יכול להרשות לעצמו יותר מכפתור קטן. */
  to?: number;
}

export default function PressScale({ children, style, to = 0.97, ...rest }: Props) {
  // useState ולא useRef: ערך האנימציה נוצר פעם אחת, ואין צורך לגעת
  // ב-ref בזמן רינדור
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();

  const animate = (value: number) => {
    if (reduced) return;
    Animated.timing(scale, {
      toValue: value,
      duration: motion.fast,
      useNativeDriver: true,
    }).start();
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
