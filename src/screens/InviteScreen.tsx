import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useBabyProfile } from '../hooks/useBabyProfile';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import Banner from '../components/Banner';
import SectionHeader from '../components/SectionHeader';
import { createInvite } from '../services/familySetup';
import { colors, spacing, radius, type, TOUCH } from '../config/theme';

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
    <Screen>
      <SectionHeader title="הוספת בן משפחה" />
      <Card>
        <Text style={type.body}>
          שלחו את הקישור למי שתרצו שיתעד יחד אתכם. הוא נכנס לאותו תיעוד בדיוק, ורואה את כל מה שאתם
          רואים.
        </Text>

        {members !== null ? (
          <View style={styles.counter}>
            {/* מחוון מקומות: שלושה עיגולים, המלאים הם מי שכבר במשפחה */}
            <View style={styles.pips}>
              {Array.from({ length: MAX_MEMBERS }, (_, i) => (
                <View key={i} style={[styles.pip, i < members && styles.pipFull]} />
              ))}
            </View>
            <Text style={type.smallStrong}>
              {members} מתוך {MAX_MEMBERS} במשפחה
            </Text>
          </View>
        ) : null}

        {code ? (
          <>
            <View style={styles.codeBox}>
              <Text style={styles.code} selectable>
                {inviteLink(code)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.copyRow}
              onPress={onCopy}
              accessibilityRole="button"
              accessibilityLabel="העתקת הקישור"
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={19}
                color={copied ? colors.success : colors.sage}
              />
              <Text style={[type.bodyStrong, { color: copied ? colors.success : colors.sage }]}>
                {copied ? 'הועתק' : 'העתקת הקישור'}
              </Text>
            </TouchableOpacity>
            <Text style={[type.small, styles.hint]}>
              הקישור תקף לשבוע ומשמש פעם אחת. אם הוא פג או כבר נוצל — פשוט צרו חדש.
            </Text>
          </>
        ) : (
          <Button
            label={full ? `המשפחה מלאה (${MAX_MEMBERS})` : 'יצירת קישור הזמנה'}
            icon={full ? undefined : 'person-add-outline'}
            onPress={onCreate}
            loading={loading}
            disabled={full}
            style={{ marginTop: spacing.md }}
          />
        )}

        {error ? <Banner tone="error" text={error} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pips: { flexDirection: 'row-reverse', gap: 4 },
  pip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  pipFull: { backgroundColor: colors.sage, borderColor: colors.sage },

  codeBox: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  code: { ...type.small, color: colors.text, textAlign: 'center' },
  copyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    minHeight: TOUCH,
  },
  hint: { textAlign: 'center' },
});
