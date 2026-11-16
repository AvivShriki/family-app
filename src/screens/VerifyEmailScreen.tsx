import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { colors, spacing, radius, font, shadow } from '../config/theme';

/**
 * מסך אישור הכתובת.
 *
 * נפתח למי שמחובר אך טרם אימת את המייל, וחוסם את הכניסה לאפליקציה.
 * החסימה הזו היא חוויית משתמש ולא אבטחה — מי שיודע לשלוח בקשה ישירות
 * עוקף מסך. האכיפה האמיתית יושבת בחוקי Firestore, והיא נדלקת בנפרד.
 *
 * שני כפתורים, כי שתי התקלות הנפוצות שונות: מייל שלא הגיע דורש שליחה
 * מחדש, ומייל שכבר אושר דורש רענון — Firebase לא מעדכן את מצב האימות
 * מעצמו, והמשתמש היה נתקע במסך הזה גם אחרי שלחץ על הקישור.
 */
const RESEND_COOLDOWN = 45;

export default function VerifyEmailScreen() {
  const { user, resendVerification, refreshVerification, logout } = useAuth();
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [stillNot, setStillNot] = useState(false);

  // ספירה לאחור, כדי שלחיצות חוזרות לא יציפו את תיבת הדואר
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const onResend = async () => {
    setError('');
    setStillNot(false);
    try {
      await resendVerification();
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError('שליחת המייל נכשלה. בדקו את החיבור ונסו שוב.');
    }
  };

  const onCheck = async () => {
    setError('');
    setStillNot(false);
    setChecking(true);
    try {
      const ok = await refreshVerification();
      // כשהאימות עבר, ההקשר מתעדכן והמסך הזה פשוט נעלם
      if (!ok) setStillNot(true);
    } catch {
      setError('הבדיקה נכשלה. בדקו את החיבור ונסו שוב.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.badge}>
        <Ionicons name="mail-unread-outline" size={34} color={colors.pinkAccent} />
      </View>

      <Text style={styles.title}>נשאר לאשר את הכתובת</Text>
      <Text style={styles.lead}>שלחנו מייל עם קישור אישור אל</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.card}>
        <Text style={styles.body}>
          פתחו את המייל ולחצו על הקישור, וחזרו לכאן. אם הוא לא הגיע תוך דקה, כדאי להציץ בתיקיית
          הספאם.
        </Text>

        {sent ? (
          <View style={styles.notice}>
            <Ionicons name="checkmark-circle" size={17} color={colors.success} />
            <Text style={styles.noticeText}>המייל נשלח</Text>
          </View>
        ) : null}

        {stillNot ? (
          <View style={[styles.notice, styles.noticeWarn]}>
            <Ionicons name="time-outline" size={17} color={colors.danger} />
            <Text style={[styles.noticeText, { color: colors.danger }]}>
              עדיין לא רואים אישור. אם זה עתה לחצתם על הקישור, נסו שוב בעוד רגע.
            </Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="כבר אישרתי, המשך" onPress={onCheck} loading={checking} />

        <Button
          label={cooldown > 0 ? `שליחה חוזרת בעוד ${cooldown}` : 'שליחת המייל שוב'}
          variant="secondary"
          onPress={onResend}
          disabled={cooldown > 0}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <TouchableOpacity onPress={logout} hitSlop={8} accessibilityRole="button">
        <Text style={styles.logout}>יציאה וכניסה עם חשבון אחר</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: font.titleLg,
    fontWeight: font.weight.heavy,
    color: colors.text,
    textAlign: 'center',
  },
  lead: {
    fontSize: font.body,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  email: {
    fontSize: font.bodyLg,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  body: {
    fontSize: font.body,
    color: colors.textLight,
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  notice: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  noticeWarn: { backgroundColor: '#FBECEA' },
  noticeText: {
    flex: 1,
    fontSize: font.small,
    fontWeight: font.weight.semibold,
    color: colors.success,
    textAlign: 'right',
    lineHeight: 19,
  },
  error: {
    fontSize: font.small,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  logout: {
    fontSize: font.small,
    color: colors.blueAccent,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
