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
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import Button from '../components/Button';
import DatePickerModal from '../components/DatePickerModal';
import { createFamily, joinFamily } from '../services/familySetup';
import { colors, spacing, radius, font, shadow } from '../config/theme';

const MIN_PASSWORD = 6;

/** קוד הזמנה שהגיע מקישור, כדי שמי שלוחץ עליו לא יצטרך להקליד כלום */
function inviteFromUrl(): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('invite')?.toUpperCase() ?? '';
}

function errorText(code: string) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'כבר קיים חשבון עם האימייל הזה. אפשר להתחבר איתו.';
    case 'auth/invalid-email':
      return 'כתובת האימייל לא תקינה';
    case 'auth/weak-password':
      return `הסיסמה חלשה מדי — לפחות ${MIN_PASSWORD} תווים`;
    case 'auth/network-request-failed':
      return 'אין חיבור לרשת';
    case 'invite/not-found':
      return 'קוד ההזמנה לא נמצא. כדאי לבדוק אותו שוב.';
    case 'invite/used':
      return 'כבר השתמשו בהזמנה הזו. בקשו מבן המשפחה הזמנה חדשה.';
    case 'invite/expired':
      return 'ההזמנה פגה. בקשו הזמנה חדשה.';
    default:
      return 'ההרשמה נכשלה. נסו שוב.';
  }
}

export default function SignUpScreen({ navigation, route }: any) {
  const { signUp } = useAuth();
  const { beginSetup, refresh } = useHousehold();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invite, setInvite] = useState<string>(route?.params?.code ?? inviteFromUrl());
  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // מצטרף להזמנה נכנס למשפחה שכבר קיימת — פרטי התינוק/ת כבר מולאו בה
  const joining = invite.trim().length > 0;

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setError('');
  };

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('צריך אימייל וסיסמה');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`הסיסמה צריכה להיות באורך ${MIN_PASSWORD} תווים לפחות`);
      return;
    }
    if (!joining && !babyName.trim()) {
      setError('מה השם של התינוק או התינוקת?');
      return;
    }

    setError('');
    setLoading(true);
    // מהרגע שהחשבון נוצר ועד שהמשפחה נכתבת, המשתמש מחובר אך בלי שיוך —
    // זה אומר להקשר להמתין במקום להציג "לא משויך למשפחה"
    beginSetup();
    try {
      const cleanEmail = email.trim().toLowerCase();
      const uid = await signUp(cleanEmail, password);
      if (joining) {
        await joinFamily(uid, cleanEmail, invite);
      } else {
        await createFamily(uid, cleanEmail, {
          name: babyName.trim(),
          birthDate,
          familyName: familyName.trim(),
        });
      }
      await refresh();
    } catch (e: any) {
      setError(errorText(e?.code ?? e?.message ?? ''));
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🌸</Text>
        <Text style={styles.title}>{joining ? 'הצטרפות למשפחה' : 'פתיחת משפחה חדשה'}</Text>
        <Text style={styles.subtitle}>
          {joining
            ? 'יש לכם הזמנה — תיכנסו לתיעוד המשותף של המשפחה'
            : 'ההרשמה פותחת משפחה משלכם. אפשר יהיה לצרף אליה עוד שניים.'}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>אימייל</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={edit(setEmail)}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
            placeholder="האימייל שלכם"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>סיסמה</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={edit(setPassword)}
            secureTextEntry
            autoCapitalize="none"
            textAlign="right"
            placeholder={`לפחות ${MIN_PASSWORD} תווים`}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>קוד הזמנה</Text>
          <TextInput
            style={styles.input}
            value={invite}
            onChangeText={(v) => edit(setInvite)(v.toUpperCase())}
            autoCapitalize="characters"
            textAlign="right"
            placeholder="רק אם בן משפחה הזמין אתכם"
            placeholderTextColor={colors.textMuted}
          />

          {!joining ? (
            <>
              <Text style={styles.label}>שם התינוק או התינוקת</Text>
              <TextInput
                style={styles.input}
                value={babyName}
                onChangeText={edit(setBabyName)}
                textAlign="right"
                placeholder="אפשר לשנות אחר כך"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>תאריך לידה</Text>
              <TouchableOpacity style={styles.input} onPress={() => setPickerOpen(true)}>
                <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
                  {birthDate ? new Date(birthDate).toLocaleDateString('he-IL') : 'בחירת תאריך'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>שם המשפחה</Text>
              <TextInput
                style={styles.input}
                value={familyName}
                onChangeText={edit(setFamilyName)}
                textAlign="right"
                placeholder="לברכה בדף הבית"
                placeholderTextColor={colors.textMuted}
              />
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={joining ? 'הצטרפות' : 'פתיחת המשפחה'}
            onPress={onSubmit}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={styles.link}>כבר יש לכם חשבון? לכניסה</Text>
        </TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={pickerOpen}
        value={birthDate}
        onSelect={setBirthDate}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emoji: { fontSize: 48, textAlign: 'center' },
  title: {
    fontSize: font.titleLg,
    fontWeight: font.weight.heavy,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
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
  dateText: { fontSize: font.body, color: colors.text, textAlign: 'right' },
  datePlaceholder: { color: colors.textMuted },
  error: {
    fontSize: font.small,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  link: {
    fontSize: font.small,
    color: colors.blueAccent,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
