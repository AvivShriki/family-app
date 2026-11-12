import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useBabyProfile } from '../hooks/useBabyProfile';
import LoginScreen from '../screens/LoginScreen';
import NoHouseholdScreen from '../screens/NoHouseholdScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import InviteScreen from '../screens/InviteScreen';
import InviteWelcomeScreen from '../screens/InviteWelcomeScreen';
import ChatScreen from '../screens/ChatScreen';
import MedicationsScreen from '../screens/baby/MedicationsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import BabyNavigator from '../screens/baby/BabyNavigator';
import Loader from '../components/Loader';
import { colors, spacing, radius, font, type, TOUCH } from '../config/theme';

const Stack = createNativeStackNavigator();

/** קוד הזמנה מהכתובת, אם הגיעו דרך קישור שיתוף */
function inviteCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('invite')?.toUpperCase() ?? '';
}

// הכותרת על הקרם ולא על לבן: כך היא לא נקראת כמשטח נוסף מעל המסך,
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
  const { profile } = useBabyProfile();

  // ממתינים גם לשיוך המשפחה — בלי זה המסכים נפתחים בלי לדעת לאיזה תא לפנות
  if (loading || (user && householdLoading)) {
    return <Loader />;
  }

  return (
    <NavigationContainer>
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
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
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
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            {/* היציאה ממדור התינוקת: חץ ה-stack היה 30×30 ובקצה שמאל, שזה
                הצד שאליו מסיימים לסרוק בעברית. במקומו שבב 44 עם המילה
                "בית" בקצה ימין, ו-popToTop שמחזיר מכל טאב. */}
            <Stack.Screen
              name="Baby"
              component={BabyNavigator}
              options={({ navigation }) => ({
                title: `מעקב ${profile.name}`,
                headerLeft: () => null,
                headerRight: () => (
                  <HeaderChip
                    label="בית"
                    icon="home-outline"
                    onPress={() => navigation.popToTop()}
                  />
                ),
              })}
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
              options={backHeader('הודעות למשפחה')}
            />
            <Stack.Screen
              name="Medications"
              component={MedicationsScreen}
              options={backHeader('תרופות ותוספים')}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

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
      style={homeButton.touch}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      <View style={homeButton.pill}>
        <Ionicons name={icon} size={15} color={colors.sage} />
        <Text style={homeButton.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// השבב עצמו 32 בגובה, ועטוף במגע של 44 כדי לעמוד ביעד המגע.
const homeButton = StyleSheet.create({
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
