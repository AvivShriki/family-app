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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import Button from '../components/Button';
import Card from '../components/Card';
import TextField from '../components/TextField';
import Banner from '../components/Banner';
import BrandMark from '../components/BrandMark';
import DatePickerModal from '../components/DatePickerModal';
import { createFamily, joinFamily } from '../services/familySetup';
import { colors, spacing, radius, type, TOUCH, CONTENT_MAX } from '../config/theme';

const MIN_PASSWORD = 6;
const MAX_MEMBERS = 3;

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
        <BrandMark
          title={joining ? 'הצטרפות למשפחה' : 'פתיחת משפחה חדשה'}
          subtitle={
            joining
              ? 'יש לכם הזמנה — תיכנסו לתיעוד המשותף של המשפחה'
              : `ההרשמה פותחת משפחה משלכם. אפשר לצרף אליה עוד ${MAX_MEMBERS - 1} אנשים.`
          }
        />

        <Card>
          <TextField
            label="אימייל"
            value={email}
            onChangeText={edit(setEmail)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="האימייל שלכם"
          />

          <TextField
            label="סיסמה"
            value={password}
            onChangeText={edit(setPassword)}
            password
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder={`לפחות ${MIN_PASSWORD} תווים`}
          />

          <TextField
            label="קוד הזמנה"
            value={invite}
            onChangeText={(v) => edit(setInvite)(v.toUpperCase())}
            autoCapitalize="characters"
            placeholder="רק אם בן משפחה הזמין אתכם"
            hint={joining ? 'הקוד זוהה — אתם מצטרפים למשפחה קיימת' : undefined}
          />

          {!joining ? (
            <>
              <TextField
                label="שם התינוק או התינוקת"
                value={babyName}
                onChangeText={edit(setBabyName)}
                placeholder="אפשר לשנות אחר כך"
              />

              <View style={styles.fieldWrap}>
                <Text style={type.label}>תאריך לידה</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="תאריך לידה, לבחירה"
                >
                  <Ionicons name="calendar-outline" size={19} color={colors.sage} />
                  <Text
                    style={[type.bodyStrong, styles.pickerText, !birthDate && styles.placeholder]}
                  >
                    {birthDate ? new Date(birthDate).toLocaleDateString('he-IL') : 'בחירת תאריך'}
                  </Text>
                  <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TextField
                label="שם המשפחה"
                value={familyName}
                onChangeText={edit(setFamilyName)}
                placeholder="לברכה בדף הבית"
              />
            </>
          ) : null}

          {error ? <Banner tone="error" text={error} /> : null}

          <Button
            label={joining ? 'הצטרפות' : 'פתיחת המשפחה'}
            onPress={onSubmit}
            loading={loading}
          />
        </Card>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkBtn}
          accessibilityRole="button"
        >
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },
  fieldWrap: { marginBottom: spacing.md, gap: spacing.xs },
  picker: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH + 6,
  },
  pickerText: { flex: 1 },
  placeholder: { ...type.body, color: colors.textMuted },
  linkBtn: { minHeight: TOUCH, justifyContent: 'center', marginTop: spacing.sm },
  link: { ...type.smallStrong, color: colors.sage, textAlign: 'center' },
});
