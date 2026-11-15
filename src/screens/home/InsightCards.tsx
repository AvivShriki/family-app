import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c, t, r, space, shadow } from './theme';
import { Reveal, Press, useCountUp } from './motion';
import Ring from './Ring';
import MiniBars, { BarsAxis, Day } from './MiniBars';

/**
 * שני כרטיסי התובנה.
 *
 * שניהם נגזרים אך ורק מהרישומים שהמשפחה עצמה הזינה. אין כאן ציון
 * בריאות, אין הערכה רפואית ואין השוואה לנורמות — רק השוואה של
 * המשפחה לעצמה: כמה תועד היום לעומת הממוצע שלה, ואיך נראה החודש.
 *
 * כשאין מספיק היסטוריה להשוואה, הכרטיס אומר את זה במפורש במקום
 * להציג מספר חסר משמעות.
 */
interface Props {
  /** ארוחות היום */
  todayCount: number;
  /** ממוצע הארוחות ביום בשבוע האחרון, או null כשאין מספיק ימים */
  average: number | null;
  /** ימי החודש האחרון, לגרף */
  month: Day[];
  /** האם יש בכלל היסטוריה להציג בגרף */
  hasMonth: boolean;
  onPressSummary: () => void;
}

export default function InsightCards({
  todayCount,
  average,
  month,
  hasMonth,
  onPressSummary,
}: Props) {
  // יחס להיום מול הממוצע, חסום ב-100 אחוז כדי שהטבעת לא תקיף פעמיים
  const ratio = average && average > 0 ? Math.min(todayCount / average, 1) : 0;
  const animated = useCountUp(todayCount);

  return (
    <View style={styles.row}>
      {/* ---- מצב כללי ---- */}
      <Reveal delay={620} style={styles.half}>
        <View style={styles.card}>
          <Text style={t.cardTitle}>מצב כללי</Text>
          {average === null ? (
            <View style={styles.emptyBox}>
              <Ionicons name="hourglass-outline" size={22} color={c.textMuted} />
              <Text style={[t.caption, styles.center]}>עוד אין מספיק ימים להשוואה</Text>
            </View>
          ) : (
            <>
              <View style={styles.ringWrap}>
                <Ring progress={ratio} color={c.rose} track={c.roseSoft} size={84} width={9}>
                  <Text style={styles.ringValue}>{animated}</Text>
                  <Text style={t.caption}>ארוחות</Text>
                </Ring>
              </View>
              <Text style={[t.caption, styles.center]}>הממוצע שלכם {average} ליום</Text>
            </>
          )}
        </View>
      </Reveal>

      {/* ---- מבט חודשי ---- */}
      <Reveal delay={690} style={styles.half}>
        <Press
          onPress={onPressSummary}
          accessibilityRole="button"
          accessibilityLabel="מבט חודשי. פתיחת הסיכומים"
          to={0.985}
          style={{ flex: 1 }}
        >
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={t.cardTitle}>מבט חודשי</Text>
              <Ionicons name="chevron-back" size={15} color={c.textMuted} />
            </View>
            {hasMonth ? (
              <>
                <MiniBars data={month} color={c.lavenderDeep} height={56} />
                <BarsAxis from="לפני חודש" to="היום" />
              </>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="bar-chart-outline" size={22} color={c.textMuted} />
                <Text style={[t.caption, styles.center]}>הגרף ייבנה מהתיעוד שלכם</Text>
              </View>
            )}
          </View>
        </Press>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  // בטלפון צר שני הכרטיסים נערמים; ברחב הם יושבים זה לצד זה
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: space.md, marginBottom: space.xl },
  half: { flexGrow: 1, flexBasis: 200 },
  card: {
    flex: 1,
    backgroundColor: c.white,
    borderRadius: r.xxl,
    padding: space.lg,
    gap: space.md,
    minHeight: 168,
    ...shadow.card,
  },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  ringWrap: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  ringValue: { ...t.metric, fontSize: 22, lineHeight: 26 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  center: { textAlign: 'center' },
});
