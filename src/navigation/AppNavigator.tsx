import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import BabyNavigator from '../screens/baby/BabyNavigator';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerBackTitle: 'חזרה',
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
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
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'לוח שנה 📅' }} />
            <Stack.Screen name="Shopping" component={ShoppingScreen} options={{ title: 'רשימת קניות 🛒' }} />
            <Stack.Screen name="Baby" component={BabyNavigator} options={{ title: 'מעקב ליבי 👶' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
