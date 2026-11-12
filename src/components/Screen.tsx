import React from 'react';
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, CONTENT_MAX } from '../config/theme';

/**
 * המשטח הבסיסי של כל מסך: רקע הקרם, ריווח אחיד, וכיבוד האזור הבטוח.
 *
 * הריווח התחתון מחושב ולא קבוע — במסכים שמתחת לסרגל הטאבים ולכפתור
 * ההוספה המרחף היה חוסר, והשורות האחרונות נחתכו בלי שום דרך להגיע
 * אליהן. זה באג שחזר יותר מפעם אחת, ולכן הוא נפתר כאן פעם אחת.
 */
interface Props {
  children: React.ReactNode;
  /** מסך שיושב בתוך מדור הטאבים — מפנה מקום לסרגל ולכפתור */
  tabBar?: boolean;
  /** בלי גלילה: מסכים ממורכזים (טעינה, מצב ריק מלא) */
  scroll?: boolean;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function Screen({
  children,
  tabBar,
  scroll = true,
  center,
  style,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottom = (tabBar ? 108 : spacing.xl) + insets.bottom;

  if (!scroll) {
    return (
      <View
        style={[
          styles.base,
          { paddingBottom: bottom },
          center && styles.centered,
          styles.padded,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.base, style]}
      contentContainerStyle={[
        styles.padded,
        { paddingBottom: bottom },
        center && styles.centeredContent,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: colors.cream },
  padded: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },
  centered: { justifyContent: 'center' },
  centeredContent: { flexGrow: 1, justifyContent: 'center' },
});
