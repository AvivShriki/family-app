import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { colors, spacing, radius, font, shadow } from '../config/theme';

// המינימום ש-Firebase מקבל. בדיקה מקומית חוסכת סיבוב לשרת ונותנת
// הודעה בעברית במקום קוד שגיאה.
const MIN_LENGTH = 6;

// קודי השגיאה של Firebase מגיעים באנגלית — מתרגמים למה שבאמת קרה
function errorText(code: string) {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'הסיסמה הנוכחית שגויה';
    case 'auth/weak-password':
      return `הסיסמה החדשה חלשה מדי — לפחות ${MIN_LENGTH} תווים`;
    case 'auth/too-many-requests':
      return 'היו יותר מדי ניסיונות. נסו שוב בעוד כמה דקות';
    case 'auth/network-request-failed':
      return 'אין חיבור לרשת';
    default:
      return 'שינוי הסיסמה נכשל. נסו שוב';
  }
}

export default function ChangePasswordScreen({ navigation }: any) {
  const { user, changePassword, resetPassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  // איפוס במייל, למי שאינו זוכר את הסיסמה הנוכחית ולכן לא יכול
  // למלא את הטופס שמעל
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  // שגיאה שנשארת על המסך בזמן שמתקנים את השדה מבלבלת יותר משהיא עוזרת
  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setError('');
  };

  const onSave = async () => {
    if (!current || !next || !confirm) {
      setError('צריך למלא את שלושת השדות');
      return;
    }
    if (next.length < MIN_LENGTH) {
      setError(`הסיסמה החדשה צריכה להיות באורך ${MIN_LENGTH} תווים לפחות`);
      return;
    }
    if (next !== confirm) {
      setError('הסיסמה החדשה ואימות הסיסמה אינם זהים');
      return;
    }
    if (next === current) {
      setError('הסיסמה החדשה זהה לנוכחית');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (e: any) {
      setError(errorText(e?.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    if (!user?.email || resetting) return;
    setError('');
    setResetting(true);
    try {
      await resetPassword(user.email);
      setResetSent(true);
    } catch {
      setError('שליחת הקישור נכשלה. בדקו את החיבור ונסו שוב');
    } finally {
      setResetting(false);
    }
  };

  if (done) {
    return (
      <View style={styles.centered}>
        <Text style={styles.doneEmoji}>🔐</Text>
        <Text style={styles.doneTitle}>הסיסמה הוחלפה</Text>
        <Text style={styles.doneBody}>בכניסה הבאה מכל מכשיר תשתמשו בסיסמה החדשה.</Text>
        <Button
          label="חזרה"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.account}>{user?.email}</Text>

          <Text style={styles.label}>הסיסמה הנוכחית</Text>
          <TextInput
            style={styles.input}
            value={current}
            onChangeText={edit(setCurrent)}
            secureTextEntry={!reveal}
            autoCapitalize="none"
            textAlign="right"
            placeholder="הסיסמה שאיתה נכנסתם"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>סיסמה חדשה</Text>
          <TextInput
            style={styles.input}
            value={next}
            onChangeText={edit(setNext)}
            secureTextEntry={!reveal}
            autoCapitalize="none"
            textAlign="right"
            placeholder={`לפחות ${MIN_LENGTH} תווים`}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>אימות הסיסמה החדשה</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={edit(setConfirm)}
            secureTextEntry={!reveal}
            autoCapitalize="none"
            textAlign="right"
            placeholder="שוב, כדי לוודא"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity onPress={() => setReveal((r) => !r)} hitSlop={8}>
            <Text style={styles.reveal}>{reveal ? 'הסתרת הסיסמאות' : 'הצגת הסיסמאות'}</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="שמירת הסיסמה"
            onPress={onSave}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />
        </View>

        {/* מי שאינו זוכר את הסיסמה הנוכחית לא יכול למלא את הטופס שמעל.
            קודם כתוב כאן שצריך לפנות למי שפתח את החשבון — זה כבר לא
            נכון מאז שנוסף איפוס עצמי. */}
        <View style={styles.forgotCard}>
          <Text style={styles.forgotTitle}>לא זוכרים את הסיסמה הנוכחית?</Text>
          {resetSent ? (
            <View style={styles.sentRow}>
              <Ionicons name="checkmark-circle" size={17} color={colors.success} />
              <Text style={styles.sentText}>
                שלחנו קישור לאיפוס אל {user?.email}. כדאי להציץ גם בספאם.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.forgotBody}>
                נשלח קישור לכתובת שלכם, ותוכלו לבחור סיסמה חדשה בלי לדעת את הישנה.
              </Text>
              <Button
                label="שליחת קישור לאיפוס"
                variant="secondary"
                onPress={onForgot}
                loading={resetting}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.md },
  centered: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  account: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: font.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  reveal: {
    fontSize: font.small,
    color: colors.blueAccent,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  error: {
    fontSize: font.small,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  forgotCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadow.soft,
  },
  forgotTitle: {
    fontSize: font.bodyLg,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  forgotBody: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  sentRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.xs + 2 },
  sentText: {
    flex: 1,
    fontSize: font.small,
    fontWeight: font.weight.semibold,
    color: colors.success,
    textAlign: 'right',
    lineHeight: 19,
  },
  hint: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  doneEmoji: { fontSize: 56, marginBottom: spacing.md },
  doneTitle: {
    fontSize: font.title,
    fontWeight: font.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  doneBody: {
    fontSize: font.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});
