import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import Button from '../components/Button';
import { previewDeletion, purgeUserData, DeletionPreview } from '../services/accountDeletion';
import { colors, spacing, radius, font, shadow } from '../config/theme';
import { useProfile } from '../context/ProfileContext';

/**
 * מחיקת חשבון.
 *
 * המסך הזה קיים כדי שהמשתמש ידע בדיוק מה הוא מוחק, כי יש כאן שני
 * מצבים שונים לגמרי: מי שיש לו בן משפחה נוסף פשוט יוצא, והתיעוד
 * נשאר. מי שלבד מוחק איתו את כל התיעוד. ההבדל הזה אינו ניתן לניחוש,
 * ולכן הוא נשלף מהשרת ומוצג לפני שמבקשים סיסמה.
 */
function errorText(code: string) {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'הסיסמה שגויה';
    case 'auth/too-many-requests':
      return 'היו יותר מדי ניסיונות. נסו שוב בעוד כמה דקות';
    case 'auth/network-request-failed':
      return 'אין חיבור לרשת';
    default:
      return 'המחיקה נכשלה. שום דבר לא נמחק — אפשר לנסות שוב';
  }
}

export default function DeleteAccountScreen() {
  const { user, reauthenticate, deleteAuthAccount } = useAuth();
  const { householdId } = useHousehold();
  const { profile } = useProfile();

  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !householdId) return;
    let alive = true;
    previewDeletion(user.uid, householdId)
      .then((p) => alive && setPreview(p))
      .catch(() => alive && setError('לא הצלחנו לבדוק מה יימחק. נסו לרענן.'));
    return () => {
      alive = false;
    };
  }, [user, householdId]);

  const onDelete = async () => {
    if (!user?.email || !householdId || !preview || busy) return;
    setError('');
    setBusy(true);
    try {
      // סדר קשיח: אימות, ניקוי הנתונים, ורק בסוף החשבון. אם הניקוי
      // נכשל באמצע, המשתמש עדיין יכול להיכנס ולנסות שוב — ההפך היה
      // משאיר נתונים שאיש לא יכול להגיע אליהם.
      await reauthenticate(password);
      await purgeUserData(user.uid, user.email, householdId, preview.isLastMember);
      await deleteAuthAccount();
      // מכאן ההקשר מזהה שאין משתמש, והניווט חוזר למסך הכניסה
    } catch (e: any) {
      setError(errorText(e?.code ?? ''));
      setBusy(false);
    }
  };

  const last = preview?.isLastMember;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.badge}>
          <Ionicons name="trash-outline" size={30} color={colors.danger} />
        </View>

        <Text style={styles.title}>מחיקת החשבון</Text>
        <Text style={styles.account}>{user?.email}</Text>

        {!preview ? (
          // בלי הענף הזה כישלון בבדיקה משאיר את המסך על "בודקים…"
          // לנצח, בלי שום רמז למה
          error ? (
            <View style={styles.card}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : (
            <Text style={styles.loading}>בודקים מה יימחק…</Text>
          )
        ) : (
          <View style={styles.card}>
            {last ? (
              <>
                <Text style={styles.heading}>אתם החבר האחרון במשפחה</Text>
                <Text style={styles.body}>
                  מחיקת החשבון תמחק גם את כל התיעוד של {profile.name}. אין למי להשאיר אותו.
                </Text>
                <View style={styles.countBox}>
                  <Text style={styles.count}>{preview.logs.toLocaleString('he-IL')}</Text>
                  <Text style={styles.countLabel}>רישומים יימחקו</Text>
                </View>
                <Text style={styles.warn}>הפעולה אינה הפיכה. אין שחזור.</Text>
              </>
            ) : (
              <>
                <Text style={styles.heading}>אתם יוצאים מהמשפחה</Text>
                <Text style={styles.body}>
                  החשבון שלכם יימחק, אבל התיעוד של {profile.name} יישאר אצל שאר בני המשפחה.
                  {'\n\n'}
                  כדי לחזור תצטרכו הזמנה חדשה מהם.
                </Text>
              </>
            )}

            <Text style={styles.label}>הסיסמה שלכם, לאישור</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              textAlign="right"
              placeholder="הסיסמה שאיתה נכנסתם"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="הסיסמה שלכם"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={last ? 'מחיקת החשבון והתיעוד' : 'מחיקת החשבון'}
              variant="danger"
              onPress={onDelete}
              loading={busy}
              disabled={!password}
            />
          </View>
        )}

        <Text style={styles.hint}>
          רק רוצים להפסיק לקבל גישה במכשיר הזה? אפשר פשוט לצאת מההגדרות, בלי למחוק כלום.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FBECEA',
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
  account: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loading: { fontSize: font.body, color: colors.textLight, textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  heading: {
    fontSize: font.title,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: font.body,
    color: colors.textLight,
    textAlign: 'right',
    lineHeight: 23,
    marginBottom: spacing.md,
  },
  countBox: {
    backgroundColor: '#FBECEA',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  count: { fontSize: 30, fontWeight: font.weight.heavy, color: colors.danger },
  countLabel: { fontSize: font.small, color: colors.danger, marginTop: 2 },
  warn: {
    fontSize: font.small,
    fontWeight: font.weight.bold,
    color: colors.danger,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: font.small,
    fontWeight: font.weight.semibold,
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
  error: {
    fontSize: font.small,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.lg,
  },
});
