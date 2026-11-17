import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, font, spacing } from '../../config/theme';
import MiniScreen, { MiniRow } from './MiniScreen';
import TouchPulse from './TouchPulse';

/**
 * ארבע השקופיות של ההדרכה.
 *
 * כל איור מצויר בקוד ומחקה את הצורה של המסך האמיתי — אותו סרגל
 * לשוניות, אותם סוגי רישום, אותם צבעים מהטוקנים. אין כאן צילומי
 * מסך ואין נתוני דמה של רישומים: רק פסים אפורים שמרמזים על תוכן.
 */

export type Slide = {
  key: string;
  title: string;
  body: string;
  render: () => React.ReactNode;
};

// סוגי הרישום, זהים ל-TYPES ב-AddLogModal
const LOG_TYPES = [
  { emoji: '🍼', label: 'ארוחה' },
  { emoji: '😴', label: 'שינה' },
  { emoji: '💩', label: 'חיתול' },
  { emoji: '📝', label: 'הערה' },
];

/** 1 — איפה הכפתור שמתעדים בו */
function SlideLog() {
  return (
    <MiniScreen title="היומן של ליבי" activeTab="יומן" pulseFab>
      <MiniRow width="55%" />
      <MiniRow tall />
      <MiniRow tall />
      <MiniRow width="40%" />
      <MiniRow tall />
    </MiniScreen>
  );
}

/** 2 — מה קורה אחרי הלחיצה: בחירת סוג, כמות ושעה */
function SlideChoose() {
  return (
    <MiniScreen title="רישום חדש" showTabBar={false}>
      <View style={styles.chipRow}>
        {LOG_TYPES.map((t, i) => (
          <View key={t.label} style={[styles.chip, i === 0 && styles.chipActive]}>
            <Text style={styles.chipEmoji}>{t.emoji}</Text>
            <Text style={[styles.chipLabel, i === 0 && styles.chipLabelActive]}>{t.label}</Text>
            {i === 0 ? (
              <View pointerEvents="none" style={styles.chipPulse}>
                <TouchPulse size={34} />
              </View>
            ) : null}
          </View>
        ))}
      </View>
      <View style={styles.fieldRow}>
        <Ionicons name="water-outline" size={12} color={colors.blueAccent} />
        <MiniRow width="55%" />
      </View>
      <View style={styles.fieldRow}>
        <Ionicons name="time-outline" size={12} color={colors.textLight} />
        <MiniRow width="40%" />
      </View>
      <View style={styles.saveBtn}>
        <Text style={styles.saveText}>שמירה</Text>
      </View>
    </MiniScreen>
  );
}

/** 3 — איפה רואים את היום, את החודש ואת הסיכום */
function SlideNavigate() {
  return (
    <MiniScreen title="החודש של ליבי" activeTab="חודש" pulseOn="סיכום">
      <View style={styles.grid}>
        {Array.from({ length: 21 }).map((_, i) => (
          <View key={i} style={[styles.gridCell, i % 5 === 2 && styles.gridCellMarked]} />
        ))}
      </View>
      <MiniRow width="50%" />
      <MiniRow tall />
    </MiniScreen>
  );
}

/** 4 — שני הורים, אותה תינוקת */
function SlideFamily() {
  return (
    <MiniScreen title="המשפחה שלנו" activeTab="הגדרות" pulseOn="הגדרות">
      <View style={styles.avatars}>
        <View style={[styles.avatar, { backgroundColor: colors.pink }]}>
          <Ionicons name="person" size={14} color={colors.pinkAccent} />
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.blue }]}>
          <Ionicons name="person" size={14} color={colors.blueAccent} />
        </View>
      </View>
      <View style={styles.bubbleRight}>
        <MiniRow width="80%" />
      </View>
      <View style={styles.bubbleLeft}>
        <MiniRow width="60%" />
      </View>
      <View style={styles.inviteBtn}>
        <Ionicons name="person-add-outline" size={11} color={colors.white} />
        <Text style={styles.saveText}>הוספת בן משפחה</Text>
      </View>
    </MiniScreen>
  );
}

export const SLIDES: Slide[] = [
  {
    key: 'log',
    title: 'כל תיעוד מתחיל בכפתור אחד',
    body: 'הכפתור הוורוד באמצע הסרגל התחתון פותח רישום חדש — מכל מסך, בכל רגע.',
    render: () => <SlideLog />,
  },
  {
    key: 'choose',
    title: 'בוחרים מה קרה',
    body: 'ארוחה, שינה, חיתול או הערה. אחר כך כמות ושעה — והשעה כבר ממולאת לעכשיו.',
    render: () => <SlideChoose />,
  },
  {
    key: 'navigate',
    title: 'רואים את התמונה המלאה',
    body: '"יומן" הוא היום הנוכחי, "חודש" מראה את כל החודש, ו"סיכום" אוסף את המגמות.',
    render: () => <SlideNavigate />,
  },
  {
    key: 'family',
    title: 'וכל המשפחה באותו מקום',
    body: 'מההגדרות אפשר לצרף בן משפחה, ואז שניכם מתעדים לאותו יומן ומשאירים הודעות.',
    render: () => <SlideFamily />,
  },
];

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.pinkAccent,
    backgroundColor: colors.pink,
  },
  chipPulse: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipEmoji: { fontSize: 13 },
  chipLabel: { fontSize: 7, color: colors.textMuted },
  chipLabelActive: { color: colors.text, fontWeight: font.weight.semibold },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  saveBtn: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.pinkAccent,
    borderRadius: radius.full,
    paddingVertical: 7,
  },
  saveText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: font.weight.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
  },
  gridCell: {
    width: 20,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridCellMarked: {
    backgroundColor: colors.pink,
    borderColor: colors.pinkDark,
  },
  avatars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 6,
    width: '80%',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pink,
    borderRadius: radius.sm,
    padding: 6,
    width: '65%',
  },
  inviteBtn: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.pinkAccent,
    borderRadius: radius.full,
    paddingVertical: 7,
  },
});
