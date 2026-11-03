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
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import BabyNavigator from '../screens/baby/BabyNavigator';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerTitleAlign: 'center' as const,
  headerBackTitle: 'חזרה',
};

export default function AppNavigator() {
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
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
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
                    style={homeButtonStyles.button}
                    accessibilityLabel="חזרה לדף הבית"
                  >
                    <Ionicons name="home-outline" size={20} color={colors.text} />
                    <Text style={homeButtonStyles.label}>בית</Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: 'שינוי סיסמה 🔐' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// יעד מגע של 44 — החץ שהוחלף היה 30, מתחת לרף
const homeButtonStyles = StyleSheet.create({
  button: {
    minWidth: 44,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
});
