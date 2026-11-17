import React, { useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, spacing, shadow } from '../../config/theme';
import { useReducedMotion } from '../../screens/home/motion';
import { SLIDES } from './slides';

/**
 * הדרכת הכניסה הראשונה.
 *
 * מעבר בין שקופיות נעשה בכפתורים ולא בהחלקה: האפליקציה בעברית,
 * וגלילה אופקית מדפדפת הפוך בין דפדפנים שונים ב-RTL. כפתור מפורש
 * הוא חד-משמעי בשני הכיוונים, וגם נגיש יותר.
 */
export default function OnboardingTour({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));

  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  /**
   * מעבר בין שקופיות: החלפה מיידית, והנפשת כניסה בלבד.
   *
   * הניסיון הראשון היה דהייה החוצה ואז החלפה בתוך ה-callback. זה נראה
   * רך יותר על הנייר, אבל תלה את החלפת השקופית בסיום ההנפשה — וכשהיא
   * לא הסתיימה, המסך נתקע על אותה שקופית בשקיפות חלקית. הגרסה הזו
   * לא יכולה להיתקע: המצב מתחלף קודם, וההנפשה היא קישוט בלבד.
   *
   * כהקשה כפולה פשוט מקדמת פעמיים, וזה בדיוק מה שהמשתמש ביקש.
   */
  const goTo = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= SLIDES.length) return;
    setIndex(next);
    if (reduced) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { marginTop: insets.top + spacing.md, marginBottom: insets.bottom + spacing.md },
          ]}
        >
          <Pressable
            onPress={onDone}
            style={styles.skip}
            accessibilityRole="button"
            accessibilityLabel="דילוג על ההדרכה"
          >
            <Text style={styles.skipText}>דילוג</Text>
          </Pressable>

          <Animated.View style={[styles.slide, { opacity: fade }]}>
            <View style={styles.art}>{slide.render()}</View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </Animated.View>

          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>

          <Pressable
            onPress={() => (last ? onDone() : goTo(1))}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{last ? 'יאללה, מתחילים' : 'הבא'}</Text>
          </Pressable>

          <Pressable
            onPress={() => goTo(-1)}
            disabled={index === 0}
            style={styles.back}
            accessibilityRole="button"
          >
            <Text style={[styles.backText, index === 0 && styles.backDisabled]}>חזרה</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(74, 55, 40, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.cream,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.soft,
  },
  skip: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  skipText: {
    fontSize: font.small,
    color: colors.textLight,
  },
  slide: {
    alignItems: 'center',
  },
  art: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: font.title,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: font.body,
    lineHeight: 22,
    color: colors.textLight,
    textAlign: 'center',
    minHeight: 66,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.creamDark,
  },
  dotActive: {
    backgroundColor: colors.pinkAccent,
    width: 18,
  },
  primary: {
    width: '100%',
    backgroundColor: colors.pinkAccent,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressed: { opacity: 0.85 },
  primaryText: {
    color: colors.white,
    fontSize: font.bodyLg,
    fontWeight: font.weight.semibold,
  },
  back: {
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  backText: {
    fontSize: font.small,
    color: colors.textLight,
  },
  backDisabled: {
    opacity: 0,
  },
});
