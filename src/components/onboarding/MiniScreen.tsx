import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, font, spacing } from '../../config/theme';
import TouchPulse from './TouchPulse';

/**
 * ייצוג מוקטן של מסך האפליקציה, מצויר בקוד.
 *
 * בכוונה לא צילומי מסך: צילום מתיישן בשקט בכל שינוי עיצוב, והוא גם
 * מחייב להמציא נתוני דמה או לחשוף נתונים אמיתיים. האיור כאן מצייר
 * את הצורה בלבד — בלי שום רישום של תינוקת אמיתית.
 */

const MINI_WIDTH = 188;
const MINI_HEIGHT = 268;
const MINI_TABBAR_HEIGHT = 46;

type TabDef = { icon: keyof typeof Ionicons.glyphMap; label: string };

// אותו סדר בדיוק כמו בסרגל האמיתי (BabyNavigator), כדי שמי שראה
// את ההדרכה ימצא את הכפתור באותו מקום.
const LEFT_TABS: TabDef[] = [
  { icon: 'settings-outline', label: 'הגדרות' },
  { icon: 'stats-chart-outline', label: 'סיכום' },
];
const RIGHT_TABS: TabDef[] = [
  { icon: 'book-outline', label: 'יומן' },
  { icon: 'calendar-outline', label: 'חודש' },
];

/**
 * סימון הנגיעה מצויר בתוך הכפתור שאליו הוא מתייחס, ולא לפי קואורדינטות.
 *
 * זה לא קוסמטי: הסרגל מסודר בשורה, וב-RTL הסדר הוויזואלי מתהפך. חישוב
 * ידני של מיקום היה נכון בכיוון אחד ושקרי בשני — ומצביע על הכפתור הלא נכון.
 */
function Pulse({ color }: { color?: string }) {
  return (
    <View pointerEvents="none" style={styles.pulseHost}>
      {/* 30 ולא יותר: הטבעת מתרחבת עד פי 1.5, וסרגל הלשוניות בגובה 46 */}
      <TouchPulse size={30} color={color} />
    </View>
  );
}

export function MiniTabBar({
  active,
  pulseOn,
  pulseFab,
}: {
  active?: string;
  /** תווית הלשונית שעליה תסומן נגיעה */
  pulseOn?: string;
  pulseFab?: boolean;
}) {
  const renderTab = (t: TabDef) => {
    const focused = t.label === active;
    return (
      <View key={t.label} style={styles.tabItem}>
        <Ionicons name={t.icon} size={13} color={focused ? colors.pinkAccent : colors.textMuted} />
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{t.label}</Text>
        {pulseOn === t.label ? <Pulse /> : null}
      </View>
    );
  };

  return (
    <View style={styles.tabBar}>
      {LEFT_TABS.map(renderTab)}
      <View style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
        {/* לבן, לא ורוד — הכפתור עצמו ורוד והסימון היה נבלע בו */}
        {pulseFab ? <Pulse color={colors.white} /> : null}
      </View>
      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}

/** שורת תוכן גנרית — פס אפור שמרמז על טקסט בלי להמציא טקסט */
export function MiniRow({ width = '70%', tall }: { width?: number | string; tall?: boolean }) {
  return <View style={[styles.row, { width: width as never }, tall && styles.rowTall]} />;
}

export default function MiniScreen({
  title,
  children,
  activeTab,
  pulseOn,
  pulseFab,
  showTabBar = true,
}: {
  title?: string;
  children?: React.ReactNode;
  activeTab?: string;
  pulseOn?: string;
  pulseFab?: boolean;
  showTabBar?: boolean;
}) {
  return (
    <View style={styles.frame}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.headerText} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
      {showTabBar ? <MiniTabBar active={activeTab} pulseOn={pulseOn} pulseFab={pulseFab} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: MINI_WIDTH,
    height: MINI_HEIGHT,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  headerText: {
    fontSize: font.caption,
    fontWeight: font.weight.semibold,
    color: colors.text,
  },
  body: {
    flex: 1,
    padding: spacing.sm,
    gap: 6,
  },
  row: {
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.creamDark,
  },
  rowTall: {
    height: 26,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBar: {
    height: MINI_TABBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 2,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 1,
  },
  // לא StyleSheet.absoluteFillObject — הוא לא קיים בגרסת ה-RN של הפרויקט
  pulseHost: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 7,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.pinkAccent,
    fontWeight: font.weight.semibold,
  },
  fab: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  fabText: {
    color: colors.white,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: font.weight.bold,
  },
});
