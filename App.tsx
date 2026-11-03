import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { HouseholdProvider } from './src/context/HouseholdContext';
import { BabyLogsProvider } from './src/context/BabyLogsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HouseholdProvider>
          <BabyLogsProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </BabyLogsProvider>
        </HouseholdProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
