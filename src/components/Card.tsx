import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '../config/theme';

/**
 * המשטח הלבן של האפליקציה. רדיוס וצל נקבעים כאן בלבד, כך ששום שני
 * כרטיסים לא יראו אחרת.
 *
 * tone מאפשר כרטיס בגוון במקום לבן — לכרטיס ההדגשה בדף הבית — בלי
 * שמסך יצטרך להגדיר צל וגבול מחדש.
 */
interface Props {
  children: React.ReactNode;
  tone?: 'white' | 'sage' | 'moss' | 'cream';
  /** ללא ריווח פנימי — לכרטיסים שמכילים שורות בעלות ריווח משלהן */
  flush?: boolean;
  /** בלי צל, עם קו גבול — לאלמנטים משניים שלא צריכים להתרומם */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TONE: Record<string, string> = {
  white: colors.white,
  sage: colors.sageSoft,
  moss: colors.mossSoft,
  cream: colors.creamDeep,
};

export default function Card({ children, tone = 'white', flush, flat, style }: Props) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: TONE[tone] },
        !flush && styles.padded,
        flat ? styles.flat : shadow.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden' },
  padded: { padding: spacing.md },
  flat: { borderWidth: 1, borderColor: colors.border },
});
