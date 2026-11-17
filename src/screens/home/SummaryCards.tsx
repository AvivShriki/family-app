import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { c, t, r, space, shadow } from './theme';
import { Reveal, Press, useCountUp } from './motion';
import SoftIcon from './SoftIcon';
import { MCIcon } from './activity';

/**
 * שלושת מוני היום.
 *
 * המספר הוא הגיבור בכרטיס, והוא נספר כלפי מעלה בטעינה — מה שגם
 * מושך את העין לנתון וגם הופך עדכון חי (רישום שנכנס מהטלפון השני)
 * למשהו שרואים קורה, במקום מספר שמחליף את עצמו בשקט.
 *
 * הערכים מגיעים מהרישומים האמיתיים; אין כאן שום ערך קבוע.
 */
interface CardDef {
  key: string;
  icon: MCIcon;
  tint: string;
  surface: string;
  /** המספר להנפשה */
  value: number;
  /** מה שמוצג בפועל, כשהערך אינו מספר פשוט (למשל "שעתיים ו-40 דקות") */
  display?: (animated: number) => string;
  /**
   * 'text' לערך שהוא משפט ולא מספר.
   *
   * גופן המונה הוא 24 ומיועד לספרה אחת או שתיים. משך בזמן במילים
   * מלאות ארוך בהרבה, ובגודל הזה הוא נחתך בשורה אחת — ולכן מוצג
   * קטן יותר ועל שתי שורות.
   */
  valueStyle?: 'metric' | 'text';
  suffix?: string;
  label: string;
  onPress: () => void;
}

function Card({ def, delay }: { def: CardDef; delay: number }) {
  const animated = useCountUp(def.value);
  const shown = def.display ? def.display(animated) : String(animated);

  return (
    <Reveal delay={delay} style={styles.cardOuter}>
      <Press
        onPress={def.onPress}
        accessibilityRole="button"
        accessibilityLabel={`${def.label}: ${def.display ? def.display(def.value) : def.value}${def.suffix ? ' ' + def.suffix : ''}. פתיחת היומן`}
        style={{ flex: 1 }}
      >
        <View style={styles.card}>
          <SoftIcon icon={def.icon} tint={def.tint} surface={def.surface} size={40} />
          <View style={styles.valueRow}>
            <Text style={def.valueStyle === 'text' ? styles.valueText : t.metric} numberOfLines={2}>
              {shown}
            </Text>
            {def.suffix ? <Text style={styles.suffix}>{def.suffix}</Text> : null}
          </View>
          <Text style={[t.caption, styles.label]} numberOfLines={1}>
            {def.label}
          </Text>
        </View>
      </Press>
    </Reveal>
  );
}

export default function SummaryCards({ cards }: { cards: CardDef[] }) {
  return (
    <View style={styles.row}>
      {cards.map((def, i) => (
        <Card key={def.key} def={def} delay={120 + i * 70} />
      ))}
    </View>
  );
}

export type { CardDef };

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: space.md, marginBottom: space.xl },
  cardOuter: { flex: 1 },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: c.white,
    borderRadius: r.xl,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    ...shadow.card,
  },
  valueRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 2, flexShrink: 1 },
  // 17 ולא 24: נמדד מול הפונט האמיתי ברוחב הפנימי (90px). המקרה
  // הגרוע, "14 שעות ו-20 דקות", יוצא 145px — שתי שורות נוחות, והמילה
  // הארוכה ביותר 60px. ב-24 זה היה נחתך.
  valueText: { ...t.metric, fontSize: 17, lineHeight: 21, letterSpacing: 0 },
  suffix: { ...t.caption, color: c.textSoft, fontWeight: '700' },
  label: { textAlign: 'center' },
});
