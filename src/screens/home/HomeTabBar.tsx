import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c, t, r, space, shadow, TOUCH, MAX_W } from './theme';
import { Press } from './motion';

/**
 * סרגל הניווט הקבוע בתחתית מסך הבית.
 *
 * הוא שייך למסך הבית בלבד ואינו נוגע ב-BabyNavigator: כל פריט כאן
 * מנווט אל אותו יעד שהסרגל של מדור התינוקת מוביל אליו, דרך אותה
 * קריאת ניווט בדיוק. כך נוספה הגישה המהירה בלי לשנות שום מסך אחר.
 *
 * אף פריט אינו מסומן כפעיל, וזה נכון: המסך הפעיל הוא הבית, והוא
 * לא אחד מחמשת היעדים האלה.
 */
type Item = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

interface Props {
  onMonth: () => void;
  onJournal: () => void;
  onAdd: () => void;
  onSummary: () => void;
  onSettings: () => void;
}

export default function HomeTabBar({ onMonth, onJournal, onAdd, onSummary, onSettings }: Props) {
  const insets = useSafeAreaInsets();

  // נפרסים משמאל לימין סביב כפתור ההוספה המרכזי
  const left: Item[] = [
    { key: 'settings', icon: 'settings-outline', label: 'הגדרות', onPress: onSettings },
    { key: 'summary', icon: 'stats-chart-outline', label: 'סיכום', onPress: onSummary },
  ];
  const right: Item[] = [
    { key: 'journal', icon: 'book-outline', label: 'יומן', onPress: onJournal },
    { key: 'month', icon: 'calendar-outline', label: 'חודש', onPress: onMonth },
  ];

  const tab = (it: Item) => (
    <TouchableOpacity
      key={it.key}
      style={styles.item}
      onPress={it.onPress}
      accessibilityRole="button"
      accessibilityLabel={it.label}
      activeOpacity={0.7}
    >
      <Ionicons name={it.icon} size={21} color={c.textSoft} />
      <Text style={styles.label} numberOfLines={1}>
        {it.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.bar}>
      <View style={[styles.inner, { paddingBottom: space.sm + insets.bottom }]}>
        {left.map(tab)}

        <View style={styles.fabSlot}>
          <Press
            to={0.9}
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel="תיעוד חדש"
            style={styles.fabOuter}
          >
            <View style={styles.fab}>
              <Ionicons name="add" size={28} color={c.white} />
            </View>
          </Press>
        </View>

        {right.map(tab)}
      </View>
    </View>
  );
}

/** הגובה שהסרגל תופס, כדי שהתוכן מעליו לא יסתתר מתחתיו */
export const TAB_BAR_HEIGHT = 64;

const styles = StyleSheet.create({
  bar: {
    backgroundColor: c.white,
    borderTopLeftRadius: r.xl,
    borderTopRightRadius: r.xl,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
    ...shadow.lift,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_W,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: space.md,
    paddingHorizontal: space.sm,
  },
  item: { flex: 1, alignItems: 'center', minHeight: TOUCH, gap: 3 },
  label: { ...t.caption, textAlign: 'center', color: c.textSoft },

  // הכפתור יוצא מעל הסרגל, ולכן הוא צריך מקום משלו כדי לא לדחוס פריטים
  fabSlot: { width: 72, alignItems: 'center' },
  fabOuter: { width: 56, height: 56, marginTop: -28 },
  fab: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: c.roseDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: c.white,
    ...shadow.lift,
  },
});
