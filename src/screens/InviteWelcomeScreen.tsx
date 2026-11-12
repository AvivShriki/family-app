import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { previewInvite, InvitePreview } from '../services/familySetup';
import { colors, spacing, radius, type, TOUCH, CONTENT_MAX } from '../config/theme';

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

  if (!preview) return <Loader text="בודקים את ההזמנה" />;

  if (preview.status !== 'ok') {
    const message = {
      'not-found': 'הקישור הזה לא נמצא. ייתכן שהוא הועתק חלקית.',
      used: 'כבר השתמשו בקישור הזה. הוא נועד לאדם אחד בלבד.',
      expired: 'הקישור פג. הוא תקף לשבוע מרגע שנוצר.',
    }[preview.status]!;

    return (
      <View style={styles.centered}>
        <View style={styles.mark}>
          <Ionicons name="link-outline" size={32} color={colors.terracottaDeep} />
        </View>
        <Text style={[type.h2, styles.center]}>הקישור כבר לא פעיל</Text>
        <Card style={styles.card}>
          <Text style={[type.body, styles.center]}>{message}</Text>
          <Text style={[type.body, styles.center, { marginTop: spacing.sm }]}>
            בקשו מבן המשפחה שהזמין אתכם ליצור קישור חדש — זה לוקח לו שנייה.
          </Text>
        </Card>
        <Button
          label="למסך הכניסה"
          variant="secondary"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        />
      </View>
    );
  }

  const family = preview.familyName ? `משפחת ${preview.familyName}` : 'המשפחה';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ---- הפתיח: לאן הוזמנת, בשם המשפחה שהזמינה ---- */}
      <View style={styles.hero}>
        <View style={styles.heroMark}>
          <MaterialCommunityIcons name="baby-face-outline" size={32} color={colors.white} />
        </View>
        <Text style={[type.caption, styles.heroEyebrow]}>הוזמנתם להצטרף</Text>
        <Text style={styles.heroTitle}>ברוכים הבאים ל{family}</Text>
        <Text style={styles.heroLead}>
          תיעוד משותף של התינוק או התינוקת — ארוחות, שינה, חיתולים ותרופות.
        </Text>
      </View>

      <Card style={styles.list}>
        <Row icon="notebook-outline" text={`תראו את כל התיעוד של ${family}`} />
        <Row icon="pencil-outline" text="תוכלו לתעד בעצמכם, וכל מי שבמשפחה יראה את זה מיד" />
        <Row icon="lock-outline" text="רק מי שבמשפחה רואה את הנתונים. אף משפחה אחרת לא." />
      </Card>

      <Text style={[type.body, styles.cta]}>
        כדי להצטרף צריך לפתוח חשבון — זה לוקח חצי דקה, ואין צורך בקוד: הוא כבר שמור בקישור שלחצתם
        עליו.
      </Text>

      <Button label="הרשמה והצטרפות" onPress={() => navigation.navigate('SignUp', { code })} />

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.linkBtn}
        accessibilityRole="button"
      >
        <Text style={styles.link}>כבר יש לכם חשבון? לכניסה</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={icon} size={19} color={colors.sage} />
      </View>
      <Text style={[type.body, styles.rowText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },

  hero: {
    backgroundColor: colors.sage,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  heroTitle: { ...type.h1, color: colors.white, textAlign: 'center', marginTop: 2 },
  heroLead: {
    ...type.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  list: { gap: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, color: colors.text, paddingTop: spacing.xs },

  cta: { textAlign: 'center', marginBottom: spacing.md },
  centered: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  card: { marginTop: spacing.md, alignSelf: 'stretch', maxWidth: 420 },
  button: { marginTop: spacing.lg, alignSelf: 'stretch', maxWidth: 420 },
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', marginTop: spacing.sm },
  link: { ...type.smallStrong, color: colors.sage, textAlign: 'center' },
});
