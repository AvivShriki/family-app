import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { c, t, r, space } from './theme';
import { Reveal } from './motion';
import SoftIcon from './SoftIcon';
import { MCIcon } from './activity';

/**
 * שני השירותים שעוד לא נפתחו.
 *
 * הם מוצגים ככרטיסים מלאים ולא כשורת טקסט, כי זה מה שהם יהיו —
 * אבל הם לא כפתורים: אין להם onPress, הם מסומנים כמושבתים לקורא
 * מסך, ויש עליהם תווית "בקרוב". כפתור שנראה חי ולא עושה כלום הוא
 * הדבר שגורם למשתמש לחשוב שהאפליקציה תקועה.
 */
const ITEMS: {
  key: string;
  icon: MCIcon;
  title: string;
  sub: string;
  tint: string;
  surface: string;
}[] = [
  {
    key: 'ai',
    icon: 'robot-happy-outline',
    title: 'שאל AI',
    sub: 'שאלה על השגרה של התינוקת',
    tint: c.lavenderDeep,
    surface: c.lavender,
  },
  {
    key: 'doctor',
    icon: 'stethoscope',
    title: 'שאלה לרופא',
    sub: 'התייעצות עם איש מקצוע',
    tint: c.blueDeep,
    surface: c.blue,
  },
];

export default function ComingSoon({ delay = 0 }: { delay?: number }) {
  return (
    <View style={styles.row}>
      {ITEMS.map((it, i) => (
        <Reveal key={it.key} delay={delay + i * 70} style={styles.half}>
          <View
            style={styles.card}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel={`${it.title} — בקרוב, עדיין לא זמין`}
          >
            <View style={styles.head}>
              <SoftIcon icon={it.icon} tint={it.tint} surface={it.surface} size={40} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>בקרוב</Text>
              </View>
            </View>
            <Text style={t.cardTitle} numberOfLines={1}>
              {it.title}
            </Text>
            <Text style={t.caption} numberOfLines={2}>
              {it.sub}
            </Text>
          </View>
        </Reveal>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // בטלפון צר שני הכרטיסים נערמים; ברחב הם יושבים זה לצד זה
  row: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: space.md, marginBottom: space.xl },
  half: { flexGrow: 1, flexBasis: 150 },
  card: {
    flex: 1,
    // גבול מקווקו ולא משטח מלא: הכרטיס נקרא כמקום שמור ולא כפעולה
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: c.border,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: r.xxl,
    padding: space.lg,
    gap: space.sm,
    minHeight: 132,
  },
  head: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    backgroundColor: c.bgDeep,
    borderRadius: r.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  badgeText: { ...t.caption, color: c.textSoft, fontWeight: '700' },
});
