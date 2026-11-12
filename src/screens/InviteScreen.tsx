import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useBabyProfile } from '../hooks/useBabyProfile';
import Button from '../components/Button';
import { createInvite } from '../services/familySetup';
import { colors, spacing, radius, font, shadow } from '../config/theme';

const MAX_MEMBERS = 3;

/** הכתובת שאליה הקישור מוביל — אותה כתובת שממנה האפליקציה נטענת */
function inviteLink(code: string): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return code;
  return `${window.location.origin}${window.location.pathname}?invite=${code}`;
}

export default function InviteScreen() {
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { profile } = useBabyProfile();
  const [members, setMembers] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!householdId) return;
    getDoc(doc(db, 'households', householdId))
      .then((snap) => setMembers(snap.exists() ? (snap.data().members?.length ?? 1) : 1))
      .catch(() => setMembers(null));
  }, [householdId]);

  const full = members !== null && members >= MAX_MEMBERS;

  const onCreate = async () => {
    if (!householdId || !user) return;
    setError('');
    setLoading(true);
    try {
      setCode(await createInvite(householdId, user.uid, profile.familyName));
    } catch {
      setError('יצירת ההזמנה נכשלה. נסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('ההעתקה נכשלה — אפשר לסמן את הקישור ולהעתיק ידנית.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>הוספת בן משפחה 👨‍👩‍👧</Text>
        <Text style={styles.body}>
          שלחו את הקישור למי שתרצו שיתעד יחד אתכם. הוא נכנס לאותו תיעוד בדיוק,
          ורואה את כל מה שאתם רואים.
        </Text>

        {members !== null ? (
          <Text style={styles.count}>
            במשפחה כרגע {members} מתוך {MAX_MEMBERS}
          </Text>
        ) : null}

        {code ? (
          <>
            <View style={styles.codeBox}>
              <Text style={styles.code} selectable>
                {inviteLink(code)}
              </Text>
            </View>
            <TouchableOpacity style={styles.copyRow} onPress={onCopy} accessibilityLabel="העתקת הקישור">
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={colors.blueAccent}
              />
              <Text style={styles.copyText}>{copied ? 'הועתק' : 'העתקת הקישור'}</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              הקישור תקף לשבוע ומשמש פעם אחת. אם הוא פג או כבר נוצל — פשוט צרו חדש.
            </Text>
          </>
        ) : (
          <Button
            label={full ? `המשפחה מלאה (${MAX_MEMBERS})` : 'יצירת קישור הזמנה'}
            onPress={onCreate}
            loading={loading}
            disabled={full}
            style={{ marginTop: spacing.md }}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  title: {
    fontSize: font.title,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  body: { fontSize: font.body, color: colors.textLight, textAlign: 'right', lineHeight: 22 },
  count: {
    fontSize: font.small,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  codeBox: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  code: { fontSize: font.small, color: colors.text, textAlign: 'center' },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
  },
  copyText: { fontSize: font.body, fontWeight: font.weight.semibold, color: colors.blueAccent },
  hint: {
    fontSize: font.caption,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 17,
  },
  error: {
    fontSize: font.small,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
