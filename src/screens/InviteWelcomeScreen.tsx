import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { previewInvite, InvitePreview } from '../services/familySetup';
import { colors, spacing, radius, font, shadow } from '../config/theme';

/**
 * המסך הראשון שרואה מי שלוחץ על קישור הזמנה.
 *
 * הוא מגיע מוואטסאפ בלי להבין לאן, ולכן אסור לפתוח לו טופס אימייל
 * וסיסמה: קודם אומרים לו לאיזו משפחה הוזמן, מה הוא עומד לראות, ושכדי
 * להצטרף צריך לפתוח חשבון. רק אחר כך מבקשים ממנו פרטים.
 */
export default function InviteWelcomeScreen({ navigation, route }: any) {
  const code: string = route?.params?.code ?? '';
  const [preview, setPreview] = useState<InvitePreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    previewInvite(code)
      .then((p) => !cancelled && setPreview(p))
      .catch(() => !cancelled && setPreview({ familyName: '', status: 'not-found' }));
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!preview) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.pinkAccent} size="large" />
      </View>
    );
  }

  if (preview.status !== 'ok') {
    const message = {
      'not-found': 'הקישור הזה לא נמצא. ייתכן שהוא הועתק חלקית.',
      used: 'כבר השתמשו בקישור הזה. הוא נועד לאדם אחד בלבד.',
      expired: 'הקישור פג. הוא תקף לשבוע מרגע שנוצר.',
    }[preview.status]!;

    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.title}>הקישור כבר לא פעיל</Text>
        <Text style={styles.body}>{message}</Text>
        <Text style={styles.body}>
          בקשו מבן המשפחה שהזמין אתכם ליצור קישור חדש — זה לוקח לו שנייה.
        </Text>
        <Button
          label="למסך הכניסה"
          onPress={() => navigation.navigate('Login')}
          variant="secondary"
          style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
        />
      </View>
    );
  }

  const family = preview.familyName ? `משפחת ${preview.familyName}` : 'המשפחה';

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.emoji}>🌸</Text>
        <Text style={styles.title}>ברוכים הבאים ל{family}</Text>
        <Text style={styles.lead}>הוזמנתם להצטרף לתיעוד המשותף של {family}.</Text>

        <View style={styles.card}>
          <Row icon="book-outline" text="תראו את התיעוד של התינוק או התינוקת — ארוחות, שינה וחיתולים" />
          <Row icon="create-outline" text="תוכלו לתעד בעצמכם, וכל מי שבמשפחה יראה את זה מיד" />
          <Row icon="lock-closed-outline" text="רק מי שבמשפחה רואה את הנתונים. אף משפחה אחרת לא." />
        </View>

        <Text style={styles.cta}>
          כדי להצטרף צריך לפתוח חשבון — זה לוקח חצי דקה, ואין צורך בקוד:
          הוא כבר שמור בקישור שלחצתם עליו.
        </Text>

        <Button
          label="הרשמה והצטרפות"
          onPress={() => navigation.navigate('SignUp', { code })}
          style={{ alignSelf: 'stretch' }}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={styles.link}>כבר יש לכם חשבון? לכניסה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.pinkAccent} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  centered: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: { fontSize: 52, textAlign: 'center', marginBottom: spacing.sm },
  title: {
    fontSize: font.titleLg,
    fontWeight: font.weight.heavy,
    color: colors.text,
    textAlign: 'center',
  },
  lead: {
    fontSize: font.bodyLg,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 23,
  },
  body: {
    fontSize: font.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  rowText: { flex: 1, fontSize: font.body, color: colors.text, textAlign: 'right', lineHeight: 21 },
  cta: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  link: {
    fontSize: font.small,
    color: colors.blueAccent,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
