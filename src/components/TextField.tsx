import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, type, TOUCH } from '../config/theme';

/**
 * שדה קלט עם תווית.
 *
 * לכל שדה באפליקציה יש תווית גלויה, ולא רק placeholder: placeholder נעלם
 * ברגע שמתחילים להקליד, וקורא מסך לא תמיד מקריא אותו. התווית קשורה לשדה
 * דרך accessibilityLabel, כך שגם מי שמנווט במקלדת יודע מה הוא ממלא.
 *
 * מצב השגיאה משנה גם את הצבע וגם מוסיף טקסט — צבע לבדו אינו סימון.
 */
interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  /** שדה סיסמה עם כפתור הצגה/הסתרה */
  password?: boolean;
}

export default function TextField({ label, error, hint, password, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={type.label}>{label}</Text>
      <View style={[styles.field, focused && styles.focused, !!error && styles.errored]}>
        <TextInput
          style={[styles.input, rest.multiline && styles.multiline]}
          textAlign="right"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          secureTextEntry={password && !reveal}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {password ? (
          <TouchableOpacity
            onPress={() => setReveal((r) => !r)}
            style={styles.reveal}
            accessibilityRole="button"
            accessibilityLabel={reveal ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'}
          >
            <Ionicons
              name={reveal ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text style={[type.small, styles.errorText]}>{error}</Text>
      ) : hint ? (
        <Text style={type.small}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, gap: spacing.xs },
  field: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH + 6,
  },
  focused: { borderColor: colors.sage, backgroundColor: colors.white },
  errored: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  input: {
    flex: 1,
    ...type.body,
    color: colors.text,
    paddingVertical: spacing.sm + 2,
    // react-native-web מצייר טבעת פוקוס משלו על ה-input; הגבול שלנו
    // כבר מסמן פוקוס, ושתיהן יחד נראות כמו תקלה
    outlineStyle: 'none',
  } as any,
  reveal: {
    width: TOUCH,
    height: TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  // שדה רב-שורות צריך גובה אמיתי, ו-top כדי שהטקסט יתחיל מלמעלה
  multiline: { minHeight: 76, textAlignVertical: 'top', paddingTop: spacing.sm + 2 },
  errorText: { color: colors.danger },
});
