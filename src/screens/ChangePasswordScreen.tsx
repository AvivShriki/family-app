import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import TextField from '../components/TextField';
import Banner from '../components/Banner';
import { colors, spacing, type, CONTENT_MAX } from '../config/theme';

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
  const { user, changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

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

  if (done) {
    return (
      <View style={styles.centered}>
        <View style={styles.doneMark}>
          <Ionicons name="shield-checkmark-outline" size={34} color={colors.success} />
        </View>
        <Text style={[type.h2, styles.center]}>הסיסמה הוחלפה</Text>
        <Text style={[type.body, styles.center, styles.doneBody]}>
          בכניסה הבאה מכל מכשיר תשתמשו בסיסמה החדשה.
        </Text>
        <Button label="חזרה" onPress={() => navigation.goBack()} style={styles.doneBtn} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.account}>
            <Ionicons name="person-circle-outline" size={20} color={colors.textMuted} />
            <Text style={type.small}>{user?.email}</Text>
          </View>

          <TextField
            label="הסיסמה הנוכחית"
            value={current}
            onChangeText={edit(setCurrent)}
            password
            autoCapitalize="none"
            autoComplete="current-password"
            placeholder="הסיסמה שאיתה נכנסתם"
          />
          <TextField
            label="סיסמה חדשה"
            value={next}
            onChangeText={edit(setNext)}
            password
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder={`לפחות ${MIN_LENGTH} תווים`}
          />
          <TextField
            label="אימות הסיסמה החדשה"
            value={confirm}
            onChangeText={edit(setConfirm)}
            password
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="שוב, כדי לוודא"
          />

          {error ? <Banner tone="error" text={error} /> : null}

          <Button label="שמירת הסיסמה" onPress={onSave} loading={loading} />
        </Card>

        <Text style={[type.small, styles.hint]}>
          {'מי ששכח את הסיסמה לגמרי יכול לאפס אותה ממסך הכניסה, דרך "שכחתי סיסמה".'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: {
    padding: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },
  account: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  hint: { textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.sm },

  centered: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  doneMark: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  doneBody: { marginTop: spacing.xs, maxWidth: 320 },
  doneBtn: { marginTop: spacing.lg, alignSelf: 'stretch', maxWidth: 420 },
});
