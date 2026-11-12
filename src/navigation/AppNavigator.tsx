import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import LoginScreen from '../screens/LoginScreen';
import NoHouseholdScreen from '../screens/NoHouseholdScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import InviteScreen from '../screens/InviteScreen';
import InviteWelcomeScreen from '../screens/InviteWelcomeScreen';
import ChatScreen from '../screens/ChatScreen';
import MedicationsScreen from '../screens/baby/MedicationsScreen';
import BabyDayScreen from '../screens/baby/BabyDayScreen';
import BabyProfileScreen from '../screens/baby/BabyProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import MainTabs from './MainTabs';
import Loader from '../components/Loader';
import { BabyDateProvider } from '../screens/baby/BabyDateContext';
import { colors, spacing, radius, font, type, TOUCH } from '../config/theme';

const Stack = createNativeStackNavigator();

/** קוד הזמנה מהכתובת, אם הגיעו דרך קישור שיתוף */
function inviteCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('invite')?.toUpperCase() ?? '';
}

// הכותרת על הרקע ולא על לבן: כך היא לא נקראת כמשטח נוסף מעל המסך,
// והמסך מתחיל בלי קו הפרדה אופקי.
const headerStyle = {
  headerStyle: { backgroundColor: colors.cream },
  headerShadowVisible: false,
  headerTintColor: colors.sage,
  headerTitleStyle: {
    fontFamily: font.family,
    fontWeight: font.weight.bold,
    fontSize: font.size.h3,
    color: colors.text,
  },
  headerTitleAlign: 'center' as const,
  headerBackTitle: 'חזרה',
};

/**
 * שבב ניווט בכותרת.
 *
 * הוא יושב בקצה ימין ולא שמאל, שם ש-react-navigation שם את חץ החזרה
 * כברירת מחדל: בעברית מתחילים לסרוק מימין, וחץ חזרה בשמאל הוא הדבר
 * האחרון שהעין מגיעה אליו. הוא גם שבב ולא חץ עירום, כדי שייראה נלחץ.
 */
function HeaderChip({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={chip.touch}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      <View style={chip.pill}>
        <Ionicons name={icon} size={15} color={colors.sage} />
        <Text style={chip.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

/** כותרת של מסך פנימי: הכותרת במרכז, והחזרה כשבב בקצה ימין */
const backHeader =
  (title: string) =>
  ({ navigation }: any) => ({
    title,
    headerLeft: () => null,
    headerRight: () => (
      <HeaderChip label="חזרה" icon="chevron-forward" onPress={() => navigation.goBack()} />
    ),
  });

export default function AppNavigator() {
  const inviteCode = inviteCodeFromUrl();
  const { user, loading } = useAuth();
  const { householdId, loading: householdLoading } = useHousehold();

  // ממתינים גם לשיוך המשפחה — בלי זה המסכים נפתחים בלי לדעת לאיזה תא לפנות
  if (loading || (user && householdLoading)) {
    return <Loader />;
  }

  return (
    <NavigationContainer>
      {/* התאריך הנבחר משותף ללוח, לציר היומי ולסיכומים — ולכן הוא עוטף
          את כל המדור המחובר, ולא רק את הטאבים */}
      <BabyDateProvider>
        <Stack.Navigator screenOptions={headerStyle}>
          {!user ? (
            <>
              {/* מי שהגיע עם קישור הזמנה רואה קודם לאן הוזמן, ורק אז טופס */}
              {inviteCode ? (
                <Stack.Screen
                  name="InviteWelcome"
                  component={InviteWelcomeScreen}
                  initialParams={{ code: inviteCode }}
                  options={{ headerShown: false }}
                />
              ) : null}
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen
                name="SignUp"
                component={SignUpScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : !householdId ? (
            <Stack.Screen
              name="NoHousehold"
              component={NoHouseholdScreen}
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
              <Stack.Screen
                name="BabyDay"
                component={BabyDayScreen}
                options={backHeader('הציר היומי')}
              />
              <Stack.Screen
                name="BabyProfile"
                component={BabyProfileScreen}
                options={backHeader('פרטי התינוקת')}
              />
              <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={backHeader('שינוי סיסמה')}
              />
              <Stack.Screen
                name="Invite"
                component={InviteScreen}
                options={backHeader('הוספת בן משפחה')}
              />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={backHeader('המשפחה שלנו')}
              />
              <Stack.Screen
                name="Medications"
                component={MedicationsScreen}
                options={backHeader('תרופות ותוספים')}
              />
            </>
          )}
        </Stack.Navigator>
      </BabyDateProvider>
    </NavigationContainer>
  );
}

// השבב עצמו 32 בגובה, ועטוף במגע של 44 כדי לעמוד ביעד המגע.
const chip = StyleSheet.create({
  touch: { height: TOUCH, justifyContent: 'center', paddingLeft: spacing.xs },
  pill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.sageSoft,
  },
  label: { ...type.caption, color: colors.sage, fontWeight: '700' },
});
