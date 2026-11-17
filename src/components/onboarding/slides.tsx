import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, font } from '../../config/theme';
import MiniScreen, { MiniLogRow } from './MiniScreen';
import TouchPulse from './TouchPulse';

/**
 * ארבע השקופיות של ההדרכה.
 *
 * כל איור מצויר בקוד ומחקה את הצורה של המסך האמיתי — אותו סרגל
 * לשוניות, אותם סוגי רישום, אותם צבעים מהטוקנים.
 *
 * התוכן הוא דוגמה להמחשה: שעות ומינונים סבירים שמראים איך נראה
 * רישום בפועל. זה לא נתון של אף משפחה, והוא לא מוצג בשום מקום מחוץ
 * להדרכה. גרסה קודמת הציגה פסים אפורים במקום טקסט, ואי אפשר היה
 * להבין ממנה מה האפליקציה בכלל עושה.
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

/** 1 — איפה הכפתור שמתעדים בו, ואיך נראה יומן מלא */
function SlideLog() {
  return (
    <MiniScreen title="היומן · היום" activeTab="יומן" pulseFab>
      <MiniLogRow
        icon="cafe-outline"
        tint={colors.pink}
        label="האכלה"
        meta="180 מ״ל"
        time="11:00"
      />
      <MiniLogRow
        icon="moon-outline"
        tint={colors.blue}
        label="שינה"
        meta="1ש׳ 15ד׳"
        time="09:15"
      />
      <MiniLogRow icon="body-outline" tint={colors.success} label="חיתול" meta="קקי" time="08:40" />
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
                <TouchPulse size={46} />
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.field}>
        <Ionicons name="water-outline" size={14} color={colors.blueAccent} />
        <Text style={styles.fieldLabel}>כמות</Text>
        <Text style={styles.fieldValue}>180 מ״ל</Text>
      </View>
      <View style={styles.field}>
        <Ionicons name="time-outline" size={14} color={colors.textLight} />
        <Text style={styles.fieldLabel}>שעה</Text>
        <Text style={styles.fieldValue}>11:00</Text>
      </View>

      <View style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>שמירה</Text>
      </View>
    </MiniScreen>
  );
}

/** 3 — איפה רואים את החודש ואת הסיכום */
function SlideNavigate() {
  // נקודות על ימים שתועדו בהם רישומים — כמו במסך החודשי
  const marked = new Set([2, 3, 5, 8, 9, 12, 15, 16, 17, 20, 22, 23, 26, 27]);
  return (
    <MiniScreen title="החודש" activeTab="חודש" pulseOn="סיכום">
      <View style={styles.grid}>
        {/* 28 = ארבע שורות שלמות של שבעה. מספר אחר משאיר שורה קטועה
            שנראית כמו תקלה ולא כמו לוח שנה. */}
        {Array.from({ length: 28 }).map((_, i) => {
          const day = i + 1;
          const on = marked.has(day);
          return (
            <View key={day} style={[styles.gridCell, on && styles.gridCellOn]}>
              <Text style={[styles.gridDay, on && styles.gridDayOn]}>{day}</Text>
              {on ? <View style={styles.gridDot} /> : null}
            </View>
          );
        })}
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statValue}>6</Text>
        <Text style={styles.statLabel}>ארוחות ביום בממוצע</Text>
      </View>
    </MiniScreen>
  );
}

/** 4 — שני הורים, אותו יומן */
function SlideFamily() {
  return (
    <MiniScreen title="הודעות למשפחה" activeTab="הגדרות" pulseOn="הגדרות">
      <View style={styles.bubbleRight}>
        <Text style={styles.bubbleName}>אמא</Text>
        <Text style={styles.bubbleText}>אכלה טוב והלכה לישון 💤</Text>
      </View>
      <View style={styles.bubbleLeft}>
        <Text style={styles.bubbleText}>מעולה, אני מתעד את זה</Text>
      </View>

      <View style={styles.primaryBtn}>
        <Ionicons name="person-add-outline" size={13} color={colors.white} />
        <Text style={styles.primaryBtnText}>הוספת בן משפחה</Text>
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
    body: '"חודש" מראה באילו ימים תועד משהו, ו"סיכום" הופך את זה לממוצעים ומגמות.',
    render: () => <SlideNavigate />,
  },
  {
    key: 'family',
    title: 'וכל המשפחה באותו מקום',
    body: 'מההגדרות מצרפים בן משפחה, ואז שניכם מתעדים לאותו יומן ומשאירים הודעות.',
    render: () => <SlideFamily />,
  },
];

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
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
  chipEmoji: { fontSize: 18 },
  chipLabel: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  chipLabelActive: { color: colors.text, fontWeight: font.weight.semibold },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  fieldLabel: { fontSize: 11, color: colors.textLight, flex: 1 },
  fieldValue: { fontSize: 12, fontWeight: font.weight.semibold, color: colors.text },
  primaryBtn: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.pinkAccent,
    borderRadius: radius.full,
    paddingVertical: 9,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: font.weight.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  gridCell: {
    width: 30,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellOn: {
    backgroundColor: colors.pink,
    borderColor: colors.pinkDark,
  },
  gridDay: { fontSize: 10, color: colors.textMuted },
  gridDayOn: { color: colors.text, fontWeight: font.weight.semibold },
  gridDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pinkAccent,
    marginTop: 1,
  },
  statRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 17,
    fontWeight: font.weight.bold,
    color: colors.pinkAccent,
  },
  statLabel: { fontSize: 11, color: colors.textLight },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: '85%',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pink,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: '80%',
  },
  bubbleName: {
    fontSize: 9,
    color: colors.pinkAccent,
    fontWeight: font.weight.semibold,
    marginBottom: 1,
  },
  bubbleText: { fontSize: 11, color: colors.text, lineHeight: 16 },
});
