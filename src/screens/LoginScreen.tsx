import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import TextField from '../components/TextField';
import Banner from '../components/Banner';
import BrandMark from '../components/BrandMark';
import { colors, spacing, type, TOUCH, CONTENT_MAX } from '../config/theme';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('צריך למלא אימייל וסיסמה');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      setError('האימייל או הסיסמה שגויים');
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
        <BrandMark title="המשפחה שלנו" subtitle="התיעוד של התינוק או התינוקת, במקום אחד" />

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
          <TextField
            label="סיסמה"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError('');
            }}
            password
            autoCapitalize="none"
            autoComplete="current-password"
            placeholder="הסיסמה שלכם"
          />

          {error ? <Banner tone="error" text={error} /> : null}

          <Button label="כניסה" onPress={handleLogin} loading={loading} />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.linkBtn}
            accessibilityRole="button"
          >
            <Text style={styles.link}>שכחתי סיסמה</Text>
          </TouchableOpacity>
        </Card>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          style={styles.linkBtn}
          accessibilityRole="button"
        >
          <Text style={styles.signUp}>אין לכם חשבון? פתיחת משפחה חדשה</Text>
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
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', marginTop: spacing.sm },
  link: { ...type.smallStrong, color: colors.sage, textAlign: 'center' },
  signUp: { ...type.bodyStrong, color: colors.sage, textAlign: 'center' },
});
