import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import BabyNavigator from '../screens/baby/BabyNavigator';
import { colors, spacing, radius } from '../config/theme';

const Stack = createNativeStackNavigator();

/** קוד הזמנה מהכתובת, אם הגיעו דרך קישור שיתוף */
function inviteCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('invite')?.toUpperCase() ?? '';
}

const headerStyle = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerTitleAlign: 'center' as const,
  headerBackTitle: 'חזרה',
};

export default function AppNavigator() {
  const inviteCode = inviteCodeFromUrl();
  const { user, loading } = useAuth();
  const { householdId, loading: householdLoading } = useHousehold();
  const { profile } = useBabyProfile();

  // ממתינים גם לשיוך המשפחה — בלי זה המסכים נפתחים בלי לדעת לאיזה תא לפנות
  if (loading || (user && householdLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.pinkAccent} size="large" />
      </View>
    );
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
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            {/* היציאה ממדור התינוקת: חץ ה-stack היה 30×30 ובקצה שמאל, שזה
                הצד שאליו מסיימים לסרוק בעברית. במקומו כפתור 44 עם המילה
                "בית" בקצה ימין, ו-popToTop שמחזיר מכל טאב. */}
            <Stack.Screen
              name="Baby"
              component={BabyNavigator}
              options={({ navigation }) => ({
                title: `מעקב ${profile.name} 👶`,
                headerLeft: () => null,
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => navigation.popToTop()}
                    style={homeButtonStyles.touch}
                    accessibilityLabel="חזרה לדף הבית"
                    activeOpacity={0.7}
                  >
                    <View style={homeButtonStyles.pill}>
                      <Ionicons name="home" size={15} color={colors.text} />
                      <Text style={homeButtonStyles.label}>בית</Text>
                    </View>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: 'שינוי סיסמה 🔐' }}
            />
            <Stack.Screen
              name="Invite"
              component={InviteScreen}
              options={{ title: 'הוספת בן משפחה' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'הודעות למשפחה 💬' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// הכפתור הוא שבב, לא טקסט מרחף: הרקע נותן לו גבול ברור ומסמן שהוא
// נלחץ. השבב עצמו 32 בגובה, ועטוף במגע של 44 כדי לעמוד ביעד המגע.
const homeButtonStyles = StyleSheet.create({
  touch: { height: 44, justifyContent: 'center', paddingLeft: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.creamDark,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
});
