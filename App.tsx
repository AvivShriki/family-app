import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { HouseholdProvider } from './src/context/HouseholdContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HouseholdProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </HouseholdProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
