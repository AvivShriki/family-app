import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import TextField from '../components/TextField';
import Banner from '../components/Banner';
import BrandMark from '../components/BrandMark';
import { colors, spacing, type, TOUCH, CONTENT_MAX } from '../config/theme';

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
        <View style={styles.doneMark}>
          <MaterialCommunityIcons name="email-check-outline" size={34} color={colors.sage} />
        </View>
        <Text style={[type.h2, styles.center]}>שלחנו מייל</Text>
        <Text style={[type.body, styles.center, styles.body]}>
          אם יש חשבון עם הכתובת הזו, מחכה בה עכשיו קישור לבחירת סיסמה חדשה. כדאי להציץ גם בתיקיית
          הספאם.
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandMark title="שכחתם סיסמה" subtitle="נשלח אליכם קישור לבחירת סיסמה חדשה" />

        <Card>
          <TextField
            label="אימייל"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="האימייל שלכם"
          />
          {error ? <Banner tone="error" text={error} /> : null}
          <Button label="שליחת קישור" onPress={onSend} loading={loading} />
        </Card>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkBtn}
          accessibilityRole="button"
        >
          <Text style={styles.link}>חזרה לכניסה</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },
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
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  body: { marginTop: spacing.xs, maxWidth: 340 },
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', marginTop: spacing.sm },
  link: { ...type.smallStrong, color: colors.sage, textAlign: 'center' },
});
