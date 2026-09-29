import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHousehold } from '../context/HouseholdContext';
import Button from './Button';
import {
  LEGACY_HOUSEHOLD_ID,
  countLegacyDocs,
  migrateLegacyData,
} from '../utils/migrateLegacyData';
import { colors, spacing, radius } from '../config/theme';

/**
 * כרטיס זמני שמעביר את הנתונים מהמבנה הישן אל משק הבית.
 * מופיע רק אם יש בפועל נתונים ישנים להעביר, ונעלם ברגע שאין.
 * למחיקה יחד עם utils/migrateLegacyData אחרי שההעברה אומתה.
 */
export default function MigrationCard() {
  const { householdId } = useHousehold();
  const [pending, setPending] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (householdId !== LEGACY_HOUSEHOLD_ID) return;
    let cancelled = false;
    // כשל כאן הוא המצב התקין אחרי ההעברה (החוקים כבר חוסמים את הישן) — מתעלמים
    countLegacyDocs()
      .then((n) => !cancelled && setPending(n))
      .catch(() => !cancelled && setPending(0));
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  if (householdId !== LEGACY_HOUSEHOLD_ID || pending === 0) return null;

  const run = async () => {
    setRunning(true);
    setError(false);
    try {
      const r = await migrateLegacyData(householdId);
      setDone(`הועברו ${r.events} אירועים, ${r.shoppingList} פריטי קנייה, ${r.babyLogs} רישומים` +
        (r.profile ? ' ופרופיל התינוקת' : ''));
      setPending(0);
    } catch {
      setError(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>העברת הנתונים למבנה החדש 📦</Text>
      {done ? (
        <Text style={styles.body}>{done}</Text>
      ) : (
        <>
          <Text style={styles.body}>
            נמצאו {pending} פריטים במבנה הישן. לחיצה תעתיק אותם לתא המשפחתי שלכם.
            שום דבר לא נמחק בדרך.
          </Text>
          {error ? <Text style={styles.error}>ההעברה נכשלה. אפשר לנסות שוב.</Text> : null}
          <Button
            label="העברה עכשיו"
            onPress={run}
            loading={running}
            style={{ marginTop: spacing.sm }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.pinkAccent,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  body: { fontSize: 14, color: colors.textLight, lineHeight: 20 },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.xs },
});
