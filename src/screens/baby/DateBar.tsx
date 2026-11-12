import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, type, TOUCH, CONTENT_MAX } from '../../config/theme';
import { isSameDay } from '../../utils/dates';

/**
 * ניווט התאריך של מדור התינוקת.
 *
 * היומן והסיכום החזיקו עד כה שני העתקים של אותה שורה, שנבדלו בפרטים
 * (אחד הראה את שם היום, השני לא). עכשיו זה רכיב אחד.
 *
 * כיווניות: בעברית הזמן זורם שמאלה, ולכן החץ השמאלי מקדם יום והימני
 * מחזיר. קדימה נחסם בהיום — אין מה לתעד לעתיד.
 */
interface Props {
  date: Date;
  onChange: (d: Date) => void;
  /** שורה שנייה — גיל התינוקת ביום הנבחר, או כל הקשר אחר */
  caption?: string;
}

export default function DateBar({ date, onChange, caption }: Props) {
  const today = isSameDay(date.getTime(), new Date());

  const go = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    onChange(d);
  };

  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={styles.arrow}
        onPress={() => go(1)}
        disabled={today}
        accessibilityRole="button"
        accessibilityLabel="היום הבא"
        accessibilityState={{ disabled: today }}
      >
        <Ionicons name="chevron-back" size={22} color={today ? colors.border : colors.sage} />
      </TouchableOpacity>

      <View style={styles.middle}>
        <Text style={type.h3} numberOfLines={1}>
          {today
            ? 'היום'
            : date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={[type.caption, styles.caption]} numberOfLines={1}>
          {today
            ? date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
            : caption}
        </Text>
      </View>

      {/* חזרה להיום אחרי גלישה אחורה — אחרת צריך ללחוץ חץ פעם ליום */}
      {!today ? (
        <TouchableOpacity
          style={styles.todayBtn}
          onPress={() => onChange(new Date())}
          accessibilityRole="button"
          accessibilityLabel="חזרה להיום"
        >
          <Text style={styles.todayText}>היום</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.arrow}
        onPress={() => go(-1)}
        accessibilityRole="button"
        accessibilityLabel="היום הקודם"
      >
        <Ionicons name="chevron-forward" size={22} color={colors.sage} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrow: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, alignItems: 'center' },
  caption: { textAlign: 'center' },
  todayBtn: {
    minHeight: TOUCH - 10,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: { ...type.caption, color: colors.sage, fontWeight: '700' },
});
