import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { colors, spacing, radius, font, shadow } from '../config/theme';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onSend = async () => {
    if (!email.trim()) {
      setError('צריך למלא אימייל');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      // כתובת פגומה היא טעות הקלדה ושווה לומר אותה. על כל השאר, כולל
      // "אין חשבון כזה", מציגים את אותו אישור — אחרת המסך הזה הופך
      // לכלי לבדוק אילו כתובות רשומות במערכת.
      if (e?.code === 'auth/invalid-email') {
        setError('כתובת האימייל לא תקינה');
      } else if (e?.code === 'auth/network-request-failed') {
        setError('אין חיבור לרשת');
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>📬</Text>
        <Text style={styles.title}>שלחנו מייל</Text>
        <Text style={styles.body}>
          אם יש חשבון עם הכתובת הזו, מחכה בה עכשיו קישור לבחירת סיסמה חדשה.
          כדאי להציץ גם בתיקיית הספאם.
        </Text>
        <Button
          label="חזרה לכניסה"
          onPress={() => navigation.navigate('Login')}
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
      <View style={styles.inner}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.title}>שכחתם סיסמה</Text>
        <Text style={styles.body}>נשלח אליכם קישור לבחירת סיסמה חדשה.</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
            placeholder="האימייל שלכם"
            placeholderTextColor={colors.textMuted}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="שליחת קישור" onPress={onSend} loading={loading} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={styles.link}>חזרה לכניסה</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: spacing.sm },
  title: {
    fontSize: font.titleLg,
    fontWeight: font.weight.heavy,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: font.body,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
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
    marginBottom: spacing.xs,
  },
  link: {
    fontSize: font.small,
    color: colors.blueAccent,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
