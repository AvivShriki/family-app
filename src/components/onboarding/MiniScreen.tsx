import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, font, spacing } from '../../config/theme';
import TouchPulse from './TouchPulse';

/**
 * ייצוג של מסך האפליקציה, מצויר בקוד.
 *
 * בכוונה לא צילום מסך: צילום מתיישן בשקט בכל שינוי עיצוב, וגם מחייב
 * לחשוף רישומים אמיתיים של התינוקת. התוכן כאן הוא דוגמה להמחשה —
 * שעות ומינונים סבירים שממחישים איך נראה רישום, ולא נתון של אף אחד.
 *
 * הגרסה הראשונה הציגה פסים אפורים במקום תוכן. היא הייתה "נקייה" אבל
 * לא הסבירה כלום: אי אפשר היה להבין מהאיור מה האפליקציה עושה.
 */

const MINI_WIDTH = 278;
const MINI_HEIGHT = 300;
const MINI_TABBAR_HEIGHT = 52;

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
      <TouchPulse size={38} color={color} />
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
        <Ionicons name={t.icon} size={17} color={focused ? colors.pinkAccent : colors.textMuted} />
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

/**
 * שורת רישום לדוגמה.
 *
 * אותו מבנה כמו במסך האמיתי: עיגול פסטל עם אייקון בימין, שם הרישום
 * והפירוט לידו, והשעה בשמאל. האימוג'י שמור לשבבי בחירת הסוג, שבהם
 * הוא באמת מופיע באפליקציה.
 */
export function MiniLogRow({
  icon,
  tint,
  label,
  meta,
  time,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  meta?: string;
  time: string;
}) {
  return (
    <View style={styles.logRow}>
      <View style={[styles.logBadge, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={15} color={colors.text} />
      </View>
      <View style={styles.logTexts}>
        <Text style={styles.logLabel}>{label}</Text>
        {meta ? <Text style={styles.logMeta}>{meta}</Text> : null}
      </View>
      <Text style={styles.logTime}>{time}</Text>
    </View>
  );
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
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: font.weight.semibold,
    color: colors.text,
  },
  body: {
    flex: 1,
    padding: 10,
    gap: 7,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  logBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTexts: { flex: 1 },
  logLabel: {
    fontSize: 12,
    fontWeight: font.weight.semibold,
    color: colors.text,
  },
  logMeta: {
    fontSize: 10,
    color: colors.textLight,
  },
  logTime: {
    fontSize: 11,
    fontWeight: font.weight.semibold,
    color: colors.textLight,
  },
  tabBar: {
    height: MINI_TABBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 3,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 2,
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
    fontSize: 9,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.pinkAccent,
    fontWeight: font.weight.semibold,
  },
  fab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  fabText: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: font.weight.bold,
  },
});
