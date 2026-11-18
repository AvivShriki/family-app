import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font, shadow } from '../../config/theme';

/**
 * טיימר הנקה, צד ימין וצד שמאל.
 *
 * שלוש החלטות שמגיעות מהשימוש ולא מהקוד:
 *
 * 1. רק צד אחד רץ בכל רגע. לחיצה על הצד השני מעבירה אליו ועוצרת את
 *    הראשון — אי אפשר להניק משני הצדדים בו זמנית, ואמא עייפה לא
 *    צריכה לזכור לעצור לפני שהיא מתחילה.
 *
 * 2. המשך נמדד מהפרש חותמות זמן ולא מספירת טיקים. setInterval נעצר
 *    כשהדפדפן ממוזער או המסך נעול — בדיוק מה שקורה באמצע הנקה.
 *
 * 3. "עכשיו" מוחזק ב-state ולא נקרא מ-Date.now() בזמן הרינדור.
 *    קריאה כזו הופכת את הרינדור ללא-טהור: אותו state היה מייצר פלט
 *    אחר בכל ציור, ו-React לא יכול להסתמך על זה.
 */

type Side = 'left' | 'right';

export interface BreastfeedingResult {
  leftMs: number;
  rightMs: number;
  /** מתי ההנקה התחילה בפועל */
  startedAt: number;
}

interface Running {
  side: Side;
  startedAt: number;
}

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** מוגדר מחוץ לקומפוננטה: הגדרה בפנים יוצרת טיפוס חדש בכל ציור */
function SideButton({
  label,
  ms,
  active,
  onPress,
}: {
  label: string;
  ms: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.side, ms > 0 && !active && styles.sideUsed, active && styles.sideActive]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${active ? 'עצירה' : 'התחלה'}`}
    >
      <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>{label}</Text>
      <Text style={[styles.sideTime, active && styles.sideTimeActive]}>{fmt(ms)}</Text>
      <View style={styles.sideAction}>
        <Ionicons
          name={active ? 'pause' : 'play'}
          size={14}
          color={active ? colors.white : colors.pinkAccent}
        />
        <Text style={[styles.sideActionText, active && styles.sideActionTextActive]}>
          {active ? 'עצירה' : ms > 0 ? 'המשך' : 'התחלה'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * ההורה מרכיב את הרכיב רק כשהוא פתוח, ולכן כל פתיחה מתחילה ממצב נקי
 * בלי אתחול בתוך effect.
 */
export default function BreastfeedingTimer({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (result: BreastfeedingResult) => void;
}) {
  const [banked, setBanked] = useState<Record<Side, number>>({ left: 0, right: 0 });
  const [running, setRunning] = useState<Running | null>(null);
  const [sessionStart, setSessionStart] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    // חזרה מרקע: המשך מחושב נכון בלי קשר, אבל המסך צריך להתעדכן מיד
    const sub = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [running]);

  const elapsed = (side: Side) =>
    banked[side] + (running?.side === side ? Math.max(0, now - running.startedAt) : 0);

  const press = (side: Side) => {
    const stamp = Date.now();
    setNow(stamp);
    if (running) {
      const add = Math.max(0, stamp - running.startedAt);
      setBanked((b) => ({ ...b, [running.side]: b[running.side] + add }));
      // לחיצה על הצד שרץ עוצרת; על הצד השני מעבירה אליו
      if (running.side === side) {
        setRunning(null);
        return;
      }
    }
    if (!sessionStart) setSessionStart(stamp);
    setRunning({ side, startedAt: stamp });
  };

  const finish = () => {
    const stamp = Date.now();
    const extra = running ? Math.max(0, stamp - running.startedAt) : 0;
    onSave({
      leftMs: banked.left + (running?.side === 'left' ? extra : 0),
      rightMs: banked.right + (running?.side === 'right' ? extra : 0),
      startedAt: sessionStart || stamp,
    });
  };

  const left = elapsed('left');
  const right = elapsed('right');
  const nothingYet = left + right === 0;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>הנקה</Text>
          <Text style={styles.subtitle}>
            {running ? 'הטיימר רץ — אפשר לעצור ולהמשיך בכל רגע' : 'בחרו צד כדי להתחיל'}
          </Text>

          {/* row-reverse ולא החלפת סדר: ימין נשאר ראשון בקוד ומופיע
              בימין המסך. הנחתי קודם ש-RTL יהפוך את השורה לבד — הוא לא,
              והצדדים הוצגו הפוך ממה שהם באמת. */}
          <View style={styles.sides}>
            <SideButton
              label="ימין"
              ms={right}
              active={running?.side === 'right'}
              onPress={() => press('right')}
            />
            <SideButton
              label="שמאל"
              ms={left}
              active={running?.side === 'left'}
              onPress={() => press('left')}
            />
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>סך הכול</Text>
            <Text style={styles.totalValue}>{fmt(left + right)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.finish, nothingYet && styles.finishOff]}
            onPress={finish}
            disabled={nothingYet}
            accessibilityRole="button"
          >
            <Text style={styles.finishText}>סיום ושמירה</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} style={styles.cancel} accessibilityRole="button">
            <Text style={styles.cancelText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(74,55,40,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    ...shadow.soft,
  },
  title: {
    fontSize: font.titleLg,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  sides: { flexDirection: 'row-reverse', gap: spacing.md },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },
  sideUsed: { borderColor: colors.pinkDark },
  sideActive: { backgroundColor: colors.pinkAccent, borderColor: colors.pinkAccent },
  sideLabel: { fontSize: font.title, fontWeight: font.weight.bold, color: colors.text },
  sideLabelActive: { color: colors.white },
  sideTime: {
    fontSize: 30,
    fontWeight: font.weight.heavy,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  sideTimeActive: { color: colors.white },
  sideAction: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sideActionText: {
    fontSize: font.small,
    fontWeight: font.weight.semibold,
    color: colors.pinkAccent,
  },
  sideActionTextActive: { color: colors.white },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  totalLabel: { fontSize: font.body, color: colors.textLight },
  totalValue: {
    fontSize: font.title,
    fontWeight: font.weight.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  finish: {
    marginTop: spacing.lg,
    backgroundColor: colors.pinkAccent,
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: 'center',
  },
  finishOff: { opacity: 0.4 },
  finishText: { color: colors.white, fontSize: font.bodyLg, fontWeight: font.weight.semibold },
  cancel: { paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  cancelText: { fontSize: font.small, color: colors.textLight },
});
