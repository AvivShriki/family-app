import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius } from '../config/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('אנא מלא אימייל וסיסמה');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      setError('אימייל או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.emoji}>🌸</Text>
        <Text style={styles.title}>המשפחה שלנו</Text>
        <Text style={styles.subtitle}>אביב, נוי וליבי 💕</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="אימייל"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="סיסמה"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.btnText}>כניסה</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: { fontSize: 60, marginBottom: spacing.sm },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.pinkDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.pinkAccent,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  errorText: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
});
